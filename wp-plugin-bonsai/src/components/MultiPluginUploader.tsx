// START ./wp-plugin-bonsai/src/components/MultiPluginUploader.tsx
import React, { useRef } from 'react';
import type { Plugin } from '@/types';
import { getFileIcon } from '@/components/icons/FileIcons';

interface MultiPluginUploaderProps {
  plugins: Plugin[];
  onPluginNameChange: (pluginId: string, newName: string) => void;
  onAddPlugin: () => void;
  onRemovePlugin: (id: string) => void;
  onZipUpload: (pluginId: string, file: File) => void;
  onDownloadPlugin: (pluginId: string) => void;
  onGenerateFile: (pluginId: string) => void;
  uploadingPluginId: string | null;
  isActionDisabled: boolean;
}

const FileList: React.FC<{ plugin: Plugin }> = ({ plugin }) => {
  return (
    <div className="max-h-48 overflow-y-auto p-2">
      <ul className="text-sm space-y-1">
        {plugin.files.map(file => (
          <li key={file.id} className="text-slate-400 font-mono text-xs flex items-center bg-slate-700/30 p-1.5 rounded">
            {getFileIcon(file.name)}
            <span className="truncate" title={file.name}>{file.name}</span>
            {file.modified && <span className="ml-auto text-xs font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full">Modified</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

interface PluginCardProps {
  plugin: Plugin;
  index: number;
  pluginsLength: number;
  onPluginNameChange: (pluginId: string, newName: string) => void;
  onRemovePlugin: (id: string) => void;
  onZipUpload: (pluginId: string, file: File) => void;
  onDownloadPlugin: (pluginId: string) => void;
  onGenerateFile: (pluginId: string) => void;
  isUploading: boolean;
  isActionDisabled: boolean;
}

const PluginCard: React.FC<PluginCardProps> = ({ plugin, index, pluginsLength, onPluginNameChange, onRemovePlugin, onZipUpload, onDownloadPlugin, onGenerateFile, isUploading, isActionDisabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => event.target.files?.[0] && onZipUpload(plugin.id, event.target.files[0]);
  const hasFiles = plugin.files.length > 0;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-900/30 rounded-t-lg">
        <input type="text" value={plugin.name} onChange={(e) => onPluginNameChange(plugin.id, e.target.value)} className="w-full bg-transparent text-slate-100 font-semibold focus:outline-none" placeholder={`Plugin ${index + 1} Name`} />
        <button onClick={() => onRemovePlugin(plugin.id)} disabled={pluginsLength <= 2} className="ml-2 text-slate-500 hover:text-red-400 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors" aria-label="Remove Plugin"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
      </div>
      <div className="flex-grow p-4 flex flex-col justify-between">
        <div>
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full flex items-center justify-center px-4 py-2 border-2 border-dashed border-slate-600 rounded-md text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors disabled:opacity-50">
            {isUploading ? <><svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</> : <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Upload Zip</>}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".zip" className="hidden" />
          {plugin.zipName && <p className="text-center text-sm text-slate-400 mt-3 bg-slate-700/50 py-1 px-2 rounded-md truncate" title={plugin.zipName}>{plugin.zipName}</p>}
        </div>
        <div className="mt-4 border-t border-slate-700 pt-3"><h4 className="text-sm font-semibold text-slate-300 mb-2">Code Files:</h4>{hasFiles ? <FileList plugin={plugin} /> : <p className="text-sm text-slate-500 px-2 py-2">Upload a zip to see files.</p>}</div>
      </div>
       {hasFiles && (
        <div className="p-3 border-t border-slate-700 bg-slate-900/30 rounded-b-lg space-y-2">
            <button onClick={() => onGenerateFile(plugin.id)} disabled={isActionDisabled} className="w-full flex items-center justify-center px-4 py-2 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-500 transition-colors disabled:bg-sky-800/50 disabled:cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Generate File
            </button>
            <button onClick={() => onDownloadPlugin(plugin.id)} disabled={isActionDisabled} className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-500 transition-colors disabled:bg-emerald-800/50 disabled:cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Plugin
            </button>
        </div>
      )}
    </div>
  );
};

export function MultiPluginUploader(props: MultiPluginUploaderProps): React.ReactNode {
  const { plugins, onAddPlugin, uploadingPluginId, ...rest } = props;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plugins.map((plugin, index) => <PluginCard key={plugin.id} plugin={plugin} index={index} pluginsLength={plugins.length} isUploading={uploadingPluginId === plugin.id} {...rest} />)}
      </div>
      <div className="flex justify-center">
        <button onClick={onAddPlugin} disabled={plugins.length >= 10 || props.isActionDisabled} className="px-6 py-2 border-2 border-dashed border-slate-600 text-slate-400 font-semibold rounded-lg hover:bg-slate-700/50 hover:text-slate-300 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
          Add Plugin ({plugins.length}/10)
        </button>
      </div>
    </div>
  );
}
// END ./wp-plugin-bonsai/src/components/MultiPluginUploader.tsx
