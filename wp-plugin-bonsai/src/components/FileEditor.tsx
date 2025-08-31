// START ./wp-plugin-bonsai/src/components/FileEditor.tsx
import React, { useRef, useEffect } from 'react';
import { Plugin, Workspace, PluginFile, AIModel } from '@/types';
import { ModelSelector } from '@/components/ModelSelector';
import { HistoryControls } from '@/components/HistoryControls';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';

interface FileEditorProps {
  workspace: Workspace;
  onUpdatePlugins: (updater: (plugins: Plugin[]) => Plugin[]) => void;
  onReview: () => void;
  isActionDisabled: boolean;
  mainButtonText: string;
  onModelChange: (modelId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  enabledModels: AIModel[];
}

export function FileEditor({ workspace, onUpdatePlugins, onReview, isActionDisabled, mainButtonText, onModelChange, onUndo, onRedo, enabledModels }: FileEditorProps): React.ReactNode {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const file = workspace.plugins[0]?.files[0];

  useEffect(() => {
    if (!file) {
        onUpdatePlugins(() => [{ id: 'file-editor-plugin', name: 'Single File Editor', zipName: null, files: [{ id: 'file-editor-file', name: 'untitled.php', code: '<?php\n\n// Paste your code here.', modified: false }] }]);
    }
  }, [file, onUpdatePlugins]);

  const updateFile = (updates: Partial<PluginFile>) => {
    onUpdatePlugins((plugins) => [{ ...plugins[0], files: [{ ...plugins[0].files[0], ...updates }] }]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      const reader = new FileReader();
      reader.onload = (event) => updateFile({ name: uploadedFile.name, code: event.target?.result as string, modified: false });
      reader.readAsText(uploadedFile);
    }
  };
  
  const handleDownload = () => {
    if (!file) return;
    const fileName = window.prompt("Enter a filename for the download:", file.name);
    if (!fileName) return; // User cancelled
    
    const blob = new Blob([file.code], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!file) return <Loader message="Loading editor..." />;

  const hasContent = file.code.trim() !== '' && file.code.trim() !== '<?php\n\n// Paste your code here.';
  const reviewDisabled = isActionDisabled || enabledModels.length === 0;

  return (
    <div className="max-w-7xl mx-auto flex flex-col">
      {!hasContent && <EmptyState mode="file-editor" />}
      <div className="flex-grow">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
             <h2 className="text-xl font-bold text-slate-100">Code Editor</h2>
             <div className="flex items-center gap-2">
                <input type="text" value={file.name} onChange={(e) => updateFile({ name: e.target.value })} className="bg-slate-700 text-sm text-slate-300 font-mono px-2 py-1 rounded-md w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-sm font-semibold bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600">Upload</button>
                <button onClick={handleDownload} className="px-3 py-1.5 text-sm font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-500">Download</button>
             </div>
        </div>
        <textarea value={file.code} onChange={(e) => updateFile({ code: e.target.value, modified: true })} className="w-full h-[60vh] p-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <HistoryControls onUndo={onUndo} onRedo={onRedo} canUndo={workspace.historyIndex > 0} canRedo={workspace.historyIndex < workspace.history.length - 1} />
            <ModelSelector models={enabledModels} selectedModelId={workspace.selectedModelId} onModelChange={onModelChange} disabled={isActionDisabled} />
            <button onClick={onReview} disabled={reviewDisabled} title={enabledModels.length === 0 ? "Please enable at least one AI provider" : ""} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 transition-colors shadow-lg shadow-indigo-600/30">{mainButtonText}</button>
        </div>
      </div>
    </div>
  );
}
// END ./wp-plugin-bonsai/src/components/FileEditor.tsx
