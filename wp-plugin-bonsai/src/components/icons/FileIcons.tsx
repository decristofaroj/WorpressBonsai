import React from 'react';

export const getFileIcon = (fileName: string): React.ReactNode => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'php':
            return <PHPIcon />;
        case 'js':
            return <JSIcon />;
        case 'css':
            return <CSSIcon />;
        case 'json':
            return <JSONIcon />;
        case 'txt':
        case 'md':
            return <TextIcon />;
        default:
            return <DefaultIcon />;
    }
};

const PHPIcon = () => <span className="mr-2 text-indigo-400 font-bold text-xs flex-shrink-0">PHP</span>;
const JSIcon = () => <span className="mr-2 text-yellow-400 font-bold text-xs flex-shrink-0">JS</span>;
const CSSIcon = () => <span className="mr-2 text-sky-400 font-bold text-xs flex-shrink-0">CSS</span>;
const JSONIcon = () => <span className="mr-2 text-emerald-400 font-bold text-xs flex-shrink-0">JSON</span>;
const TextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const DefaultIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
