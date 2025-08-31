// START ./wp-plugin-bonsai/src/components/IntegrationBuilder.tsx
import React, { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import { generateIntegration } from '@/services/aiService';
import { Loader } from '@/components/Loader';
import { ModelSelector } from '@/components/ModelSelector';
import type { IntegrationResponse, AIModel, ProviderStatus } from '@/types';
import { CodeResultViewer } from '@/components/CodeResultViewer';
import { EmptyState } from '@/components/EmptyState';

interface IntegrationBuilderProps {
    providerStatus: ProviderStatus;
    enabledModels: AIModel[];
}

export function IntegrationBuilder({ providerStatus, enabledModels }: IntegrationBuilderProps): React.ReactNode {
    const [prompt, setPrompt] = useState<string>('');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<IntegrationResponse | null>(null);
    const [selectedModelId, setSelectedModelId] = useState<string>(enabledModels[0]?.id || '');

    const handleSubmit = useCallback(async () => {
        if (!prompt.trim()) { setError('Please describe the integration you want to build.'); return; }
        setStatus('Generating integration...');
        setError(null);
        setResult(null);
        try {
            const response = await generateIntegration(prompt, selectedModelId, providerStatus, setStatus);
            setResult(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setStatus(null);
        }
    }, [prompt, selectedModelId, providerStatus]);
    
    const isLoading = !!status;
    const isActionDisabled = isLoading || enabledModels.length === 0;

    const downloadAs = (format: 'txt' | 'html' | 'pdf') => {
        if (!result) return;
        const filename = promptForFilename(`instructions.${format}`);
        if (!filename) return;

        if (format === 'pdf') {
            const doc = new jsPDF();
            doc.text(result.instructions, 10, 10, { maxWidth: 180 });
            doc.save(filename);
            return;
        }

        const element = document.createElement('a');
        let file;
        if (format === 'html') {
            const htmlContent = `<!DOCTYPE html><html><head><title>Integration Instructions</title><style>body{font-family:sans-serif;line-height:1.6;padding:20px;white-space:pre-wrap;}</style></head><body><h1>Instructions</h1><p>${result.instructions.replace(/\n/g, '<br>')}</p></body></html>`;
            file = new Blob([htmlContent], { type: 'text/html' });
        } else {
            file = new Blob([result.instructions], { type: 'text/plain' });
        }
        element.href = URL.createObjectURL(file);
        element.download = filename;
        element.click();
        URL.revokeObjectURL(element.href);
    };

    const promptForFilename = (defaultName: string): string | null => {
        return window.prompt("Enter a filename for the download:", defaultName);
    };
    
    const getResultFiles = () => {
        if (!result) return [];
        const files = [];
        if (result.workspaceScript) files.push({ fileName: result.workspaceScript.fileName, code: result.workspaceScript.code });
        if (result.manifestFile) files.push({ fileName: result.manifestFile.fileName, code: result.manifestFile.code });
        if (result.wordpressCode) files.push(...result.wordpressCode.map(f => ({ fileName: f.fileName, code: f.code })));
        return files;
    };

    return (
        <div className="max-w-4xl mx-auto">
            {!result && !isLoading && !error && <EmptyState mode="integration" />}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg">
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., When a new WooCommerce order is placed, add a row to my Google Sheet..." className="w-full h-32 p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={isLoading} />
                <div className="mt-4 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <ModelSelector models={enabledModels} selectedModelId={selectedModelId} onModelChange={setSelectedModelId} disabled={isActionDisabled} />
                    <button onClick={handleSubmit} disabled={isActionDisabled} title={enabledModels.length === 0 ? "Please enable at least one AI provider" : ""} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 transition-colors shadow-lg shadow-indigo-600/30">{isLoading ? (status || 'Generating...') : 'Build Integration'}</button>
                </div>
            </div>

            <div className="mt-12">
                {isLoading && <Loader message={status}/>}
                {error && <div className="relative text-center p-4 bg-red-900/50 border border-red-500 rounded-lg">{error}<button onClick={() => setError(null)} className="absolute top-2 right-2 text-red-300 hover:text-white">&times;</button></div>}
                {result && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                       <h2 className="text-2xl font-bold text-emerald-400 mb-6">Your Integration is Ready!</h2>
                       {getResultFiles().length > 0 && <CodeResultViewer files={getResultFiles()} title="Generated Code" />}
                       <div className="mt-6">
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                                <h3 className="text-xl font-semibold text-slate-200">Unified Setup Instructions</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-400">Download as:</span>
                                    <button onClick={() => downloadAs('txt')} className="text-xs font-semibold bg-slate-700 px-2 py-1 rounded hover:bg-slate-600">TXT</button>
                                    <button onClick={() => downloadAs('html')} className="text-xs font-semibold bg-slate-700 px-2 py-1 rounded hover:bg-slate-600">HTML</button>
                                    <button onClick={() => downloadAs('pdf')} className="text-xs font-semibold bg-slate-700 px-2 py-1 rounded hover:bg-slate-600">PDF</button>
                                </div>
                            </div>
                            <div className="prose prose-slate prose-invert max-w-none p-4 border border-slate-700 rounded-lg whitespace-pre-wrap">{result.instructions}</div>
                       </div>
                    </div>
                )}
            </div>
        </div>
    );
}
// END ./wp-plugin-bonsai/src/components/IntegrationBuilder.tsx
