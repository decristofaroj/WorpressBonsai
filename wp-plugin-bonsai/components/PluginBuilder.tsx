import React, { useState, useCallback, useRef, useEffect } from 'react';
import { buildPlugin, generateBlueprint, continuePluginChat } from '../services/aiService';
import { Loader } from './Loader';
import { ModelSelector } from './ModelSelector';
import type { PluginBuildResponse, BlueprintResponse, ChatMessage, AIModel, ProviderStatus } from '../types';
import { CodeResultViewer } from './CodeResultViewer';
import { EmptyState } from './EmptyState';

interface PluginBuilderProps {
    providerStatus: ProviderStatus;
    enabledModels: AIModel[];
}

const ChatMessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    const wrapperClasses = `flex w-full ${isModel ? 'justify-start' : 'justify-end'}`;
    const bubbleClasses = `max-w-xl p-3 rounded-lg shadow whitespace-pre-wrap ${isModel ? 'bg-slate-700 text-slate-200' : 'bg-indigo-600 text-white'}`;
    const codeBlockClasses = "block p-2 my-2 bg-slate-900/70 border border-slate-600 rounded-md font-mono text-xs overflow-x-auto";

    const contentWithCodeStyles = message.content.split(/```(\w+)?\n([\s\S]+?)```/g).map((part, index) => {
        if (index % 3 === 2) return <pre key={index} className={codeBlockClasses}><code>{part}</code></pre>;
        if (index % 3 === 1 || (index % 3 === 0 && part.trim() === '')) return null;
        return part;
    });

    return (
        <div className={wrapperClasses}>
            <div className={bubbleClasses}>{contentWithCodeStyles}</div>
        </div>
    );
};

export function PluginBuilder({ providerStatus, enabledModels }: PluginBuilderProps): React.ReactNode {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', content: "Hello! I'm here to help you design a WordPress plugin. What would you like to build?" }
    ]);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PluginBuildResponse | null>(null);
    const [blueprint, setBlueprint] = useState<BlueprintResponse | null>(null);
    const [selectedModelId, setSelectedModelId] = useState<string>(enabledModels[0]?.id || '');
    const [isTyping, setIsTyping] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [inputFile, setInputFile] = useState<{ name: string, content: string } | null>(null);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isTyping]);
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                setInputFile({ name: file.name, content });
                const userMessage: ChatMessage = { role: 'user', content: `I've uploaded a file named "${file.name}" to use as the starting point for our plugin. Please analyze it and let's begin designing.` };
                const newMessages = [...messages, userMessage];
                setMessages(newMessages);
                sendMessageToServer(newMessages);
            };
            reader.readAsText(file);
        }
        if (e.target) e.target.value = ''; // Reset file input
    };

    const sendMessageToServer = async (currentMessages: ChatMessage[]) => {
        setIsTyping(true);
        setError(null);
        try {
            const response = await continuePluginChat(currentMessages, selectedModelId, providerStatus, setStatus);
            setMessages(prev => [...prev, { role: 'model', content: response }]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred.');
        } finally {
            setIsTyping(false);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isTyping) return;
        const userMessage: ChatMessage = { role: 'user', content: userInput };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        sendMessageToServer(newMessages);
        setUserInput('');
    };

    const handleGenerateBlueprint = useCallback(async () => {
        if (messages.length <= 1) { setError('Please describe the plugin first.'); return; }
        setStatus('Generating blueprint...');
        setError(null);
        setBlueprint(null);
        setResult(null);
        try {
            setBlueprint(await generateBlueprint(messages, selectedModelId, providerStatus, setStatus));
        } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred.'); } 
        finally { setStatus(null); }
    }, [messages, selectedModelId, providerStatus]);

    const handleBuildPlugin = useCallback(async () => {
        if (messages.length <= 1) { setError('Please describe the plugin first.'); return; }
        setStatus('Architecting and building plugin...');
        setError(null);
        setResult(null);
        setBlueprint(null);
        try {
            setResult(await buildPlugin(messages, inputFile, selectedModelId, providerStatus, setStatus));
        } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred.'); } 
        finally { setStatus(null); }
    }, [messages, inputFile, selectedModelId, providerStatus]);
    
    const isLoading = !!status;
    const isActionDisabled = isLoading || isTyping || enabledModels.length === 0;

    return (
        <div className="max-w-4xl mx-auto">
            {!result && !blueprint && !isLoading && !error && messages.length <= 1 && <EmptyState mode="plugin-builder" />}
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg flex flex-col h-[75vh]">
                <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {messages.map((msg, index) => <ChatMessageBubble key={index} message={msg} />)}
                    {isTyping && <ChatMessageBubble message={{ role: 'model', content: 'Thinking...' }} />}
                </div>

                {inputFile && (
                    <div className="p-2 px-4 text-xs text-slate-400 border-t border-slate-700">
                        Using <span className="font-mono bg-slate-700/50 px-1 rounded">{inputFile.name}</span> as context. 
                        <button onClick={() => setInputFile(null)} className="ml-2 text-red-400 hover:text-red-300">[ remove ]</button>
                    </div>
                )}
                
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700 bg-slate-900/50 rounded-b-lg">
                    <div className="flex items-center gap-2">
                        <input ref={fileInputRef} id="file-upload" type="file" accept=".php,.json,.txt" onChange={handleFileSelect} className="hidden" />
                         <button type="button" onClick={() => fileInputRef.current?.click()} title="Upload File Context (PHP, JSON, TXT)" className="p-2 text-slate-400 hover:text-white cursor-pointer rounded-md hover:bg-slate-700" disabled={isActionDisabled}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </button>
                        <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="Type your message or upload a file..." className="w-full bg-slate-700 text-slate-200 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={isActionDisabled} />
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 disabled:bg-indigo-800" disabled={isActionDisabled || !userInput.trim()}>Send</button>
                    </div>
                </form>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row justify-end items-center gap-4">
                <ModelSelector models={enabledModels} selectedModelId={selectedModelId} onModelChange={setSelectedModelId} disabled={isActionDisabled} />
                <button onClick={handleGenerateBlueprint} disabled={isActionDisabled} title={enabledModels.length === 0 ? "Please enable at least one AI provider" : ""} className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 disabled:bg-sky-800 transition-colors">Generate Blueprint</button>
                <button onClick={handleBuildPlugin} disabled={isActionDisabled} title={enabledModels.length === 0 ? "Please enable at least one AI provider" : ""} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 transition-colors shadow-lg shadow-indigo-600/30">{isLoading ? (status || 'Building...') : 'Build Plugin'}</button>
            </div>

            <div className="mt-12">
                {isLoading && <Loader message={status}/>}
                {error && <div className="relative text-center p-4 bg-red-900/50 border border-red-500 rounded-lg">{error}<button onClick={() => setError(null)} className="absolute top-2 right-2 text-red-300 hover:text-white">&times;</button></div>}
                {blueprint && <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6"><h2 className="text-2xl font-bold text-sky-400 mb-4">Architectural Blueprint</h2><div><h3 className="text-lg font-semibold mt-4 mb-2">File Structure</h3><pre className="p-3 bg-slate-900 rounded-md text-sm whitespace-pre-wrap font-mono">{blueprint.fileStructure}</pre></div><div><h3 className="text-lg font-semibold mt-4 mb-2">Plan</h3><p className="whitespace-pre-wrap p-3 bg-slate-900 rounded-md text-sm">{blueprint.plan}</p></div></div>}
                {result && <CodeResultViewer files={result.files} title="Generated Plugin" defaultZipName={`${result.pluginName}-v1.0.0.zip`} zipRootFolder={result.pluginName} />}
            </div>
        </div>
    );
}
