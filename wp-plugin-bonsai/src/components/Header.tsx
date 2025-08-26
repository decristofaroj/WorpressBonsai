import React from 'react';

interface HeaderProps {
    children: React.ReactNode;
}

export function Header({ children }: HeaderProps): React.ReactNode {
  return (
    <header className="py-2 px-4 bg-slate-900/60 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-20">
      <div className="container mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.5 21.75l-.398-1.188a3.375 3.375 0 00-2.455-2.456L12.75 18l1.188-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.188a3.375 3.375 0 002.456 2.456L20.25 18l-1.188.398a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
             WP Plugin Bonsai
            </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {children}
        </div>
      </div>
    </header>
  );
}
