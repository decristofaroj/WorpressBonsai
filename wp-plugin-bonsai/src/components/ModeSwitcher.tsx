import React from 'react';
import type { AppMode } from '@/types';

interface ModeSwitcherProps {
    currentMode: AppMode;
    onModeChange: (mode: AppMode) => void;
}

const ModeButton: React.FC<{ mode: AppMode; currentMode: AppMode; onModeChange: (mode: AppMode) => void; children: React.ReactNode; }> = ({ mode, currentMode, onModeChange, children }) => {
    const baseClasses = "px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500";
    const activeClasses = "bg-indigo-600 text-white shadow";
    const inactiveClasses = "bg-slate-700/50 text-slate-300 hover:bg-slate-700";
    return <button onClick={() => onModeChange(mode)} className={`${baseClasses} ${currentMode === mode ? activeClasses : inactiveClasses}`}>{children}</button>
}

export function ModeSwitcher({ currentMode, onModeChange }: ModeSwitcherProps): React.ReactNode {
    return (
        <div className="flex items-center p-1 bg-slate-800 rounded-lg flex-wrap">
            <ModeButton mode="file-editor" currentMode={currentMode} onModeChange={onModeChange}>File Editor</ModeButton>
            <ModeButton mode="wordpress" currentMode={currentMode} onModeChange={onModeChange}>WP Reviewer</ModeButton>
            <ModeButton mode="integration" currentMode={currentMode} onModeChange={onModeChange}>Integration Builder</ModeButton>
            <ModeButton mode="plugin-builder" currentMode={currentMode} onModeChange={onModeChange}>Plugin Builder</ModeButton>
            <ModeButton mode="plugin-packager" currentMode={currentMode} onModeChange={onModeChange}>Plugin Packager</ModeButton>
        </div>
    );
}
