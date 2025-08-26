import React from 'react';
import { ConfirmationState } from '../types';

interface ConfirmationModalProps {
    confirmation: ConfirmationState | null;
}

export function ConfirmationModal({ confirmation }: ConfirmationModalProps): React.ReactNode {
    if (!confirmation) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md">
                <div className="p-6">
                    <h3 className="font-semibold text-lg text-slate-100">Confirm Action</h3>
                    <p className="text-slate-400 mt-2">{confirmation.message}</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-b-lg flex justify-end gap-4">
                    <button onClick={confirmation.onCancel} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-500 transition-colors">
                        Cancel
                    </button>
                    <button onClick={confirmation.onConfirm} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-500 transition-colors">
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}