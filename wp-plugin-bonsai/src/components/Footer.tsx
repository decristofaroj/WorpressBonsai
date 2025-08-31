// START ./wp-plugin-bonsai/src/components/Footer.tsx
import React from 'react';

interface FooterProps {
  isOnline: boolean;
}

export function Footer({ isOnline }: FooterProps): React.ReactNode {
  return (
    <footer className="text-center py-4 px-4 text-slate-500 text-sm border-t border-slate-700/50">
      <div className="container mx-auto flex justify-between items-center">
        <p>AI models by Google, OpenAI, and Anthropic</p>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>
    </footer>
  );
}
// END ./wp-plugin-bonsai/src/components/Footer.tsx
