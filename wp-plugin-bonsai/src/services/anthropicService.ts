import Anthropic from '@anthropic-ai/sdk';
import type { Plugin, ReviewIssue, IntegrationResponse, FileModificationPlan, PluginBuildResponse, GeneratedFileResponse, BlueprintResponse, ChatMessage } from '@/types';
import * as schemas from '@/config/schemas';
import * as prompts from '@/services/prompts';
import { LocalPackageAnalysis } from '@/services/localPluginPackager';

const getAiInstance = () => {
    const ANTHROPIC_API_KEY = process.env.VITE_ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) return null;
    return new Anthropic({ apiKey: ANTHROPIC_API_KEY });
}

const handleAnthropicError = (error: any, provider: string = 'Anthropic') => {
    if (error instanceof Anthropic.AuthenticationError) {
        throw new Error(`[${provider}] API key is invalid.`);
    }
    if (error instanceof Anthropic.RateLimitError) {
        throw new Error(`[${provider}] Rate limit exceeded.`);
    }
    if (error instanceof Anthropic.APIConnectionError) {
        throw new Error(`[${provider}] Network error.`);
    }
     if (error instanceof SyntaxError) {
        throw new Error(`[${provider}] API returned invalid JSON.`);
    }
    throw new Error(`[${provider}] API Error: ${error.message}`);
};

async function callAnthropicTool<T>(modelName: string, messages: Anthropic.Messages.MessageParam[], schema: any, toolName: string): Promise<T> {
    const anthropic = getAiInstance();
    if (!anthropic) throw new Error("[Anthropic] API key not configured. Please add VITE_ANTHROPIC_API_KEY to your .env file.");
    
    try {
        const response = await anthropic.messages.create({
            model: modelName,
            max_tokens: 4096,
            messages: messages,
            tools: [{ name: toolName, description: `Format the response using this JSON schema.`, input_schema: schema }],
            tool_choice: { type: 'tool', name: toolName },
        });

        const toolCall = response.content.find(block => block.type === 'tool_use');
        if (toolCall && 'input' in toolCall) return toolCall.input as T;

        const textBlock = response.content.find(block => block.type === 'text');
        if (textBlock && 'text' in textBlock) {
            // Anthropic sometimes wraps the JSON in markdown, so we strip it.
            const jsonText = textBlock.text.replace(/```json\n?/, '').replace(/```$/, '');
            return JSON.parse(jsonText) as T;
        }
        
        throw new Error("Anthropic returned an unexpected response format.");
    } catch (e) {
        handleAnthropicError(e);
        throw e; // Re-throw after handling
    }
}

export const runAnthropicChat = async (messages: ChatMessage[], modelName: string): Promise<string> => {
    const anthropic = getAiInstance();
    if (!anthropic) throw new Error("[Anthropic] API key not configured. Please add VITE_ANTHROPIC_API_KEY to your .env file.");

    const anthropicMessages = messages.map(m => ({
        role: (m.role === 'model' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content
    }));

    try {
        const response = await anthropic.messages.create({
            model: modelName,
            max_tokens: 4096,
            system: prompts.getPluginBuilderChatSystemPrompt(),
            messages: anthropicMessages,
        });
        
        const textBlock = response.content.find(block => block.type === 'text');
        if (textBlock && 'text' in textBlock) return textBlock.text;
        return "I'm sorry, I couldn't generate a response.";
    } catch (e) {
        handleAnthropicError(e);
        throw e;
    }
};

export const runAnthropicReview = async (plugins: Plugin[], modelName: string): Promise<ReviewIssue[]> => {
  const result = await callAnthropicTool<{ review: ReviewIssue[] }>(modelName, [{ role: 'user', content: prompts.getReviewPrompt(plugins) }], schemas.reviewSchema, 'format_review');
  return result.review.map(issue => ({ ...issue, source: 'AI Analysis' }));
};

export const runAnthropicFix = async (plugins: Plugin[], issue: ReviewIssue, modelName: string): Promise<FileModificationPlan> => {
  return callAnthropicTool<FileModificationPlan>(modelName, [{ role: 'user', content: prompts.getApplyFixPrompt(plugins, issue) }], schemas.fixSchema, 'format_fix');
};

export const runAnthropicIntegration = async (prompt: string, modelName: string): Promise<IntegrationResponse> => {
  return callAnthropicTool<IntegrationResponse>(modelName, [{ role: 'user', content: prompts.getIntegrationAppPrompt(prompt) }], schemas.integrationAppSchema, 'format_integration');
};

export const runAnthropicGenerateFile = async (plugin: Plugin, fileDescription: string, modelName: string): Promise<GeneratedFileResponse> => {
    return callAnthropicTool<GeneratedFileResponse>(modelName, [{ role: 'user', content: prompts.getGenerateFilePrompt(plugin, fileDescription)}], schemas.generateFileSchema, 'format_file_generation');
};

export const runAnthropicBlueprint = async (messages: ChatMessage[], modelName: string): Promise<BlueprintResponse> => {
    const prompt = prompts.getBlueprintPrompt(messages);
    return callAnthropicTool<BlueprintResponse>(modelName, [{ role: 'user', content: prompt }], schemas.blueprintSchema, 'format_blueprint');
};

export const runAnthropicPluginBuild = async (messages: ChatMessage[], inputFile: { name: string, content: string } | null, modelName: string): Promise<PluginBuildResponse> => {
    const prompt = prompts.getPluginBuildPrompt(messages, inputFile);
    return callAnthropicTool<PluginBuildResponse>(modelName, [{ role: 'user', content: prompt }], schemas.pluginBuildSchema, 'format_plugin_build');
};

export const runAnthropicPluginPackage = async (files: {name: string, content: string}[], analysis: LocalPackageAnalysis, modelName: string): Promise<PluginBuildResponse> => {
  const prompt = prompts.getPluginPackagePrompt(files, analysis);
  return callAnthropicTool<PluginBuildResponse>(modelName, [{ role: 'user', content: prompt }], schemas.pluginBuildSchema, 'format_plugin_package');
};
