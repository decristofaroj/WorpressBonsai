


export type AppMode = 'wordpress' | 'integration' | 'plugin-builder' | 'file-editor' | 'plugin-packager';
export type Provider = 'Google' | 'OpenAI' | 'Anthropic';

// Fix: Added ProviderStatus type definition to be shared across the application.
export type ProviderStatus = Record<Provider, boolean>;

export interface AIModel {
  id: string;
  name: string;
  provider: Provider;
  modelName: string; 
}

export enum IssueCategory {
  Security = 'Security',
  Performance = 'Performance',
  BestPractices = 'Best Practices',
  Interoperability = 'Interoperability',
  CodeQuality = 'Code Quality',
}

export enum IssueSeverity {
  Critical = 'Critical',
  Warning = 'Warning',
  Info = 'Info',
}

export interface PluginFile {
  id: string;
  name: string;
  code: string;
  modified?: boolean;
}

export interface Plugin {
  id:string;
  name: string;
  zipName: string | null;
  files: PluginFile[];
}

export interface ReviewIssue {
  id?: string;
  pluginName: string;
  fileName: string;
  category: IssueCategory;
  severity: IssueSeverity;
  description: string;
  impact: string;
  suggestion: string;
  source?: 'Local Scanner' | 'AI Analysis';
}

export type ChangeType = 'REPLACE_BLOCK' | 'INSERT_BEFORE' | 'INSERT_AFTER' | 'DELETE_BLOCK';

export interface CodeChangeInstruction {
    type: ChangeType;
    startLine: number;
    endLine: number;
    content: string;
}

export interface FileModificationPlan {
    pluginName: string;
    fileName:string;
    changes: CodeChangeInstruction[];
}

export interface GeneratedFileResponse {
    fileName: string;
    code: string;
}

export interface BlueprintResponse {
    fileStructure: string;
    plan: string;
}

export interface WorkspaceScriptFile {
  fileName: string;
  code: string;
}

export interface WordPressCodeFile {
    fileName: string;
    code: string;
    language: 'php' | 'javascript' | 'css';
}

export interface IntegrationResponse {
  workspaceScript?: WorkspaceScriptFile;
  manifestFile?: WorkspaceScriptFile;
  wordpressCode?: WordPressCodeFile[];
  instructions: string;
}

export interface PluginBuildResponse {
  pluginName: string;
  files: {
    fileName: string;
    code: string;
  }[];
}

export interface Workspace {
  id: string;
  name: string;
  plugins: Plugin[];
  reviewIssues: ReviewIssue[] | null;
  mode: AppMode;
  selectedModelId: string;
  createdAt: string;
  history: Plugin[][]; // Array of plugin states
  historyIndex: number;
}

export interface ConfirmationState {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

// Fix: Added ChatMessage type for conversational AI features.
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// Fix: Added UploadedFile type for the plugin packager.
export interface UploadedFile {
    name: string;
    content: string;
    path: string;
}
