import React, { useState } from 'react';
import JSZip from 'jszip';

interface File {
    fileName: string;
    code: string;
}

interface CodeResultViewerProps {
    files: File[];
    title: string;
    defaultZipName?: string;
    zipRootFolder?: string;
}

export function CodeResultViewer({ files, title, defaultZipName = 'code-result.zip', zipRootFolder }: CodeResultViewerProps): React.ReactNode {
    const [selectedFile, setSelectedFile] = useState<File | null>(files[0] || null);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (selectedFile) {
            navigator.clipboard.writeText(selectedFile.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    const handleDownload = async () => {
        const fileName = window.prompt("Enter a filename for the download:", defaultZipName);
        if (!fileName) return; // User cancelled
        
        const zip = new JSZip();
        const folder = zipRootFolder ? zip.folder(zipRootFolder) : zip;
        if (folder) {
            files.forEach(file => { folder.file(file.fileName, file.code); });
        }
        
        const blob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/50 p-4 rounded-t-lg">
                <div>
                    <h2 className="text-xl font-bold text-emerald-400">{title}</h2>
                    <p className="text-sm text-slate-400">{files.length} files generated.</p>
                </div>
                <button onClick={handleDownload} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/30">Download as Zip</button>
            </div>
            <div className="flex flex-col md:flex-row h-[60vh]">
                <div className="w-full md:w-1/3 lg:w-1/4 p-2 border-b md:border-r md:border-b-0 border-slate-700 overflow-y-auto">
                    <h3 className="text-sm font-semibold text-slate-300 p-2">File Explorer</h3>
                    <ul>
                        {files.map(file => (
                            <li key={file.fileName}>
                                <button onClick={() => setSelectedFile(file)} className={`w-full text-left text-xs font-mono p-2 rounded-md ${selectedFile?.fileName === file.fileName ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400 hover:bg-slate-700/50'}`}>
                                    {file.fileName}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
                    {selectedFile ? (
                        <>
                            <div className="flex justify-between items-center p-2 bg-slate-800 border-b border-slate-700">
                                <span className="font-mono text-sm text-sky-300">{selectedFile.fileName}</span>
                                <button onClick={handleCopy} className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">{copied ? 'Copied!' : 'Copy Code'}</button>
                            </div>
                            <pre className="p-4 text-sm text-slate-300 font-mono whitespace-pre-wrap overflow-auto flex-grow bg-slate-900/50"><code>{selectedFile.code}</code></pre>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">Select a file to view its content.</div>
                    )}
                </div>
            </div>
        </div>
    );
}