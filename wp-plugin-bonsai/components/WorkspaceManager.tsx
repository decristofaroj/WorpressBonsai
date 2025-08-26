import React, { useState } from 'react';
import type { Workspace } from '../types';

interface WorkspaceManagerProps {
    workspaces: Workspace[];
    activeWorkspaceId: string | null;
    onSwitch: (id: string) => void;
    onAdd: () => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
}

export function WorkspaceManager({ workspaces, activeWorkspaceId, onSwitch, onAdd, onRename, onDelete }: WorkspaceManagerProps) {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState('');
    const activeWorkspace = workspaces.find(ws => ws.id === activeWorkspaceId);

    const handleRenameStart = () => {
        if (activeWorkspace) {
            setNewName(activeWorkspace.name);
            setIsRenaming(true);
        }
    };

    const handleRenameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeWorkspaceId && newName.trim()) {
            onRename(activeWorkspaceId, newName.trim());
            setIsRenaming(false);
        }
    };

    if (!activeWorkspace) return null;

    return (
        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg">
            {isRenaming ? (
                <form onSubmit={handleRenameSubmit}><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onBlur={() => setIsRenaming(false)} autoFocus className="bg-slate-700 text-white px-2 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></form>
            ) : (
                <select value={activeWorkspaceId || ''} onChange={(e) => onSwitch(e.target.value)} className="bg-slate-700/50 border border-transparent text-white text-sm font-semibold rounded-md focus:ring-indigo-500 focus:border-indigo-500 block pl-3 pr-8 py-1.5 appearance-none">
                    {workspaces.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
                </select>
            )}
             <button onClick={onAdd} title="New Workspace" className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg></button>
            <div className="relative group">
                <button title="Workspace Actions" className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg></button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-30">
                    <button onClick={handleRenameStart} className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Rename...</button>
                    <button onClick={() => onDelete(activeWorkspaceId!)} disabled={workspaces.length <= 1} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed">Delete</button>
                </div>
            </div>
        </div>
    );
}