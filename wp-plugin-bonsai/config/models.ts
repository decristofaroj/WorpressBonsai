import { AIModel } from '../types';

export const models: AIModel[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    modelName: 'gemini-2.5-flash',
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    modelName: 'claude-3-5-sonnet-20240620',
  },
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    provider: 'OpenAI',
    modelName: 'gpt-4o',
  },
  {
    id: 'codex',
    name: 'OpenAI Codex (GPT-4o)',
    provider: 'OpenAI',
    modelName: 'gpt-4o',
  },
];