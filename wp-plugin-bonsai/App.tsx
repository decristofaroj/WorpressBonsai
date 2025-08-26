import React, { useState, useCallback, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import { Header } from './components/Header';
import { MultiPluginUploader } from './components/MultiPluginUploader';
import { ReviewResults } from './components/ReviewResults';
import { Loader } from './components/Loader';
import { performLocalAnalysis } from './services/localAnalysisService';
import * as aiService from './services/aiService';
import * as storageService from './services/storageService';
// Fix: Added ProviderStatus to import list to support multi-provider state.
import { ReviewIssue, Plugin, PluginFile, AppMode, Workspace, ConfirmationState, GeneratedFileResponse, BlueprintResponse, ProviderStatus } from './types';
import { IntegrationBuilder } from './components/IntegrationBuilder';
import { PluginBuilder } from './components/PluginBuilder';
import { PluginPackager } from './components/PluginPackager';
import { FileEditor } from './components/FileEditor';
import { ModelSelector } from './components/ModelSelector';
import { models as availableModels } from './config/models';
import { WorkspaceManager } from './components/WorkspaceManager';
import { ModeSwitcher } from './components/ModeSwitcher';
import { localCodePatcher } from './services/localCodePatcher';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Footer } from './components/Footer';
import { HistoryControls } from './components/HistoryControls';
import { ConfirmationModal } from './components/ConfirmationModal';
import { EmptyState } from './components/EmptyState';
import { CodeResultViewer } from './components/CodeResultViewer';


const createNewPlugin = (name: string): Plugin => ({
  id: Date.now().toString(36) + Math.random().toString(36).substring(2),
  name,
  zipName: null,
  files: [],
});

const createNewFileEditorPlugin = (): Plugin => ({
    id: 'file-editor-plugin',
    name: 'Single File Editor',
    zipName: null,
    files: [{ id: 'file-editor-file', name: 'untitled.php', code: '<?php\n\n// Paste your code here.', modified: false }],
});

const createNewWorkspace = (name: string): Workspace => {
    const initialPlugins = [createNewPlugin('Plugin 1'), createNewPlugin('Plugin 2')];
    return {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        name,
        plugins: initialPlugins,
        reviewIssues: null,
        mode: 'wordpress',
        selectedModelId: availableModels[0].id,
        createdAt: new Date().toISOString(),
        history: [initialPlugins],
        historyIndex: 0,
    };
};

const ALLOWED_EXTENSIONS = ['.php', '.js', '.css', '.html', '.txt', '.md', '.json', '.xml'];

function App(): React.ReactNode {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyingFixId, setApplyingFixId] = useState<string | null>(null);
  const [isApplyingBatch, setIsApplyingBatch] = useState<boolean>(false);
  const [uploadingPluginId, setUploadingPluginId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [previewModal, setPreviewModal] = useState<{ title: string; content: React.ReactNode } | null>(null);
  // Fix: Added state to manage which AI providers are enabled.
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>({ Google: true, OpenAI: true, Anthropic: true });

  const isOnline = useOnlineStatus();

  useEffect(() => {
    const loadWorkspaces = async () => {
      const savedWorkspaces = await storageService.loadWorkspaces();
      if (savedWorkspaces.length > 0) {
        setWorkspaces(savedWorkspaces);
        setActiveWorkspaceId(savedWorkspaces[0].id);
      } else {
        const newWorkspace = createNewWorkspace('Default Workspace');
        setWorkspaces([newWorkspace]);
        setActiveWorkspaceId(newWorkspace.id);
      }
    };
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (workspaces.length > 0) {
      storageService.saveWorkspaces(workspaces);
    }
  }, [workspaces]);

  const activeWorkspace = useMemo(() => {
    return workspaces.find(ws => ws.id === activeWorkspaceId);
  }, [workspaces, activeWorkspaceId]);

  // Fix: Added memoization for enabled models based on provider status.
  const enabledModels = useMemo(() => {
    return availableModels.filter(model => providerStatus[model.provider]);
  }, [providerStatus]);

  const updateWorkspace = useCallback((workspaceId: string, updates: Partial<Workspace>) => {
    setWorkspaces(wss => wss.map(ws => ws.id === workspaceId ? { ...ws, ...updates } : ws));
  }, []);

  const updatePluginsWithHistory = useCallback((workspaceId: string, newPlugins: Plugin[]) => {
    const ws = workspaces.find(w => w.id === workspaceId);
    if (!ws) return;

    const currentHistory = ws.history.slice(0, ws.historyIndex + 1);
    let newHistory = [...currentHistory, newPlugins];
    // Limit history to 3 previous states + current state
    if (newHistory.length > 4) {
        newHistory = newHistory.slice(newHistory.length - 4);
    }
    
    updateWorkspace(workspaceId, {
      plugins: newPlugins,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  }, [workspaces, updateWorkspace]);

  const handleWorkspaceChange = (id: string) => setActiveWorkspaceId(id);

  const handleAddWorkspace = () => {
    const newWorkspace = createNewWorkspace(`Workspace ${workspaces.length + 1}`);
    setWorkspaces(wss => [...wss, newWorkspace]);
    setActiveWorkspaceId(newWorkspace.id);
  };

  const handleRenameWorkspace = (id: string, newName: string) => {
    setWorkspaces(wss => wss.map(ws => ws.id === id ? { ...ws, name: newName } : ws));
  };

  const handleDeleteWorkspace = (id: string) => {
    setConfirmation({
        message: 'Are you sure you want to delete this workspace? This action cannot be undone.',
        onConfirm: () => {
            if (workspaces.length <= 1) return;
            const remaining = workspaces.filter(ws => ws.id !== id);
            setWorkspaces(remaining);
            setActiveWorkspaceId(remaining[0]?.id || null);
            setConfirmation(null);
        },
        onCancel: () => setConfirmation(null),
    });
  };

  const handleModeChange = (mode: AppMode) => {
    if (activeWorkspace) {
        let plugins = activeWorkspace.plugins;
        if (mode === 'file-editor' && (plugins.length !== 1 || plugins[0].id !== 'file-editor-plugin')) {
            plugins = [createNewFileEditorPlugin()];
        } else if (mode === 'wordpress' && (plugins.length === 0 || plugins[0].id === 'file-editor-plugin')) {
            plugins = [createNewPlugin('Plugin 1'), createNewPlugin('Plugin 2')];
        } else if (mode === 'plugin-packager') {
            plugins = []; // Packager is self-contained and doesn't use the workspace plugins
        }
        updateWorkspace(activeWorkspace.id, { mode, plugins, reviewIssues: null, history: [plugins], historyIndex: 0 });
    }
  };

  const handleModelChange = (modelId: string) => {
    if (activeWorkspace) {
      updateWorkspace(activeWorkspace.id, { selectedModelId: modelId });
    }
  };

  const setPlugins = (updater: (plugins: Plugin[]) => Plugin[]) => {
    if (activeWorkspace) {
      const newPlugins = updater(activeWorkspace.plugins);
      updatePluginsWithHistory(activeWorkspace.id, newPlugins);
    }
  };
  
  const handlePluginNameChange = (pluginId: string, newName: string) => {
    if (!activeWorkspace) return;
    const newPlugins = activeWorkspace.plugins.map(p => (p.id === pluginId ? { ...p, name: newName } : p));
    updateWorkspace(activeWorkspace.id, { plugins: newPlugins }); // Don't add name changes to history
  };

  const handleAddPlugin = () => {
    if (activeWorkspace && activeWorkspace.plugins.length < 10) {
      const newPlugins = [...activeWorkspace.plugins, createNewPlugin(`Plugin ${activeWorkspace.plugins.length + 1}`)];
      updateWorkspace(activeWorkspace.id, { plugins: newPlugins, history: [newPlugins], historyIndex: 0 });
    }
  };

  const handleRemovePlugin = (id: string) => {
    if (activeWorkspace && activeWorkspace.plugins.length > 2) {
      const newPlugins = activeWorkspace.plugins.filter(p => p.id !== id);
      updateWorkspace(activeWorkspace.id, { plugins: newPlugins, history: [newPlugins], historyIndex: 0 });
    }
  };
  
  const handleZipUpload = async (pluginId: string, file: File) => {
    if (!activeWorkspace) return;
    setUploadingPluginId(pluginId);
    setError(null);
    try {
      const zip = await JSZip.loadAsync(file);
      const extractedFiles: PluginFile[] = [];

      for (const relativePath in zip.files) {
        const zipEntry = zip.files[relativePath];
        if (!zipEntry.dir && ALLOWED_EXTENSIONS.some(ext => relativePath.toLowerCase().endsWith(ext))) {
          const content = await zipEntry.async('string');
          extractedFiles.push({ id: `${pluginId}-${relativePath}`, name: relativePath, code: content, modified: false });
        }
      }
      
      const newPlugins = activeWorkspace.plugins.map(p =>
          p.id === pluginId ? { ...p, files: extractedFiles, zipName: file.name } : p
      );
      updateWorkspace(activeWorkspace.id, { plugins: newPlugins, history: [newPlugins], historyIndex: 0 });
    } catch (err) {
      setError(`Failed to process ${file.name}. Is it a valid zip file?`);
    } finally {
      setUploadingPluginId(null);
    }
  };

  const runReviewFlow = useCallback(async (pluginsToReview: Plugin[]) => {
    if (!activeWorkspace) return;
    setError(null);
    updateWorkspace(activeWorkspace.id, { reviewIssues: null });

    setStatus('Running local analysis...');
    const localIssues = performLocalAnalysis(pluginsToReview).map((issue, i) => ({...issue, id: `local-${i}`}));
    updateWorkspace(activeWorkspace.id, { reviewIssues: localIssues });

    if (!isOnline) {
      setStatus("Offline. Showing local analysis results only.");
      return;
    }
    
    setStatus('Querying AI for deep analysis...');
    try {
      // Fix: Pass providerStatus to the runReview service call.
      const aiIssues = await aiService.runReview(pluginsToReview, activeWorkspace.selectedModelId, providerStatus, setStatus);
      const aiIssuesWithIds = aiIssues.map((issue, i) => ({...issue, id: `ai-${i}`}));
      setWorkspaces(wss => wss.map(ws => {
        if (ws.id === activeWorkspaceId) {
            const currentLocal = ws.reviewIssues?.filter(i => i.source === 'Local Scanner') || [];
            return { ...ws, reviewIssues: [...currentLocal, ...aiIssuesWithIds] };
        }
        return ws;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during the AI review.');
    } finally {
      setStatus(null);
    }
  }, [activeWorkspace, activeWorkspaceId, isOnline, updateWorkspace, providerStatus]);

  const handleReview = useCallback(() => {
    if (!activeWorkspace) return;
    const pluginsWithCode = activeWorkspace.plugins.filter(p => p.files.length > 0 && p.files.some(f => f.code.trim()));
    if (activeWorkspace.mode === 'wordpress' && pluginsWithCode.length === 0) {
      setError('Please upload at least one plugin zip file to review.');
      return;
    }
    if (activeWorkspace.mode === 'file-editor' && pluginsWithCode.length === 0) {
        setError('Please upload or paste code into the editor to review.');
        return;
    }
    runReviewFlow(activeWorkspace.plugins);
  }, [activeWorkspace, runReviewFlow]);

  const handleApplyFix = useCallback(async (issueToFix: ReviewIssue) => {
    if (!issueToFix.id || !activeWorkspace) return;
  
    setApplyingFixId(issueToFix.id);
    setError(null);
    try {
      // Fix: Pass providerStatus to the getModificationPlan service call.
      const modificationPlan = await aiService.getModificationPlan(activeWorkspace.plugins, issueToFix, activeWorkspace.selectedModelId, providerStatus, setStatus);
      const targetPlugin = activeWorkspace.plugins.find(p => p.name === modificationPlan.pluginName);
      const targetFile = targetPlugin?.files.find(f => f.name === modificationPlan.fileName);
      if (!targetFile) throw new Error(`Target file ${modificationPlan.fileName} not found.`);

      const newCode = localCodePatcher.applyPatch(targetFile.code, modificationPlan.changes);
      
      const updatedPlugins = activeWorkspace.plugins.map(p => 
        p.name === modificationPlan.pluginName
          ? {...p, files: p.files.map(f => f.name === modificationPlan.fileName ? { ...f, code: newCode, modified: true } : f)}
          : p
      );
      
      updatePluginsWithHistory(activeWorkspace.id, updatedPlugins);
      await runReviewFlow(updatedPlugins);
    } catch (err) {
      setError(`An error occurred while applying the fix for ${issueToFix.fileName}.`);
    } finally {
      setApplyingFixId(null);
      setStatus(null);
    }
  }, [activeWorkspace, runReviewFlow, updatePluginsWithHistory, providerStatus]);

  const handleApplyAllSafeFixes = useCallback(async () => {
    if (!activeWorkspace || !activeWorkspace.reviewIssues) return;

    const safeIssues = activeWorkspace.reviewIssues.filter(issue => issue.severity === 'Info' && issue.source === 'AI Analysis');
    if (safeIssues.length === 0) return;

    setIsApplyingBatch(true);
    let currentPlugins = activeWorkspace.plugins;
    
    try {
      for (const issue of safeIssues) {
        const ws = workspaces.find(w => w.id === activeWorkspaceId);
        if (!ws) break;
        
        setApplyingFixId(issue.id!);
        // Fix: Pass providerStatus to the getModificationPlan service call.
        const modificationPlan = await aiService.getModificationPlan(currentPlugins, issue, ws.selectedModelId, providerStatus, () => {});
        const targetFile = currentPlugins.find(p => p.name === modificationPlan.pluginName)?.files.find(f => f.name === modificationPlan.fileName);
        if (!targetFile) continue;

        const newCode = localCodePatcher.applyPatch(targetFile.code, modificationPlan.changes);
        currentPlugins = currentPlugins.map(p => 
            p.name === modificationPlan.pluginName 
            ? {...p, files: p.files.map(f => f.name === modificationPlan.fileName ? {...f, code: newCode, modified: true} : f)} 
            : p
        );
        setApplyingFixId(null);
      }
      updatePluginsWithHistory(activeWorkspace.id, currentPlugins);
      await runReviewFlow(currentPlugins);
    } catch (error) {
       setError("An error occurred during the batch fix process.");
    } finally {
      setIsApplyingBatch(false);
      setApplyingFixId(null);
    }
  }, [activeWorkspace, workspaces, activeWorkspaceId, runReviewFlow, updatePluginsWithHistory, providerStatus]);

  const promptForFilename = (defaultName: string): string | null => {
    return window.prompt("Enter a filename for the download:", defaultName);
  };
  
  const handleDownloadPlugin = async (pluginId: string) => {
    if (!activeWorkspace) return;
    const plugin = activeWorkspace.plugins.find(p => p.id === pluginId);
    if (!plugin || plugin.files.length === 0) return;

    const originalName = plugin.zipName || `${plugin.name}.zip`;
    const baseName = originalName.endsWith('.zip') ? originalName.slice(0, -4) : originalName;
    const defaultName = `${baseName}-modified.zip`;
    const fileName = promptForFilename(defaultName);
    if (!fileName) return;

    const zip = new JSZip();
    plugin.files.forEach(file => zip.file(file.name, file.code));
    const blob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleGenerateFile = useCallback(async (pluginId: string) => {
    if (!activeWorkspace) return;
    const plugin = activeWorkspace.plugins.find(p => p.id === pluginId);
    if (!plugin) return;

    const fileDescription = window.prompt("Describe the file you want to generate (e.g., 'a readme.txt file', 'an uninstall.php script'):");
    if (!fileDescription || !fileDescription.trim()) return;

    setStatus(`Generating file for ${plugin.name}...`);
    setError(null);
    try {
        // Fix: Pass providerStatus to the generateSingleFile service call.
        const { fileName, code } = await aiService.generateSingleFile(plugin, fileDescription, activeWorkspace.selectedModelId, providerStatus, setStatus);
        
        setPreviewModal({
            title: `Generated File: ${fileName}`,
            content: (
                <div>
                    <CodeResultViewer files={[{ fileName, code }]} title="Preview" />
                    <div className="flex justify-end gap-4 mt-4">
                        <button onClick={() => setPreviewModal(null)} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-500">Close</button>
                        <button onClick={() => {
                            const newFile: PluginFile = { id: `${plugin.id}-${fileName}-${Date.now()}`, name: fileName, code: code, modified: true };
                            const updatedPlugins = activeWorkspace.plugins.map(p => {
                                if (p.id === pluginId) {
                                    const existingIndex = p.files.findIndex(f => f.name.toLowerCase() === fileName.toLowerCase());
                                    let newFiles = [...p.files];
                                    if (existingIndex !== -1) newFiles[existingIndex] = newFile;
                                    else newFiles.push(newFile);
                                    return { ...p, files: newFiles };
                                }
                                return p;
                            });
                            updatePluginsWithHistory(activeWorkspace.id, updatedPlugins);
                            setPreviewModal(null);
                        }} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-500">Add to Plugin</button>
                    </div>
                </div>
            )
        });
    } catch(err) {
        setError(err instanceof Error ? err.message : "Failed to generate the file.");
    } finally {
        setStatus(null);
    }
  }, [activeWorkspace, updatePluginsWithHistory, providerStatus]);
  
  const handleUndo = () => {
    if (!activeWorkspace || activeWorkspace.historyIndex <= 0) return;
    const newIndex = activeWorkspace.historyIndex - 1;
    const previousPlugins = activeWorkspace.history[newIndex];
    updateWorkspace(activeWorkspace.id, { plugins: previousPlugins, historyIndex: newIndex });
  };
  
  const handleRedo = () => {
    if (!activeWorkspace || activeWorkspace.historyIndex >= activeWorkspace.history.length - 1) return;
    const newIndex = activeWorkspace.historyIndex + 1;
    const nextPlugins = activeWorkspace.history[newIndex];
    updateWorkspace(activeWorkspace.id, { plugins: nextPlugins, historyIndex: newIndex });
  };

  const isLoading = !!status;
  const isActionDisabled = useMemo(() => isLoading || !!applyingFixId || !!uploadingPluginId || isApplyingBatch, [isLoading, applyingFixId, uploadingPluginId, isApplyingBatch]);
  
  const mainButtonText = useMemo(() => {
    if (status) return status;
    if (isApplyingBatch) return 'Applying All Fixes...';
    if (uploadingPluginId) return 'Processing Zip...';
    if (activeWorkspace?.mode === 'file-editor') return 'Review File';
    return 'Review Interoperability';
  }, [status, isApplyingBatch, uploadingPluginId, activeWorkspace?.mode]);

  if (!activeWorkspace) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center"><Loader message="Loading Workspaces..." /></div>;
  }

  const hasContent = activeWorkspace.plugins.some(p => p.files.length > 0 && p.files.some(f => f.code.trim()));

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col">
      <Header>
        <WorkspaceManager workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} onSwitch={handleWorkspaceChange} onAdd={handleAddWorkspace} onRename={handleRenameWorkspace} onDelete={handleDeleteWorkspace} />
        <ModeSwitcher currentMode={activeWorkspace.mode} onModeChange={handleModeChange} />
      </Header>
      <main className="container mx-auto px-4 py-8 flex-grow">
        {activeWorkspace.mode === 'wordpress' && (
          <div className="max-w-7xl mx-auto">
            {!hasContent && !uploadingPluginId && <EmptyState mode="wordpress" />}
            <MultiPluginUploader plugins={activeWorkspace.plugins} onPluginNameChange={handlePluginNameChange} onAddPlugin={handleAddPlugin} onRemovePlugin={handleRemovePlugin} onZipUpload={handleZipUpload} uploadingPluginId={uploadingPluginId} onDownloadPlugin={handleDownloadPlugin} onGenerateFile={handleGenerateFile} isActionDisabled={isActionDisabled} />
            <div className="mt-8 flex flex-col items-center gap-4">
              <HistoryControls onUndo={handleUndo} onRedo={handleRedo} canUndo={activeWorkspace.historyIndex > 0} canRedo={activeWorkspace.historyIndex < activeWorkspace.history.length - 1} />
              <ModelSelector models={enabledModels} selectedModelId={activeWorkspace.selectedModelId} onModelChange={handleModelChange} disabled={isActionDisabled}/>
              <button onClick={handleReview} disabled={isActionDisabled || enabledModels.length === 0} title={enabledModels.length === 0 ? "Please enable at least one AI provider" : ""} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg shadow-indigo-600/30">
                {mainButtonText}
              </button>
            </div>
          </div>
        )}
        {activeWorkspace.mode === 'file-editor' && (
            <FileEditor workspace={activeWorkspace} onUpdatePlugins={setPlugins} onReview={handleReview} isActionDisabled={isActionDisabled} mainButtonText={mainButtonText} onModelChange={handleModelChange} onUndo={handleUndo} onRedo={handleRedo} enabledModels={enabledModels}/>
        )}
        {activeWorkspace.mode === 'integration' && <IntegrationBuilder providerStatus={providerStatus} enabledModels={enabledModels} />}
        {activeWorkspace.mode === 'plugin-builder' && <PluginBuilder providerStatus={providerStatus} enabledModels={enabledModels} />}
        {activeWorkspace.mode === 'plugin-packager' && <PluginPackager workspace={activeWorkspace} />}


        {(activeWorkspace.mode === 'wordpress' || activeWorkspace.mode === 'file-editor') && (
            <div className="mt-12 max-w-7xl mx-auto">
              {isLoading && !activeWorkspace.reviewIssues?.length && <Loader message={status} />}
              {error && (<div className="relative text-center p-4 bg-red-900/50 border border-red-500 rounded-lg">{error}<button onClick={() => setError(null)} className="absolute top-2 right-2 text-red-300 hover:text-white">&times;</button></div>)}
              {activeWorkspace.reviewIssues && (
                <ReviewResults issues={activeWorkspace.reviewIssues} onApplyFix={handleApplyFix} onApplyAllSafeFixes={handleApplyAllSafeFixes} applyingFixId={applyingFixId} isBatching={isApplyingBatch} isOnline={isOnline} />
              )}
            </div>
        )}
      </main>
      <ConfirmationModal confirmation={confirmation} />
      {previewModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPreviewModal(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-700"><h3 className="font-semibold text-lg text-slate-200">{previewModal.title}</h3><button onClick={() => setPreviewModal(null)} className="text-slate-400 hover:text-white">&times;</button></div>
            <div className="p-4 overflow-auto flex-grow">{previewModal.content}</div>
          </div>
        </div>
      )}
      <Footer isOnline={isOnline} />
    </div>
  );
}

export default App;
