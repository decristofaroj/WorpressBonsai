import React from 'react';
import type { AppMode } from '@/types';

interface EmptyStateProps {
    mode: AppMode | 'results' | 'plugin-packager';
}

const config = {
    'wordpress': {
        title: "WordPress Plugin Reviewer",
        description: "Upload at least one plugin zip file to analyze it for security, performance, and best practice issues.",
    },
    'file-editor': {
        title: "File Editor & Fixer",
        description: "Upload or paste code into the editor to start analyzing and fixing a single file.",
    },
    'integration': {
        title: "Integration Builder",
        description: "Describe an integration you want to build between WordPress and Google Workspace in the prompt box above.",
    },
    'plugin-builder': {
        title: "WordPress Plugin Builder",
        description: "Start the conversation by describing the plugin you want to create. You can also upload a file for the AI to use as context.",
    },
    'plugin-packager': {
        title: "WordPress Plugin Packager",
        description: "Upload your plugin's files (or a zip archive) and the AI will organize them into a complete, installable plugin.",
    },
    'results': {
        title: "All Clear!",
        description: "The analysis completed successfully and no issues were found. Great job!",
    }
}

export function EmptyState({ mode }: EmptyStateProps): React.ReactNode {
    const { title, description } = config[mode] || {};

    return (
        <div className="text-center p-8 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-lg my-8">
            <h2 className={`text-2xl font-bold ${mode === 'results' ? 'text-emerald-400' : 'text-slate-200'}`}>{title}</h2>
            <p className="text-slate-400 mt-2 max-w-xl mx-auto">{description}</p>
        </div>
    );
}
