// START ./wp-plugin-bonsai/src/services/openaiService.ts
import OpenAI from 'openai';
import type { Plugin, ReviewIssue, IntegrationResponse, FileModificationPlan, PluginBuildResponse, GeneratedFileResponse, BlueprintResponse, ChatMessage } from '@/types';
import * as schemas from '@/config/schemas';
import * as prompts from '@/services/prompts';
import { LocalPackageAnalysis } from '@/services/localPluginPackager';

const getAiInstance = () => {
    const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return null;
    return new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true });
}

const handleOpenAIError = (error: any, provider: string = 'OpenAI') => {
    if (error instanceof OpenAI.AuthenticationError) {
        throw new Error(`[${provider}] API key is invalid.`);
    }
    if (error instanceof OpenAI.RateLimitError) {
        throw new Error(`[${provider}] Rate limit exceeded.`);
    }
    if (error instanceof OpenAI.APIConnectionError) {
        throw new Error(`[${provider}] Network error.`);
    }
     if (error instanceof SyntaxError) {
        throw new Error(`[${provider}] API returned invalid JSON.`);
    }
    throw new Error(`[${provider}] API Error: ${error.message}`);
};

async function callOpenAIChatAPI<T>(modelName: string, messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): Promise<T> {
    const openai = getAiInstance();
    if (!openai) throw new Error("[OpenAI] API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.");
    try {
        const response = await openai.chat.completions.create({ model: modelName, messages, response_format: { type: 'json_object' } });
        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("OpenAI returned an empty response.");
        return JSON.parse(content) as T;
    } catch (e) {
        handleOpenAIError(e);
        throw e; // Re-throw after handling
    }
}

export const runOpenAIChat = async (messages: ChatMessage[], modelName: string): Promise<string> => {
    const openai = getAiInstance();
    if (!openai) throw new Error("[OpenAI] API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.");

    const openAiMessages = messages.map(m => ({
        ...m,
        role: m.role === 'model' ? 'assistant' : m.role,
    })) as OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam[];

    try {
        const response = await openai.chat.completions.create({
            model: modelName,
            messages: [
                { role: 'system', content: prompts.getPluginBuilderChatSystemPrompt() },
                ...openAiMessages
            ],
        });
        return response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    } catch(e) {
        handleOpenAIError(e);
        throw e;
    }
};

export const runOpenAIReview = async (plugins: Plugin[], modelName: string): Promise<ReviewIssue[]> => {
  const result = await callOpenAIChatAPI<{ review: ReviewIssue[] }>(modelName, [
    { role: 'system', content: `You MUST respond with a JSON object that strictly adheres to the following JSON schema: ${JSON.stringify(schemas.reviewSchema)}` },
    { role: 'user', content: prompts.getReviewPrompt(plugins) }
  ]);
  return result.review.map(issue => ({ ...issue, source: 'AI Analysis' }));
};

export const runOpenAIFix = async (plugins: Plugin[], issue: ReviewIssue, modelName: string): Promise<FileModificationPlan> => {
  return callOpenAIChatAPI<FileModificationPlan>(modelName, [
    { role: 'system', content: `You MUST respond with a JSON object that strictly adheres to the following JSON schema: ${JSON.stringify(schemas.fixSchema)}` },
    { role: 'user', content: prompts.getApplyFixPrompt(plugins, issue) }
  ]);
};

export const runOpenAIIntegration = async (prompt: string, modelName: string): Promise<IntegrationResponse> => {
  return callOpenAIChatAPI<IntegrationResponse>(modelName, [
    { role: 'system', content: `You MUST respond with a JSON object that strictly adheres to the following JSON schema: ${JSON.stringify(schemas.integrationAppSchema)}` },
    { role: 'user', content: prompts.getIntegrationAppPrompt(prompt) }
  ]);
};

export const runOpenAIGenerateFile = async (plugin: Plugin, fileDescription: string, modelName: string): Promise<GeneratedFileResponse> => {
    return callOpenAIChatAPI<GeneratedFileResponse>(modelName, [
        { role: 'system', content: `You MUST respond with a JSON object that strictly adheres to the following JSON schema: ${JSON.stringify(schemas.generateFileSchema)}` },
        { role: 'user', content: prompts.getGenerateFilePrompt(plugin, fileDescription) }
    ]);
};

export const runOpenAIBlueprint = async (messages: ChatMessage[], modelName: string): Promise<BlueprintResponse> => {
    return callOpenAIChatAPI<BlueprintResponse>(modelName, [
        { role: 'system', content: `You MUST respond with a JSON object that strictly adheres to the following JSON schema: ${JSON.stringify(schemas.blueprintSchema)}` },
        { role: 'user', content: prompts.getBlueprintPrompt(messages) }
    ]);
};

export const runOpenAIPluginBuild = async (messages: ChatMessage[], inputFile: { name: string, content: string } | null, modelName: string): Promise<PluginBuildResponse> => {
  return callOpenAIChatAPI<PluginBuildResponse>(modelName, [
    { role: 'system', content: `You MUST respond with a JSON object that strictly adheres to the following JSON schema: ${JSON.stringify(schemas.pluginBuildSchema)}` },
    { role: 'user', content: prompts.getPluginBuildPrompt(messages, inputFile) }
  ]);
};

export const runOpenAIPluginPackage = async (files: {name: string, content: string}[], analysis: LocalPackageAnalysis, modelName: string): Promise<PluginBuildResponse> => {
  return callOpenAIChatAPI<PluginBuildResponse>(modelName, [
    { role: 'system', content: `You MUST respond with a JSON object that strictly adheres to the following JSON schema: ${JSON.stringify(schemas.pluginBuildSchema)}` },
    { role: 'user', content: prompts.getPluginPackagePrompt(files, analysis) }
  ]);
};
// END ./wp-plugin-bonsai/src/services/openaiService.ts
