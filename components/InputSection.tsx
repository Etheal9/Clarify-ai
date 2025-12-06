import React, { useRef, useState, useEffect } from 'react';
import { Upload, Send, FileText, Paperclip, X, User, Bot, Sparkles, Gamepad2, Lightbulb, Globe, Mic } from 'lucide-react';
import { extractTextFromPdf } from '../services/pdfUtils';
import { ChatMessage, AppTab } from '../types';
import { AnimatePresence, motion, Variants } from "framer-motion";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  activeTab: AppTab;
  hasArtifactContext: boolean;
}

export const InputSection: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage,
  isProcessing,
  activeTab,
  hasArtifactContext
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState<{name: string, content: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Animated Input States
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false);

  const PLACEHOLDERS = [
    hasArtifactContext ? "Describe changes..." : "Explain this document",
    "Generate a simulation",
    "Create a visual infographic",
    "Verify these claims",
    "Summarize the key concepts"
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Cycle placeholder text
  useEffect(() => {
    if (isActive || inputText || attachedFile) return;
 
    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);
 
    return () => clearInterval(interval);
  }, [isActive, inputText, attachedFile, PLACEHOLDERS.length]);

  // Close input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        if (!inputText && !attachedFile) setIsActive(false);
      }
    };
 
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputText, attachedFile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPdf(file);
        setAttachedFile({ name: file.name, content: text });
        setIsActive(true);
      } else if (file.type.startsWith('text/')) {
        const text = await file.text();
        setAttachedFile({ name: file.name, content: text });
        setIsActive(true);
      } else {
        alert("Please upload a PDF or text file.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to read file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    if ((!text && !attachedFile) || isProcessing) return;

    let fullContent = text;
    if (attachedFile) {
      fullContent = `${attachedFile.content}\n\nUser Context/File: ${attachedFile.name}\n${text}`;
    }
    
    // Append context flags if toggled
    if (deepSearchActive) fullContent += "\n[System: User requested Deep Search/Verification]";
    if (thinkActive) fullContent += "\n[System: User requested Deep Thinking/Analysis]";

    onSendMessage(fullContent);
    setInputText('');
    setAttachedFile(null);
    setIsActive(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActivate = () => setIsActive(true);

  // Animation Variants
  const containerVariants: Variants = {
    collapsed: {
      height: 60,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
    expanded: {
      height: 128,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
  };
 
  const placeholderContainerVariants: Variants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.025 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  };
 
  const letterVariants: Variants = {
    initial: { opacity: 0, filter: "blur(12px)", y: 10 },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        opacity: { duration: 0.25 },
        filter: { duration: 0.4 },
        y: { type: "spring", stiffness: 80, damping: 20 },
      },
    },
    exit: {
      opacity: 0,
      filter: "blur(12px)",
      y: -10,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { type: "spring", stiffness: 80, damping: 20 },
      },
    },
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors relative">
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-8 custom-scrollbar mb-24">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-3xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 shadow-lg">
              <Bot className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">How can I help?</h3>
            <p className="text-base text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
              I can explain complex docs, generate infographics, and build simulations.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              flex max-w-[90%] sm:max-w-[85%] gap-4 group
              ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}
            `}>
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'}
              `}>
                {msg.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
              </div>

              <div className={`
                flex flex-col gap-1 p-4 sm:p-5 rounded-2xl text-[15px] leading-relaxed shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-500/10' 
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-gray-200/50 dark:shadow-none'}
              `}>
                <div className="whitespace-pre-wrap font-normal">{msg.text}</div>
              </div>
            </div>
          </div>
        ))}
        
        {isProcessing && (
           <div className="flex w-full justify-start animate-fade-in">
             <div className="flex max-w-[80%] gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                   <Bot className="w-6 h-6" />
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-medium">Thinking</span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></span>
                  </div>
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Animated Input Area */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4 z-20 pointer-events-none">
        <motion.div
            ref={wrapperRef}
            className="w-full max-w-3xl pointer-events-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            variants={containerVariants}
            animate={isActive || inputText || attachedFile ? "expanded" : "collapsed"}
            initial="collapsed"
            style={{ overflow: "hidden", borderRadius: 32 }}
            onClick={handleActivate}
        >
            <div className="flex flex-col items-stretch w-full h-full">
            {/* Input Row */}
            <div className="flex items-center gap-2 p-2 rounded-full w-full h-[60px]">
                <button
                    className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition-colors"
                    title="Attach file"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Paperclip size={20} />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.txt,.md"
                    className="hidden"
                />

                {/* Text Input & Placeholder */}
                <div className="relative flex-1 h-full flex items-center">
                    {attachedFile ? (
                        <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-600 dark:text-blue-300 w-full">
                            <FileText className="w-4 h-4" />
                            <span className="truncate">{attachedFile.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); setAttachedFile(null); }} className="ml-auto p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 bg-transparent border-0 outline-none text-base text-gray-900 dark:text-gray-100 w-full font-normal"
                                style={{ position: "relative", zIndex: 1 }}
                                onFocus={handleActivate}
                            />
                            <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center">
                                <AnimatePresence mode="wait">
                                {showPlaceholder && !isActive && !inputText && (
                                    <motion.span
                                    key={placeholderIndex}
                                    className="text-gray-400 dark:text-gray-500 select-none pointer-events-none truncate"
                                    variants={placeholderContainerVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    >
                                    {PLACEHOLDERS[placeholderIndex].split("").map((char, i) => (
                                        <motion.span
                                        key={i}
                                        variants={letterVariants}
                                        style={{ display: "inline-block" }}
                                        >
                                        {char === " " ? "\u00A0" : char}
                                        </motion.span>
                                    ))}
                                    </motion.span>
                                )}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </div>

                {/* <button
                    className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition-colors"
                    title="Voice input"
                    type="button"
                >
                    <Mic size={20} />
                </button> */}
                
                <button
                    className={`
                        flex items-center justify-center p-3 rounded-full transition-all duration-200
                        ${(!inputText.trim() && !attachedFile) || isProcessing
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500' 
                        : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80'}
                    `}
                    title="Send"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSend(); }}
                    disabled={(!inputText.trim() && !attachedFile) || isProcessing}
                >
                    {isProcessing ? (
                         <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send size={18} />
                    )}
                </button>
            </div>

            {/* Expanded Controls */}
            <motion.div
                className="w-full flex justify-start px-4 items-center text-sm"
                variants={{
                hidden: { opacity: 0, y: 10, pointerEvents: "none", transition: { duration: 0.2 } },
                visible: { opacity: 1, y: 0, pointerEvents: "auto", transition: { duration: 0.3, delay: 0.1 } },
                }}
                initial="hidden"
                animate={isActive || inputText || attachedFile ? "visible" : "hidden"}
            >
                <div className="flex gap-3 items-center mt-2">
                {/* Think Toggle */}
                <button
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all font-medium text-xs border ${
                    thinkActive
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                        : "bg-gray-50 dark:bg-gray-700/50 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setThinkActive((a) => !a); }}
                >
                    <Lightbulb className={thinkActive ? "fill-blue-400 text-blue-500" : ""} size={14} />
                    Think
                </button>

                {/* Deep Search Toggle */}
                <motion.button
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all font-medium text-xs border overflow-hidden whitespace-nowrap ${
                    deepSearchActive
                        ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
                        : "bg-gray-50 dark:bg-gray-700/50 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDeepSearchActive((a) => !a); }}
                    layout
                >
                    <Globe size={14} className={deepSearchActive ? "text-green-500" : ""} />
                    <motion.span layout>
                        {deepSearchActive ? "Deep Search On" : "Search"}
                    </motion.span>
                </motion.button>
                </div>
            </motion.div>
            </div>
        </motion.div>
      </div>

    </div>
  );
};