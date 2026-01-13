
import React, { useState, useRef } from 'react';
import { SourceItem } from '../types';
import { Button } from './Button';
import { extractTextFromPdf } from '../services/pdfUtils';
import { generateSourceTitle } from '../services/geminiService';
import { Youtube, FileText, Globe, Image as ImageIcon, Trash2, Upload, Link as LinkIcon, CheckSquare, Square, Sparkles } from 'lucide-react';

interface PasteLinkSectionProps {
  sources: SourceItem[];
  onAddSource: (item: SourceItem) => void;
  onToggleSource: (id: string) => void;
  onDeleteSource: (id: string) => void;
  onDeleteSelected: () => void;
}

export const PasteLinkSection: React.FC<PasteLinkSectionProps> = ({
  sources,
  onAddSource,
  onToggleSource,
  onDeleteSource,
  onDeleteSelected
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HELPERS ---

  const handleImport = async () => {
    if (!inputValue.trim() || isProcessing) return;
    
    setIsProcessing(true);
    try {
        // Simple heuristics for type selection
        let type: SourceItem['type'] = 'website';
        const url = inputValue.toLowerCase();
        
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            type = 'youtube';
        } else if (url.endsWith('.pdf')) {
            type = 'pdf';
        } else if (url.match(/\.(jpeg|jpg|png|gif)$/)) {
            type = 'image';
        }

        // Use AI to understand the URL/Text and generate a descriptive title
        const aiTitle = await generateSourceTitle(inputValue);

        const newItem: SourceItem = {
            id: Date.now().toString(),
            type,
            title: aiTitle,
            url: inputValue,
            metadata: type === 'youtube' ? 'YouTube Video' : 'Web Resource',
            isSelected: true,
            content: `Source URL: ${inputValue}`
        };

        onAddSource(newItem);
        setInputValue('');
    } catch (error) {
        console.error("Import failed", error);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || isProcessing) return;
      
      setIsProcessing(true);

      try {
        let type: SourceItem['type'] = 'website';
        let extractedContent = '';

        if (file.type === 'application/pdf') {
            type = 'pdf';
            extractedContent = await extractTextFromPdf(file);
        } else if (file.type.startsWith('image/')) {
            type = 'image';
            extractedContent = `[Image File: ${file.name}]`;
        } else if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
            type = 'website';
            extractedContent = await file.text();
        }
        
        // Use Gemini to analyze the beginning of the content and generate a meaningful title
        // instead of just using the filename.
        const contentSnippet = extractedContent.substring(0, 1500) || file.name;
        const aiTitle = await generateSourceTitle(`Filename: ${file.name}\n\nContent: ${contentSnippet}`);

        const newItem: SourceItem = {
            id: Date.now().toString(),
            type,
            title: aiTitle,
            metadata: `Local File • ${(file.size / 1024 / 1024).toFixed(1)} MB`,
            isSelected: true,
            file: file,
            content: extractedContent
        };

        onAddSource(newItem);
      } catch (error) {
        console.error("File processing failed", error);
        alert("Failed to process file. Please try again.");
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleImport();
  };

  const getIcon = (type: SourceItem['type']) => {
      switch(type) {
          case 'youtube': return <Youtube className="w-5 h-5" />;
          case 'pdf': return <FileText className="w-5 h-5" />;
          case 'image': return <ImageIcon className="w-5 h-5" />;
          default: return <Globe className="w-5 h-5" />;
      }
  };

  const getColors = (type: SourceItem['type']) => {
      switch(type) {
          case 'youtube': return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
          case 'pdf': return 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400';
          case 'image': return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400';
          default: return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400';
      }
  };

  const selectedCount = sources.filter(s => s.isSelected).length;

  return (
    <div className="flex flex-col items-center pt-8 px-4 w-full h-full animate-fade-in max-w-4xl mx-auto">
        <header className="w-full flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Sources</h1>
            {isProcessing && (
                <div className="flex items-center gap-2 text-indigo-500 text-xs font-black uppercase tracking-widest animate-pulse">
                    <Sparkles className="w-4 h-4" /> AI Analyzing...
                </div>
            )}
        </header>
        
        {/* Input Area */}
        <div className="w-full flex gap-2 mb-8">
             <div className="flex-1 relative">
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste YouTube URL, Article Link, or drop PDF..." 
                    className="w-full p-4 pr-12 border-2 border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:border-black dark:focus:border-white transition-all shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-medium"
                    disabled={isProcessing}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    title="Upload File"
                    disabled={isProcessing}
                >
                    {isProcessing ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Upload className="w-5 h-5" />}
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept=".pdf,.txt,.md,image/*"
                />
             </div>
             <button 
                onClick={handleImport}
                disabled={isProcessing || !inputValue.trim()}
                className="bg-black dark:bg-white text-white dark:text-black px-8 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg"
             >
                Import
             </button>
        </div>

        {/* Sources List */}
        <div className="w-full">
            <div className="flex justify-between items-end mb-3 px-2">
                <h3 className="font-bold text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest">Active Sources</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Refined by AI Insight</span>
            </div>

            <div className="bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden min-h-[200px]">
                {sources.length === 0 && (
                    <div className="p-12 text-center text-gray-400 dark:text-gray-600 flex flex-col items-center">
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-full mb-4">
                            <LinkIcon className="w-10 h-10 opacity-30" />
                        </div>
                        <p className="font-black uppercase tracking-widest text-[10px]">No sources available.</p>
                        <p className="text-xs mt-2 max-w-[200px]">Import a link or file to start generating explanations.</p>
                    </div>
                )}

                <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {sources.map((source) => (
                        <div 
                            key={source.id} 
                            className={`flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group cursor-pointer ${!source.isSelected ? 'opacity-40 grayscale' : ''}`}
                            onClick={() => onToggleSource(source.id)}
                        >
                            <div className="shrink-0" onClick={(e) => { e.stopPropagation(); onToggleSource(source.id); }}>
                                {source.isSelected 
                                    ? <div className="w-6 h-6 bg-indigo-500 text-white rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20 animate-in fade-in zoom-in"><CheckSquare className="w-4 h-4" /></div>
                                    : <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-400 transition-colors"></div>
                                }
                            </div>
                            
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 shrink-0 ${getColors(source.type)}`}>
                                {getIcon(source.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-black text-sm text-gray-900 dark:text-gray-100 truncate tracking-tight">{source.title}</h4>
                                    <Sparkles className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5 truncate">{source.metadata}</p>
                            </div>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteSource(source.id); }}
                                className="p-2.5 text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all opacity-0 group-hover:opacity-100" 
                                title="Delete Source"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Delete Selected Button */}
            {selectedCount > 0 && (
                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={onDeleteSelected}
                        className="bg-white dark:bg-gray-900 border-2 border-red-50 dark:border-red-900/20 text-red-500 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 shadow-xl shadow-red-500/5 active:scale-95"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear Selected ({selectedCount})
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};
