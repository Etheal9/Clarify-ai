
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Mic, 
  Square, 
  X, 
  Plus, 
  Trash2, 
  Globe, 
  ChevronDown, 
  ChevronUp,
  Save,
  PenLine,
  Sparkles
} from 'lucide-react';

interface Note {
  id: string;
  text: string;
  timestamp: number;
  lang: 'en-US' | 'am-ET';
}

export const FloatingNotebook: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [micLang, setMicLang] = useState<'en-US' | 'am-ET'>('en-US');
  
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = micLang;

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) setInputText(prev => prev + transcript + ' ');
      };

      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, [micLang]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  const toggleMic = () => {
    if (!recognitionRef.current) return alert("Speech recognition not supported in this browser.");
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const addNote = () => {
    if (!inputText.trim()) return;
    const newNote: Note = {
      id: Date.now().toString(),
      text: inputText.trim(),
      timestamp: Date.now(),
      lang: micLang
    };
    setNotes([...notes, newNote]);
    setInputText('');
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
            className="w-[350px] sm:w-[400px] h-[500px] bg-white/90 dark:bg-black/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border-2 border-gray-100 dark:border-gray-900 mb-6 flex flex-col overflow-hidden pointer-events-auto ring-1 ring-black/5 dark:ring-white/5"
          >
            {/* Notebook Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-gray-900/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-xl">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-black dark:text-white leading-none">Insight Notebook</h3>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{notes.length} Active Notes</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Notes List */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
            >
              {notes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                  <PenLine className="w-12 h-12 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No insights yet.<br/>Speak or type to capture knowledge.</p>
                </div>
              ) : (
                notes.map((note) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={note.id} 
                    className="group relative bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[8px] font-black uppercase text-indigo-500 tracking-widest">
                         {note.lang === 'am-ET' ? 'አማርኛ' : 'English'} • {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                       <button 
                        onClick={() => deleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                       >
                         <Trash2 className="w-3 h-3" />
                       </button>
                    </div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                      {note.text}
                    </p>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-black shrink-0">
               <div className="flex items-center gap-2 mb-3">
                  <button 
                    onClick={() => setMicLang(l => l === 'en-US' ? 'am-ET' : 'en-US')}
                    className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                  >
                    <Globe className="w-3 h-3" /> {micLang === 'en-US' ? 'EN' : 'አማ'}
                  </button>
                  {isRecording && (
                    <div className="flex items-center gap-1 text-red-500 text-[9px] font-black animate-pulse">
                       <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> RECORDING
                    </div>
                  )}
               </div>

               <div className="relative group">
                  <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addNote())}
                    placeholder={isRecording ? "Listening..." : "Add a thought..."}
                    className="w-full bg-gray-50 dark:bg-[#0c0c0c] border border-gray-100 dark:border-gray-900 rounded-2xl py-3 pl-4 pr-12 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner resize-none h-12 no-scrollbar"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button 
                      onClick={toggleMic}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-black dark:hover:text-white'}`}
                    >
                      {isRecording ? <Square className="w-3 h-3 fill-current" /> : <Mic className="w-4 h-4" />}
                    </button>
                    {inputText.trim() && (
                      <button 
                        onClick={addNote}
                        className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    )}
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        layout
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="pointer-events-auto h-16 w-16 bg-black dark:bg-white text-white dark:text-black rounded-[1.5rem] shadow-2xl flex items-center justify-center relative group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
               <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="open" className="relative">
               <BookOpen className="w-7 h-7" />
               <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-indigo-400 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Notification Badge */}
        {!isOpen && notes.length > 0 && (
          <span className="absolute -top-2 -left-2 bg-indigo-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-black">
            {notes.length}
          </span>
        )}
      </motion.button>
    </div>
  );
};
