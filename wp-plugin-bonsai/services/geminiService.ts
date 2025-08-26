import { GoogleGenAI, Type, Content } from '@google/genai';
// Fix: Added ChatMessage to the import list and corrected path to use alias.
import type { ReviewIssue, Plugin, IntegrationResponse, FileModificationPlan, PluginBuildResponse, GeneratedFileResponse, BlueprintResponse, ChatMessage } from '../types';
import * as schemas from '../config/schemas';
import * as prompts from './prompts';
import { LocalPackageAnalysis } from './localPluginPackager';

const getAiInstance = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return null;
    }
    // Fix: Pass apiKey as a named parameter according to Gemini API guidelines.
    return new GoogleGenAI({ apiKey });
}

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

const GEMINI_API_ERROR_MSG = "[Gemini] API key not configured. Please set the API_KEY environment variable.";

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
    const parsedResponse = JSON.parse(response.text) as { review: ReviewIssue[] };
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
    return JSON.parse(response.text) as FileModificationPlan;
  } catch (error) {
      handleGeminiError(error);
      throw error; // Re-throw after handling
  }
};

// Fix: Implemented runGeminiChat to handle conversational AI for the Plugin Builder.
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
                // Fix: Correctly called getPluginBuilderChatSystemPrompt from prompts service.
                systemInstruction: { parts: [{ text: prompts.getPluginBuilderChatSystemPrompt() }] },
            }
        });
        return response.text;
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
    return JSON.parse(response.text) as IntegrationResponse;
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
        return JSON.parse(response.text) as GeneratedFileResponse;
    } catch(error) {
        handleGeminiError(error);
        throw error;
    }
};

// Fix: Updated function signature to accept a ChatMessage array instead of a single prompt string.
export const runGeminiBlueprint = async (messages: ChatMessage[], modelName: string): Promise<BlueprintResponse> => {
    const ai = getAiInstance();
    if (!ai) throw new Error(GEMINI_API_ERROR_MSG);
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            // Fix: Passed the message array to the updated getBlueprintPrompt function.
            contents: [{role: 'user', parts: [{text: prompts.getBlueprintPrompt(messages)}] }],
            config: { responseMimeType: "application/json", responseSchema: convertSchemaForGemini(schemas.blueprintSchema) },
        });
        return JSON.parse(response.text) as BlueprintResponse;
    } catch(error) {
        handleGeminiError(error);
        throw error;
    }
};

// Fix: Updated function signature to accept a ChatMessage array and an optional input file.
export const runGeminiPluginBuild = async (messages: ChatMessage[], inputFile: { name: string, content: string } | null, modelName: string): Promise<PluginBuildResponse> => {
    const ai = getAiInstance();
    if (!ai) throw new Error(GEMINI_API_ERROR_MSG);
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            // Fix: Passed messages and inputFile to the updated getPluginBuildPrompt function.
            contents: [{role: 'user', parts: [{text: prompts.getPluginBuildPrompt(messages, inputFile)}] }],
            config: { responseMimeType: "application/json", responseSchema: convertSchemaForGemini(schemas.pluginBuildSchema) },
        });
        return JSON.parse(response.text) as PluginBuildResponse;
    } catch(error) {
        handleGeminiError(error);
        throw error;
    }
};

// Fix: Updated function signature to accept the local analysis object.
export const runGeminiPluginPackage = async (files: {name: string, content: string}[], analysis: LocalPackageAnalysis, modelName: string): Promise<PluginBuildResponse> => {
    const ai = getAiInstance();
    if (!ai) throw new Error(GEMINI_API_ERROR_MSG);
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            // Fix: Passed both files and analysis to the getPluginPackagePrompt function.
            contents: [{role: 'user', parts: [{text: prompts.getPluginPackagePrompt(files, analysis)}] }],
            config: { responseMimeType: "application/json", responseSchema: convertSchemaForGemini(schemas.pluginBuildSchema) },
        });
        return JSON.parse(response.text) as PluginBuildResponse;
    } catch(error) {
        handleGeminiError(error);
        throw error;
    }
};
