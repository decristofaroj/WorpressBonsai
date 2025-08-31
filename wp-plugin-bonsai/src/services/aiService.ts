// START ./wp-plugin-bonsai/src/services/aiService.ts
import { models } from '@/config/models';
// Fix: Imported ChatMessage and ProviderStatus from the centralized types file.
import type { Plugin, ReviewIssue, AIModel, Provider, IntegrationResponse, FileModificationPlan, PluginBuildResponse, GeneratedFileResponse, BlueprintResponse, ChatMessage, ProviderStatus } from '@/types';
import * as geminiService from '@/services/geminiService';
import * as openaiService from '@/services/openaiService';
import * as anthropicService from '@/services/anthropicService';
import { LocalPackageAnalysis } from '@/services/localPluginPackager';

// Fix: Updated function signatures for conversational AI and build processes.
type ReviewFunction = (plugins: Plugin[], modelName: string) => Promise<ReviewIssue[]>;
type FixFunction = (plugins: Plugin[], issue: ReviewIssue, modelName: string) => Promise<FileModificationPlan>;
type ChatFunction = (messages: ChatMessage[], modelName: string) => Promise<string>;
type IntegrationFunction = (prompt: string, modelName: string) => Promise<IntegrationResponse>;
type GenerateFileFunction = (plugin: Plugin, fileDescription: string, modelName: string) => Promise<GeneratedFileResponse>;
type BlueprintFunction = (messages: ChatMessage[], modelName: string) => Promise<BlueprintResponse>;
type PluginBuildFunction = (messages: ChatMessage[], inputFile: { name: string, content: string } | null, modelName: string) => Promise<PluginBuildResponse>;
type PluginPackageFunction = (files: {name: string, content: string}[], analysis: LocalPackageAnalysis, modelName: string) => Promise<PluginBuildResponse>;


const reviewRunners: Record<Provider, ReviewFunction> = { 'Google': geminiService.runGeminiReview, 'OpenAI': openaiService.runOpenAIReview, 'Anthropic': anthropicService.runAnthropicReview };
const fixRunners: Record<Provider, FixFunction> = { 'Google': geminiService.runGeminiFix, 'OpenAI': openaiService.runOpenAIFix, 'Anthropic': anthropicService.runAnthropicFix };
// Fix: Added chatRunners to handle conversational AI requests.
const chatRunners: Record<Provider, ChatFunction> = { 'Google': geminiService.runGeminiChat, 'OpenAI': openaiService.runOpenAIChat, 'Anthropic': anthropicService.runAnthropicChat };
const integrationRunners: Record<Provider, IntegrationFunction> = { 'Google': geminiService.runGeminiIntegration, 'OpenAI': openaiService.runOpenAIIntegration, 'Anthropic': anthropicService.runAnthropicIntegration };
const generateFileRunners: Record<Provider, GenerateFileFunction> = { 'Google': geminiService.runGeminiGenerateFile, 'OpenAI': openaiService.runOpenAIGenerateFile, 'Anthropic': anthropicService.runAnthropicGenerateFile };
const blueprintRunners: Record<Provider, BlueprintFunction> = { 'Google': geminiService.runGeminiBlueprint, 'OpenAI': openaiService.runOpenAIBlueprint, 'Anthropic': anthropicService.runAnthropicBlueprint };
const pluginBuildRunners: Record<Provider, PluginBuildFunction> = { 'Google': geminiService.runGeminiPluginBuild, 'OpenAI': openaiService.runOpenAIPluginBuild, 'Anthropic': anthropicService.runAnthropicPluginBuild };
const pluginPackageRunners: Record<Provider, PluginPackageFunction> = { 'Google': geminiService.runGeminiPluginPackage, 'OpenAI': openaiService.runOpenAIPluginPackage, 'Anthropic': anthropicService.runAnthropicPluginPackage };


async function executeWithFailover<T extends any[], R>(
    runners: Record<Provider, (...args: [...T, string]) => Promise<R>>,
    initialModelId: string,
    // Fix: Added providerStatus to enable dynamic model selection based on active providers.
    providerStatus: ProviderStatus,
    onFailover: (message: string) => void,
    ...args: T
): Promise<R> {
    const initialModel = models.find(m => m.id === initialModelId);
    if (!initialModel) throw new Error(`Model with ID ${initialModelId} not found.`);

    // Start with the selected model if its provider is enabled, then add others that are enabled
    const modelQueue: AIModel[] = [];
    if (providerStatus[initialModel.provider]) {
        modelQueue.push(initialModel);
    }
    modelQueue.push(...models.filter(m => m.id !== initialModelId && providerStatus[m.provider]));

    if (modelQueue.length === 0) {
        throw new Error("No AI providers are enabled. Please enable one in 'Manage Keys'.");
    }
    
    let lastError: Error | null = null;

    for (const model of modelQueue) {
        // This check is slightly redundant due to queue creation logic, but it's a good safeguard.
        if (!providerStatus[model.provider]) {
            onFailover(`${model.name}'s provider (${model.provider}) is disabled. Skipping.`);
            continue;
        }

        const runner = runners[model.provider];
        if (!runner) { onFailover(`No runner for ${model.provider}. Skipping.`); continue; }
        try {
            return await (runner as any)(...args, model.modelName);
        } catch (error: any) {
            lastError = error;
            const errorMessage = error.message?.toLowerCase() || '';

            // Critical errors that should stop the process immediately
            if (errorMessage.includes('api key is invalid')) {
                throw error; // Re-throw the specific error to be displayed to the user
            }
            if (errorMessage.includes('network error')) {
                // A network error on the client is likely to affect all providers.
                throw new Error("A network error occurred. Please check your connection and try again.");
            }
            
            // Service-specific, transient errors that should allow failover
            if (errorMessage.includes('rate limit exceeded')) {
                onFailover(`${model.name} quota exceeded. Trying next model...`);
                continue; 
            }
            
            // For other generic API errors, we also try to failover.
            onFailover(`An error occurred with ${model.name}. Trying next model...`);
            continue;
        }
    }
    throw lastError || new Error("All available and enabled AI models failed.");
}

// Fix: Updated all exported functions to accept and pass the providerStatus object.
export const runReview = (p: Plugin[], id: string, ps: ProviderStatus, fn: (m: string) => void) => executeWithFailover(reviewRunners, id, ps, fn, p);
export const getModificationPlan = (p: Plugin[], i: ReviewIssue, id: string, ps: ProviderStatus, fn: (m: string) => void) => executeWithFailover(fixRunners, id, ps, fn, p, i);
export const continuePluginChat = (m: ChatMessage[], id: string, ps: ProviderStatus, fn: (m: string) => void) => executeWithFailover(chatRunners, id, ps, fn, m);
export const generateIntegration = (p: string, id: string, ps: ProviderStatus, fn: (m: string) => void) => executeWithFailover(integrationRunners, id, ps, fn, p);
export const generateSingleFile = (p: Plugin, d: string, id: string, ps: ProviderStatus, fn: (m: string) => void) => executeWithFailover(generateFileRunners, id, ps, fn, p, d);
export const generateBlueprint = (m: ChatMessage[], id: string, ps: ProviderStatus, fn: (m: string) => void) => executeWithFailover(blueprintRunners, id, ps, fn, m);
export const buildPlugin = (m: ChatMessage[], f: { name: string, content: string } | null, id: string, ps: ProviderStatus, fn: (m: string) => void) => executeWithFailover(pluginBuildRunners, id, ps, fn, m, f);
export const packagePlugin = (f: {name: string, content: string}[], a: LocalPackageAnalysis, id: string, ps: ProviderStatus, fn: (m: string) => void) => executeWithFailover(pluginPackageRunners, id, ps, fn, f, a);
// END ./wp-plugin-bonsai/src/services/aiService.ts
