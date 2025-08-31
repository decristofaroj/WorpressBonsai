// START ./wp-plugin-bonsai/src/components/ReviewResults.tsx
import React, { useMemo, useState } from 'react';
import type { ReviewIssue } from '@/types';
import { IssueCategory, IssueSeverity } from '@/types';
import { SecurityIcon, PerformanceIcon, BestPracticesIcon, InteroperabilityIcon, CodeQualityIcon } from '@/components/icons/CategoryIcons';
import { CriticalIcon, WarningIcon, InfoIcon } from '@/components/icons/SeverityIcons';
import { EmptyState } from '@/components/EmptyState';

interface ReviewResultsProps {
  issues: ReviewIssue[];
  onApplyFix: (issue: ReviewIssue) => void;
  onApplyAllSafeFixes: () => void;
  applyingFixId: string | null;
  isBatching: boolean;
  isOnline: boolean;
}

const categoryConfig = {
  [IssueCategory.Security]: { Icon: SecurityIcon, color: 'text-red-400', title: 'Security', description: 'Protecting your site from hacks and data breaches.'},
  [IssueCategory.Performance]: { Icon: PerformanceIcon, color: 'text-amber-400', title: 'Performance', description: 'Keeping your website fast and responsive.'},
  [IssueCategory.BestPractices]: { Icon: BestPracticesIcon, color: 'text-sky-400', title: 'Best Practices', description: 'Ensuring code follows WordPress standards for stability.'},
  [IssueCategory.Interoperability]: { Icon: InteroperabilityIcon, color: 'text-emerald-400', title: 'Interoperability', description: 'Preventing conflicts with other plugins and themes.'},
  [IssueCategory.CodeQuality]: { Icon: CodeQualityIcon, color: 'text-purple-400', title: 'Code Quality', description: 'Improving code syntax, clarity, and fixing general errors.'},
};

const severityConfig = {
  [IssueSeverity.Critical]: { Icon: CriticalIcon, color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Critical' },
  [IssueSeverity.Warning]: { Icon: WarningIcon, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Warning' },
  [IssueSeverity.Info]: { Icon: InfoIcon, color: 'bg-sky-500/20 text-sky-400 border-sky-500/30', label: 'Info' },
};

const IssueCard: React.FC<{ 
  issue: ReviewIssue;
  onApplyFix: (issue: ReviewIssue) => void;
  isApplying: boolean;
  isDisabled: boolean;
  isOnline: boolean;
}> = ({ issue, onApplyFix, isApplying, isDisabled, isOnline }) => {
  const config = severityConfig[issue.severity] || severityConfig.Info;
  const canApplyFix = issue.source === 'AI Analysis';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(issue.suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`border-l-4 rounded-r-lg p-5 bg-slate-800/50 ${config.color}`}>
      <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-4">
            <div className="flex items-center"><config.Icon /> <span className="font-bold ml-2">{config.label}</span></div>
            {issue.source && (<span className={`text-xs font-semibold px-2 py-1 rounded-full ${issue.source === 'AI Analysis' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700 text-slate-300'}`}>{issue.source}</span>)}
        </div>
        <div className="text-xs font-semibold text-slate-400 bg-slate-700/50 px-2 py-1 rounded-md">
          <span className="font-bold text-slate-300">{issue.pluginName}</span> / <span className="font-mono text-slate-300">{issue.fileName}</span>
        </div>
      </div>
      <p className="text-slate-300 mb-3">{issue.description}</p>
      
      <div className="mt-3 p-3 bg-slate-900/50 rounded-lg flex items-start">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-300 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        <div><h4 className="font-semibold text-slate-200">Impact</h4><p className="text-slate-400 text-sm">{issue.impact}</p></div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex justify-between items-start"><h4 className="font-semibold text-slate-200 mb-2">Suggestion:</h4>
            {canApplyFix && (
             <button onClick={() => onApplyFix(issue)} disabled={isApplying || isDisabled || !isOnline} title={!isOnline ? "Applying fixes requires an internet connection." : ""} className="flex items-center text-sm px-4 py-2 bg-slate-700/50 text-indigo-300 font-semibold rounded-md hover:bg-slate-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors">
              {isApplying ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Applying...</>) : 'Apply Fix'}
            </button>)}
        </div>
        <div className="relative group">
            <pre className="text-slate-400 font-mono text-sm bg-slate-900/70 p-3 rounded-md whitespace-pre-wrap">{issue.suggestion}</pre>
            <button onClick={handleCopy} className="absolute top-2 right-2 text-slate-400 bg-slate-800/50 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                {copied ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
            </button>
        </div>
      </div>
    </div>
  );
};

export function ReviewResults({ issues, onApplyFix, onApplyAllSafeFixes, applyingFixId, isBatching, isOnline }: ReviewResultsProps): React.ReactNode {
  const groupedIssues = useMemo(() => {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.category]) acc[issue.category] = [];
      acc[issue.category].push(issue);
      return acc;
    }, {} as Record<IssueCategory, ReviewIssue[]>);
  }, [issues]);
  
  const safeFixesCount = useMemo(() => issues.filter(issue => issue.severity === IssueSeverity.Info && issue.source === 'AI Analysis').length, [issues]);
  const orderedCategories = Object.values(IssueCategory);

  if (issues.length === 0) {
    return <EmptyState mode="results" />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-center">Review Results</h2>
        {safeFixesCount > 0 && isOnline && (
          <button onClick={onApplyAllSafeFixes} disabled={!!applyingFixId || isBatching} className="flex items-center px-4 py-2 bg-emerald-600/80 text-white font-semibold rounded-md hover:bg-emerald-600 disabled:bg-emerald-800/50 disabled:cursor-not-allowed transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Apply All {safeFixesCount} Safe AI Fixes
          </button>
        )}
      </div>
      <div className="space-y-10">
        {orderedCategories.map(category => {
          if (!groupedIssues[category] || groupedIssues[category].length === 0) return null;
          const config = categoryConfig[category];
          return (
            <section key={category}>
              <div className="flex items-center mb-2">
                <config.Icon className={`h-7 w-7 ${config.color}`} />
                <h3 className={`text-2xl font-semibold ml-3 ${config.color}`}>{config.title}</h3>
              </div>
              <p className="text-slate-400 mb-4 ml-10">{config.description}</p>
              <div className="space-y-4">
                {groupedIssues[category].map((issue) => (
                  <IssueCard key={issue.id} issue={issue} onApplyFix={onApplyFix} isApplying={applyingFixId === issue.id} isDisabled={!!applyingFixId || isBatching} isOnline={isOnline} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
// END ./wp-plugin-bonsai/src/components/ReviewResults.tsx
