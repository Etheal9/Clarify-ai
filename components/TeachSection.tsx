
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Square, Volume2, VolumeX, GraduationCap, User, Brain, Hand, ChevronLeft, Globe } from 'lucide-react';
import { createStudentSession, sendMessageToStudent, StudentType, generateSpeech } from '../services/geminiService';
import { Button } from './Button';

interface TeachSectionProps {
  initialTopic?: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  studentName?: string;
}

interface StudentState {
  id: string;
  name: string;
  type: StudentType;
  isEnabled: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
  avatar: string;
  description: string;
  identity: string;
  voice: string;
  session: any;
}

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const TeachSection: React.FC<TeachSectionProps> = ({ initialTopic = '' }) => {
  const [topic, setTopic] = useState(initialTopic);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [language, setLanguage] = useState<'en-US' | 'am-ET'>('en-US');

  const audioContextRef = useRef<AudioContext | null>(null);
  const [students, setStudents] = useState<StudentState[]>([
    { 
        id: '1', name: 'ALEX', type: 'normal', isEnabled: true, isHandRaised: false, isSpeaking: false,
        avatar: '🎓', description: 'Logical Learner', voice: 'Zephyr',
        identity: 'Asks for facts and data-driven explanations.', session: null 
    },
    { 
        id: '2', name: 'BLAKE', type: 'argumentative', isEnabled: true, isHandRaised: false, isSpeaking: false,
        avatar: '🧐', description: 'Critical Skeptic', voice: 'Puck',
        identity: 'Challenges assumptions and looks for errors.', session: null 
    },
    { 
        id: '3', name: 'CHARLIE', type: 'creative', isEnabled: true, isHandRaised: false, isSpeaking: false,
        avatar: '🎨', description: 'Critical Creative', voice: 'Kore',
        identity: 'Deconstructs ideas from first principles and asks provocative questions.', session: null 
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

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
    }
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const speakText = async (text: string, voiceName: string, studentId: string) => {
    if (!isTTSEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    try {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, isSpeaking: true } : s));
      const audioBase64 = await generateSpeech(text, voiceName);
      const audioBytes = decodeBase64(audioBase64);
      const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = 1.15;
      source.connect(ctx.destination);
      source.onended = () => setStudents(prev => prev.map(s => s.id === studentId ? { ...s, isSpeaking: false } : s));
      source.start();
    } catch (error) {
      console.error(error);
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, isSpeaking: false } : s));
    }
  };

  const startSession = async () => {
    if (!topic.trim()) return;
    setIsSessionActive(true);
    setIsProcessing(true);
    try {
        const updatedStudents = students.map(s => ({ ...s, session: s.isEnabled ? createStudentSession(topic, s.type) : null }));
        setStudents(updatedStudents);
        const firstActive = updatedStudents.find(s => s.isEnabled);
        if (firstActive) {
            const responseText = await sendMessageToStudent(firstActive.session, "Teacher, we're ready. What are we covering today?", null);
            setMessages([{ id: 'init', role: 'model', text: responseText, studentName: firstActive.name }]);
            speakText(responseText, firstActive.voice, firstActive.id);
        }
    } catch (e) {
        setIsSessionActive(false);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleTeacherInput = async (text: string) => {
    if (isProcessing || !text.trim()) return;
    const teacherMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, teacherMsg]);
    setIsProcessing(true);
    setTimeout(() => {
        setStudents(prev => prev.map(s => s.isEnabled ? { ...s, isHandRaised: Math.random() < (s.type === 'argumentative' ? 0.7 : 0.4) } : s));
        setIsProcessing(false);
    }, 1200);
    (window as any)._classroomContext = { text };
  };

  const callOnStudent = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student || !student.isHandRaised || isProcessing) return;
    setIsProcessing(true);
    const context = (window as any)._classroomContext || { text: "What do you think?" };
    try {
        const responseText = await sendMessageToStudent(student.session, context.text, null);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText, studentName: student.name }]);
        speakText(responseText, student.voice, student.id);
        setStudents(prev => prev.map(s => ({ ...s, isHandRaised: false })));
    } catch (e) {
        console.error(e);
    } finally {
        setIsProcessing(false);
    }
  };

  const toggleLiveTeaching = () => {
    if (!recognitionRef.current) return alert("STT not supported.");
    if (isRecording) {
        recognitionRef.current.stop();
        setIsRecording(false);
        if (inputText.trim()) { handleTeacherInput(inputText); setInputText(''); }
    } else {
        recognitionRef.current.start();
        setIsRecording(true);
    }
  };

  if (!isSessionActive) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-black overflow-y-auto">
              <div className="max-w-4xl w-full space-y-12">
                  <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl mx-auto flex items-center justify-center">
                          <GraduationCap className="w-8 h-8 text-white dark:text-black" />
                      </div>
                      <h1 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white">Live Virtual Classroom</h1>
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Select your students</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {students.map(student => (
                          <div 
                            key={student.id}
                            onClick={() => setStudents(prev => prev.map(s => s.id === student.id ? { ...s, isEnabled: !s.isEnabled } : s))}
                            className={`flex flex-col items-center p-6 rounded-[2rem] border transition-all cursor-pointer group ${student.isEnabled ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-900 shadow-md' : 'opacity-20 grayscale'}`}
                          >
                              <span className="text-4xl mb-3">{student.avatar}</span>
                              <span className="font-black text-xs uppercase tracking-widest text-black dark:text-white">{student.name}</span>
                          </div>
                      ))}
                  </div>
                  <div className="space-y-6 max-w-lg mx-auto w-full">
                      <input 
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="What are you teaching?"
                        className="w-full bg-gray-100 dark:bg-gray-950 rounded-full px-6 py-4 text-center text-lg font-black outline-none border-2 border-transparent focus:border-black dark:focus:border-white text-black dark:text-white"
                      />
                      <Button onClick={startSession} className="w-full py-4 text-sm bg-black dark:bg-white text-white dark:text-black rounded-full font-black uppercase tracking-widest shadow-xl">Start Class</Button>
                  </div>
              </div>
          </div>
      );
  }

  return (
      <div className="h-full flex flex-col bg-white dark:bg-black overflow-hidden relative">
          {/* Compact Header with Back Button */}
          <header className="h-12 px-4 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between shrink-0 z-20">
              <div className="flex items-center gap-3">
                  <button onClick={() => setIsSessionActive(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                    <h3 className="font-black uppercase text-[9px] tracking-widest truncate max-w-[120px] text-black dark:text-white">{topic}</h3>
                    <button onClick={() => setLanguage(l => l === 'en-US' ? 'am-ET' : 'en-US')} className="ml-1 text-[7px] font-black uppercase text-gray-400 flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> {language === 'en-US' ? 'EN' : 'AM'}</button>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <button onClick={() => setIsTTSEnabled(!isTTSEnabled)} className="text-gray-400 hover:text-black dark:hover:text-white">
                      {isTTSEnabled ? <Volume2 className="w-3.5 h-3.5"/> : <VolumeX className="w-3.5 h-3.5"/>}
                  </button>
                  <button onClick={() => setIsSessionActive(false)} className="text-red-500 text-[8px] font-black uppercase tracking-widest">END CLASS</button>
              </div>
          </header>

          {/* Centered Small Student Bar */}
          <div className="py-2 bg-gray-50/50 dark:bg-[#050505] border-b border-gray-100 dark:border-gray-900 shrink-0 flex justify-center">
              <div className="flex gap-10">
                  {students.filter(s => s.isEnabled).map((student) => (
                      <div key={student.id} onClick={() => callOnStudent(student.id)} className={`flex flex-col items-center relative transition-all duration-300 cursor-pointer ${student.isHandRaised ? '-translate-y-1' : ''}`}>
                          {student.isHandRaised && !student.isSpeaking && <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce"><Hand className="w-3 h-3 text-black dark:text-white fill-current" /></div>}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition-all border-2 ${student.isHandRaised ? 'border-black dark:border-white shadow-sm' : 'border-white dark:border-gray-800 bg-white dark:bg-gray-900'} ${student.isSpeaking ? 'scale-110 ring-2 ring-blue-500/10' : ''}`}>{student.avatar}</div>
                          <span className="mt-1 text-[6px] font-black uppercase tracking-widest opacity-60 text-black dark:text-white">{student.name}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-white dark:bg-black">
              {messages.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-5 select-none grayscale"><Brain className="w-10 h-10 mb-3" /><p className="font-black uppercase tracking-[0.4em] text-[10px]">Waiting to Learn</p></div>}
              {messages.map((msg) => {
                  const isModel = msg.role === 'model';
                  return (
                    <div key={msg.id} className={`flex ${isModel ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                        <div className={`flex gap-2.5 max-w-[90%] ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
                            {isModel && <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center mt-1 text-[9px] border border-gray-200 dark:border-gray-700">🎓</div>}
                            <div className="min-w-0">
                                {isModel && <span className="text-[6px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">{msg.studentName} IS RESPONDING</span>}
                                <div className={`p-3 rounded-xl text-[13px] font-bold leading-relaxed shadow-sm ${isModel ? 'bg-gray-50 dark:bg-[#121212] text-black dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-800' : 'bg-black dark:bg-white text-white dark:text-black rounded-tr-none'}`}>{msg.text}</div>
                            </div>
                        </div>
                    </div>
                  );
              })}
              {isProcessing && <div className="flex justify-start animate-fade-in"><div className="flex gap-2 items-center"><div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center text-[10px]">⏳</div><div className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded-xl rounded-tl-none flex gap-1"><div className="w-1 h-1 bg-black dark:bg-white rounded-full animate-bounce"></div><div className="w-1 h-1 bg-black dark:bg-white rounded-full animate-bounce delay-75"></div><div className="w-1 h-1 bg-black dark:bg-white rounded-full animate-bounce delay-150"></div></div></div></div>}
              <div ref={messagesEndRef} />
          </div>

          {/* Input & Status (Flush with bottom) */}
          <div className="w-full bg-white dark:bg-black z-30 shrink-0 border-t border-gray-100 dark:border-gray-900 pt-2 pb-0">
              <div className="max-w-xl mx-auto flex flex-col items-center">
                  <div className="w-full px-4 mb-2">
                      <div className="w-full flex items-center gap-2 bg-gray-50 dark:bg-[#0c0c0c] p-1.5 pr-4 rounded-full border border-gray-200 dark:border-gray-800 focus-within:border-gray-400 dark:focus-within:border-gray-700 transition-all shadow-sm">
                          <button onClick={toggleLiveTeaching} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm'}`}>{isRecording ? <Square className="w-3 h-3 fill-current" /> : <Mic className="w-3 h-3" />}</button>
                          <textarea rows={1} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleTeacherInput(inputText), setInputText(''))} placeholder={isRecording ? "Listening..." : "Teach clearly..." } className="flex-1 bg-transparent outline-none text-black dark:text-white font-bold text-[11px] placeholder-gray-500 py-2 resize-none px-1" />
                          <button onClick={() => { handleTeacherInput(inputText); setInputText(''); }} disabled={!inputText.trim() || isProcessing} className={`p-1.5 transition-all ${!inputText.trim() || isProcessing ? 'opacity-20' : 'text-black dark:text-white'}`}><Send className="w-3.5 h-3.5" /></button>
                      </div>
                  </div>
                  {/* Status Bar - ABSOLUTELY LAST, NO SPACE BELOW */}
                  <div className="w-full py-2 bg-gray-50/80 dark:bg-[#050505]/80 flex flex-col items-center">
                      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-gray-400 text-center leading-none">
                        {students.some(s => s.isHandRaised) ? <span className="text-indigo-500 animate-pulse">A student has a question! Call on them.</span> : "VOICE TEACHING ACTIVE. EXPLAIN CLEARLY, STUDENTS ARE LISTENING."}
                      </p>
                  </div>
              </div>
          </div>
      </div>
  );
};
