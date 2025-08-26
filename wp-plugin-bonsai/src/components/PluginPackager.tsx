import React, { useState, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { packagePlugin } from '@/services/aiService';
import { Loader } from '@/components/Loader';
import { ModelSelector } from '@/components/ModelSelector';
import { CodeResultViewer } from '@/components/CodeResultViewer';
import { EmptyState } from '@/components/EmptyState';
import { ProviderStatus } from '@/types';
import { analyzePackageContents, getBoilerplateUninstall } from '@/services/localPluginPackager';
import type { PluginBuildResponse, AIModel, UploadedFile } from '@/types';
import { getFileIcon } from '@/components/icons/FileIcons';

interface PluginPackagerProps {
    providerStatus: ProviderStatus;
    enabledModels: AIModel[];
}

export function PluginPackager({ providerStatus, enabledModels }: PluginPackagerProps): React.ReactNode {
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PluginBuildResponse | null>(null);
    const [selectedModelId, setSelectedModelId] = useState<string>(enabledModels[0]?.id || '');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = async (files: FileList) => {
        const extracted: UploadedFile[] = [];
        for (const file of Array.from(files)) {
            if (file.name.toLowerCase().endsWith('.zip')) {
                const zip = await JSZip.loadAsync(file);
                for (const path in zip.files) {
                    const entry = zip.files[path];
                    if (!entry.dir) {
                        const content = await entry.async('string');
                        extracted.push({ name: path.split('/').pop()!, content, path });
                    }
                }
            } else {
                const content = await file.text();
                extracted.push({ name: file.name, content, path: file.name });
            }
        }
        setUploadedFiles(prev => [...prev, ...extracted]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(e.target.files);
            if (e.target) e.target.value = ''; // Reset file input
        }
    };
    
    const handlePackage = useCallback(async () => {
        if (uploadedFiles.length === 0) { setError('Please upload some files or a folder.'); return; }
        
        setStatus('Running local analysis...');
        setError(null);
        setResult(null);

        // Step 1: Perform local analysis
        const analysis = analyzePackageContents(uploadedFiles);
        
        let filesForAI = [...uploadedFiles];
        // Step 2: Handle missing uninstall.php locally if needed
        if (!analysis.hasUninstall) {
            const boilerplate = getBoilerplateUninstall();
            filesForAI.push({ name: boilerplate.fileName, content: boilerplate.code, path: boilerplate.fileName });
            analysis.hasUninstall = true; // Update analysis for the prompt
            setStatus('Added boilerplate uninstall.php. Preparing AI prompt...');
        } else {
            setStatus('Preparing AI prompt...');
        }

        try {
            // Step 3: Call AI for structuring and generating other missing files (readme, main file)
            const filesToPackage = filesForAI.map(({ name, content }) => ({ name, content }));
            setResult(await packagePlugin(filesToPackage, analysis, selectedModelId, providerStatus, setStatus));
        } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred.'); } 
        finally { setStatus(null); }
    }, [uploadedFiles, selectedModelId, providerStatus]);
    
    const isLoading = !!status;
    const isActionDisabled = isLoading || enabledModels.length === 0;

    return (
        <div className="max-w-4xl mx-auto">
            {!result && !isLoading && !error && uploadedFiles.length === 0 && <EmptyState mode="plugin-packager" />}
             <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">1. Upload your plugin files or folder</label>
                    <p className="text-xs text-slate-400 mb-2">You can upload individual files, a .zip archive, or a whole folder. The AI will organize them.</p>
                    <div className="border-2 border-dashed border-slate-600 rounded-md p-6 text-center">
                        <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} id="packager-upload" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-slate-700/50 text-slate-300 font-semibold rounded-lg hover:bg-slate-700 transition-colors flex flex-col items-center justify-center w-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span className="text-sm">Click to Upload Files or Folder</span>
                        </button>
                    </div>
                    {uploadedFiles.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-slate-300 mb-2">Uploaded Files:</h3>
                            <ul className="max-h-40 overflow-y-auto bg-slate-900/50 rounded-md p-2 space-y-1">
                                {uploadedFiles.map((file, index) => (
                                    <li key={`${file.path}-${index}`} className="text-xs font-mono text-slate-400 flex justify-between items-center p-1.5 rounded bg-slate-700/30">
                                        <div className="flex items-center truncate">
                                            {getFileIcon(file.name)}
                                            <span className="truncate">{file.path}</span>
                                        </div>
                                        <button onClick={() => setUploadedFiles(files => files.filter((_, i) => i !== index))} className="text-slate-500 hover:text-red-400 ml-2 flex-shrink-0">&times;</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="mt-4 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <ModelSelector models={enabledModels} selectedModelId={selectedModelId} onModelChange={setSelectedModelId} disabled={isActionDisabled} />
                    <button onClick={handlePackage} disabled={isActionDisabled} title={enabledModels.length === 0 ? "Please enable at least one AI provider" : ""} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 transition-colors shadow-lg shadow-indigo-600/30">
                        {isLoading ? (status || 'Packaging...') : 'Package Plugin'}
                    </button>
                </div>
            </div>

            <div className="mt-12">
                {isLoading && <Loader message={status}/>}
                {error && <div className="relative text-center p-4 bg-red-900/50 border border-red-500 rounded-lg">{error}<button onClick={() => setError(null)} className="absolute top-2 right-2 text-red-300 hover:text-white">&times;</button></div>}
                {result && <CodeResultViewer files={result.files} title="Packaged Plugin" defaultZipName={`${result.pluginName}.zip`} zipRootFolder={result.pluginName} />}
            </div>
        </div>
    );
}
