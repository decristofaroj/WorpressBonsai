// START ./wp-plugin-bonsai/src/services/geminiService.ts
import { GoogleGenAI, Type, Content } from '@google/genai';
import type { ReviewIssue, Plugin, IntegrationResponse, FileModificationPlan, PluginBuildResponse, GeneratedFileResponse, BlueprintResponse, ChatMessage } from '@/types';
import * as schemas from '@/config/schemas';
import * as prompts from '@/services/prompts';
import { LocalPackageAnalysis } from '@/services/localPluginPackager';

const getAiInstance = () => {
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

const getResponseText = (response: { text?: string }, context: string): string => {
    if (!response.text) {
        throw new Error(`[Gemini] Empty response from ${context}.`);
    }
    return response.text;
};

const convertSchemaForGemini = (schema: any): any => {
    if (!schema || !schema.type) return {};
    if (schema.type === 'object') {
        return {
            type: Type.OBJECT,
            properties: Object.entries(schema.properties).reduce((acc, [key, value]) => {
                acc[key] = convertSchemaForGemini(value);
                return acc;
            }, {} as any),
            required: schema.required,
        };
    }
    if (schema.type === 'array') {
        return {
            type: Type.ARRAY,
            items: schema.items ? convertSchemaForGemini(schema.items) : { type: Type.STRING },
        };
    }
    const geminiType = schema.type.toUpperCase();
    if (Object.values(Type).includes(geminiType as Type)) {
        return { type: geminiType as Type };
    }
    return { type: Type.STRING }; // Fallback for unknown types
};

const GEMINI_API_ERROR_MSG = "[Gemini] API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.";

const handleGeminiError = (error: any, provider: string = 'Gemini') => {
    const message = error.toString().toLowerCase();
    if (message.includes('api key not valid')) {
        throw new Error(`[${provider}] API key is invalid.`);
    }
    if (message.includes('429') || message.includes('rate limit')) {
        throw new Error(`[${provider}] Rate limit exceeded.`);
    }
    if (message.includes('fetch') || message.includes('network')) {
        throw new Error(`[${provider}] Network error.`);
    }
     if (error instanceof SyntaxError) {
        throw new Error(`[${provider}] API returned invalid JSON.`);
    }
    throw new Error(`[${provider}] API Error: ${error.message}`);
};

export const runGeminiReview = async (plugins: Plugin[], modelName: string): Promise<ReviewIssue[]> => {
  const ai = getAiInstance();
  if (!ai) throw new Error(GEMINI_API_ERROR_MSG);
  try {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: [{role: 'user', parts: [{text: prompts.getReviewPrompt(plugins)}] }],
        config: { responseMimeType: "application/json", responseSchema: convertSchemaForGemini(schemas.reviewSchema) },
    });
    const parsedResponse = JSON.parse(getResponseText(response, 'review')) as { review: ReviewIssue[] };
    return parsedResponse.review.map(issue => ({ ...issue, source: 'AI Analysis' }));
  } catch (error) {
      handleGeminiError(error);
      return []; // Should not be reached due to throw
  }
};

export const runGeminiFix = async (plugins: Plugin[], issue: ReviewIssue, modelName: string): Promise<FileModificationPlan> => {
  const ai = getAiInstance();
  if (!ai) throw new Error(GEMINI_API_ERROR_MSG);
  try {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: [{role: 'user', parts: [{text: prompts.getApplyFixPrompt(plugins, issue)}] }],
        config: { responseMimeType: "application/json", responseSchema: convertSchemaForGemini(schemas.fixSchema) },
    });
    return JSON.parse(getResponseText(response, 'fix')) as FileModificationPlan;
  } catch (error) {
      handleGeminiError(error);
      throw error; // Re-throw after handling
  }
};

export const runGeminiChat = async (messages: ChatMessage[], modelName: string): Promise<string> => {
    const ai = getAiInstance();
    if (!ai) throw new Error(GEMINI_API_ERROR_MSG);
    try {
        const contents: Content[] = messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }],
        }));

        const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
                systemInstruction: { parts: [{ text: prompts.getPluginBuilderChatSystemPrompt() }] },
            }
        });
        return getResponseText(response, 'chat');
    } catch (error) {
        handleGeminiError(error);
        throw error;
    }
};

export const runGeminiIntegration = async (prompt: string, modelName: string): Promise<IntegrationResponse> => {
  const ai = getAiInstance();
  if (!ai) throw new Error(GEMINI_API_ERROR_MSG);
  try {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: [{role: 'user', parts: [{text: prompts.getIntegrationAppPrompt(prompt)}] }],
        config: { responseMimeType: "application/json", responseSchema: convertSchemaForGemini(schemas.integrationAppSchema) },
    });
    return JSON.parse(getResponseText(response, 'integration')) as IntegrationResponse;
  } catch (error) {
    handleGeminiError(error);
    throw error;
  }
};

export const runGeminiGenerateFile = async (plugin: Plugin, fileDescription: string, modelName: string): Promise<GeneratedFileResponse> => {
    const ai = getAiInstance();
    if (!ai) throw new Error(GEMINI_API_ERROR_MSG);
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{role: 'user', parts: [{text: prompts.getGenerateFilePrompt(plugin, fileDescription)}] }],
            config: { responseMimeType: "application/json", responseSchema: convertSchemaForGemini(schemas.generateFileSchema) },
        });
        return JSON.parse(getResponseText(response, 'generate file')) as GeneratedFileResponse;
    } catch(error) {
        handleGeminiError(error);
        throw error;
    }
};

export const runGeminiBlueprint = async (messages: ChatMessage[], modelName: string): Promise<BlueprintResponse> => {
    const ai = getAiInstance();
    if (!ai) throw new Error(GEMINI_API_ERROR_MSG);
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{role: 'user', parts: [{text: prompts.getBlueprintPrompt(messages)}] }],
            config: { responseMimeType: "application/json", responseSchema: convertSchemaForGemini(schemas.blueprintSchema) },
        });
        return JSON.parse(getResponseText(response, 'blueprint')) as BlueprintResponse;
    } catch(error) {
        handleGeminiError(error);
        throw error;
    }
};

export const runGeminiPluginBuild = async (messages: ChatMessage[], inputFile: { name: string, content: string } | null, modelName: string): Promise<PluginBuildResponse> => {
    const ai = getAiInstance();
    if (!ai) throw new Error(GEMINI_API_ERROR_MSG);
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{role: 'user', parts: [{text: prompts.getPluginBuildPrompt(messages, inputFile)}] }],
            config: { responseMimeType: "application/json", responseSchema: convertSchemaForGemini(schemas.pluginBuildSchema) },
        });
        return JSON.parse(getResponseText(response, 'plugin build')) as PluginBuildResponse;
    } catch(error) {
        handleGeminiError(error);
        throw error;
    }
};

export const runGeminiPluginPackage = async (files: {name: string, content: string}[], analysis: LocalPackageAnalysis, modelName: string): Promise<PluginBuildResponse> => {
    const ai = getAiInstance();
    if (!ai) throw new Error(GEMINI_API_ERROR_MSG);
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{role: 'user', parts: [{text: prompts.getPluginPackagePrompt(files, analysis)}] }],
            config: { responseMimeType: "application/json", responseSchema: convertSchemaForGemini(schemas.pluginBuildSchema) },
        });
        return JSON.parse(getResponseText(response, 'plugin package')) as PluginBuildResponse;
    } catch(error) {
        handleGeminiError(error);
        throw error;
    }
};
// END ./wp-plugin-bonsai/src/services/geminiService.ts
