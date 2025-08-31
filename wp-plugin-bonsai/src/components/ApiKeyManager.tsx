// START ./wp-plugin-bonsai/src/components/ApiKeyManager.tsx
import React, { useState } from 'react';
import { Provider, ProviderStatus } from '@/types';

interface ApiKeyManagerProps {
    providerStatus: ProviderStatus;
    onProviderStatusChange: (status: ProviderStatus) => void;
}

const providers: Provider[] = ['Google', 'OpenAI', 'Anthropic'];

const Toggle: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-indigo-600' : 'bg-slate-600'}`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
};

export function ApiKeyManager({ providerStatus, onProviderStatusChange }: ApiKeyManagerProps): React.ReactNode {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = (provider: Provider, enabled: boolean) => {
        onProviderStatusChange({ ...providerStatus, [provider]: enabled });
    };

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-slate-700/50 text-slate-300 rounded-md hover:bg-slate-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h2m4-5v12m-3-7l3 3 3-3" />
                </svg>
                Manage Keys
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-30 p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-slate-200">AI Provider Status</h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">&times;</button>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">Enable or disable AI providers. Disabled providers will not be used.</p>
                    <div className="space-y-3">
                        {providers.map(provider => (
                            <div key={provider} className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-300">{provider}</span>
                                <Toggle enabled={providerStatus[provider]} onChange={(enabled) => handleToggle(provider, enabled)} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
// END ./wp-plugin-bonsai/src/components/ApiKeyManager.tsx
