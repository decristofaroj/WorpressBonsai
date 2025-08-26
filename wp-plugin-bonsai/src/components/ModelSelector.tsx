import React from 'react';
import type { AIModel } from '@/types';

interface ModelSelectorProps {
  models: AIModel[];
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  disabled: boolean;
}

export function ModelSelector({ models, selectedModelId, onModelChange, disabled }: ModelSelectorProps): React.ReactNode {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="model-select" className="text-sm font-medium text-slate-400">
        AI Model:
      </label>
      <select
        id="model-select"
        value={selectedModelId}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled}
        className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 disabled:opacity-50"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} ({model.provider})
          </option>
        ))}
      </select>
    </div>
  );
}
