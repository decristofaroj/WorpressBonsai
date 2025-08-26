import type { Plugin, ReviewIssue, ChatMessage } from '@/types';
import { LocalPackageAnalysis } from '@/services/localPluginPackager';

const formatPluginsForPrompt = (plugins: Plugin[]): string => {
  return plugins
    .filter(p => p.files.some(f => f.code.trim()))
    .map(p => `--- PLUGIN NAME: "${p.name}" ---\n` + p.files.filter(f => f.code.trim()).map(f => `--- FILE NAME: "${f.name}" ---\n${f.code}\n--- END FILE: "${f.name}" ---`).join('\n') + `\n--- END PLUGIN: "${p.name}" ---`).join('\n');
};

const formatRawFilesForPrompt = (files: {name: string, content: string}[]): string => {
    return files.map(f => `--- FILE NAME: "${f.name}" ---\n${f.content}\n--- END FILE: "${f.name}" ---`).join('\n');
}

const formatMessagesForPrompt = (messages: ChatMessage[]): string => {
    return messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');
};

export const getPluginBuilderChatSystemPrompt = (): string => {
    return "You are a friendly and expert WordPress plugin architect. Your job is to help the user flesh out their idea for a plugin by having a conversation. Ask clarifying questions about features, admin pages, shortcodes, etc. to guide them towards a well-defined plan. Keep your responses concise and conversational.";
};

export const getReviewPrompt = (plugins: Plugin[]): string => {
  return `You are an expert WordPress security analyst. A local scanner has already checked for basic syntax errors. Focus on complex issues. Perform a comprehensive review of the provided WordPress plugins. Analyze for Security, Code Quality, Interoperability, Performance, and Best Practices. For each issue, provide a simple 'impact' statement for a non-technical user. Here are the plugins and their files: ${formatPluginsForPrompt(plugins)}.`;
};

export const getApplyFixPrompt = (plugins: Plugin[], issue: ReviewIssue): string => {
  return `You are an expert automated code correction tool. Your task is to generate a JSON object describing the exact changes to fix an issue. Do not return full code. Return a 'FileModificationPlan' JSON. --- CONTEXT --- ${formatPluginsForPrompt(plugins)} --- ISSUE TO FIX --- Plugin: "${issue.pluginName}", File: "${issue.fileName}", Description: ${issue.description}, Suggestion: ${issue.suggestion} --- END --- Now, provide the JSON object with the precise instructions to fix the file.`;
};

export const getGenerateFilePrompt = (plugin: Plugin, fileDescription: string): string => {
    return `You are an expert WordPress developer. Based on the provided plugin's code, generate a new file as described by the user.
    **User Request:** "a ${fileDescription}"
    **Your Task:** Generate the full code for the requested file and a suitable filename for it.
    --- PLUGIN CODE CONTEXT ---
    ${formatPluginsForPrompt([plugin])}
    --- END PLUGIN CODE CONTEXT ---`;
};

export const getBlueprintPrompt = (messages: ChatMessage[]): string => {
    return `You are a WordPress Plugin Architect. Based on the following conversation with a user, create a high-level blueprint for a new plugin.
    **Conversation:**
    ${formatMessagesForPrompt(messages)}
    **Your Task:** Provide a file structure schematic and a detailed plan describing the plugin's architecture and key functions.`;
};

export const getIntegrationAppPrompt = (userRequest: string): string => {
  return `You are an expert full-stack developer specializing in Google Workspace and WordPress integrations. Your user is a novice.
  **User Request:** "${userRequest}"
  **Your Task:** Adhere strictly to the request. Generate a complete solution that may involve both Google Apps Script and WordPress code. You must provide a robust, unified set of step-by-step instructions for a non-developer to implement the entire solution. Do not add any unrequested features.`;
};

export const getPluginBuildPrompt = (messages: ChatMessage[], inputFile: { name: string, content: string } | null): string => {
    const fileContext = inputFile ? `--- USER-PROVIDED STARTING FILE: ${inputFile.name} ---\nThis file was provided by the user as the primary starting point. Build the plugin based on this file and the conversation.\n${inputFile.content}\n--- END FILE ---` : '';
    return `You are a world-class WordPress Plugin Architect. Your task is to build a complete, production-ready WordPress plugin based on a conversation with a user. Adhere strictly to the final plan discussed.
    ${fileContext}
    **Conversation:**
    ${formatMessagesForPrompt(messages)}
    
    **Your Plan:**
    1. Design a logical file structure.
    2. Write all necessary PHP, JS, and CSS files, following WordPress coding standards.
    3. Generate a WordPress.org-compliant 'readme.txt' file.
    4. Generate a secure 'uninstall.php' file.
    **Output:** Return a single JSON object containing the plugin slug and a list of all files with their full code.`;
};

export const getPluginPackagePrompt = (files: {name: string, content: string}[], analysis: LocalPackageAnalysis): string => {
    const analysisReport: string[] = [];
    if (analysis.hasMainFile && analysis.mainFileName) {
        analysisReport.push(`- The main plugin file appears to be '${analysis.mainFileName}'.`);
        if(analysis.headerData.pluginName) analysisReport.push(`- The plugin name is '${analysis.headerData.pluginName}'.`);
    } else {
        analysisReport.push('- CRITICAL: A main plugin file with a standard WordPress header is missing.');
    }

    if (analysis.hasReadme) {
        analysisReport.push('- A readme.txt file was provided.');
    } else {
        analysisReport.push('- A WordPress.org-compliant readme.txt file is missing.');
    }

    if (analysis.hasUninstall) {
        analysisReport.push('- An uninstall.php file was provided.');
    } else {
        analysisReport.push('- A secure uninstall.php file is missing.');
    }
    
    const { php, js, css, pot, other } = analysis.fileTypes;
    if (php || js || css) {
       analysisReport.push(`- File types detected: ${php} PHP, ${js} JS, ${css} CSS, ${pot} POT, ${other} other.`);
    }


    return `You are an expert WordPress developer. You have been given a collection of raw code files. Your task is to organize these files into a coherent, installable WordPress plugin.
    
    **Local Analysis Report:**
    ${analysisReport.join('\n')}

    **Your Task:**
    1.  Based on the analysis, determine a suitable plugin name/slug.
    2.  Organize the provided files, creating a standard WordPress plugin structure (e.g., creating folders like 'js', 'css', 'includes', 'assets').
    3.  If a main plugin file is missing, you MUST create one with a proper header. If it exists, ensure the header is correct.
    4.  If a readme.txt file is missing, you MUST generate one based on the plugin's code. It must be comprehensive and follow WordPress.org standards.
    5.  If an uninstall.php file is missing, you MUST generate a secure, boilerplate version.
    
    **Provided Files:**
    ${formatRawFilesForPrompt(files)}
    
    **Output:** Return a single JSON object containing the plugin slug and a list of all files with their final paths and content.`;
};
