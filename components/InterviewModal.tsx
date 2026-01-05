import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatSession, createInterviewSession } from '../services/openaiService';

interface InterviewModalProps {
  career: string;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'model';
  text?: string;      // For user messages
  feedback?: string;  // For model feedback
  question?: string;  // For model question
  summary?: string;   // For final summary
}

const InterviewModal: React.FC<InterviewModalProps> = ({ career, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const chatSessionRef = useRef<ChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Key for localStorage based on career
  const storageKey = `futurecompass_interview_${career.replace(/\s+/g, '_').toLowerCase()}`;

  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      try {
        const savedData = localStorage.getItem(storageKey);
        let history: ChatMessage[] = [];
        let savedMessages: Message[] = [];

        if (savedData) {
          try {
            savedMessages = JSON.parse(savedData);
            setMessages(savedMessages);

            // Check if last message was a summary (interview finished)
            if (savedMessages.length > 0 && savedMessages[savedMessages.length - 1].summary) {
              setIsFinished(true);
            }

            // Reconstruct history for the SDK
            // We assume the conversation always started with the implicit "Start the interview." command
            history.push({ role: 'user', content: "Start the interview." });

            savedMessages.forEach(msg => {
              if (msg.role === 'user' && msg.text) {
                history.push({ role: 'user', content: msg.text });
              } else if (msg.role === 'model') {
                // Reconstruct the JSON object for the model's history
                const jsonContent = JSON.stringify({
                  feedback: msg.feedback,
                  nextQuestion: msg.question,
                  interviewSummary: msg.summary
                });
                history.push({ role: 'assistant', content: jsonContent });
              }
            });
          } catch (e) {
            console.error("Failed to parse saved history", e);
            // If parse fails, treat as new session
            localStorage.removeItem(storageKey);
            savedMessages = [];
          }
        }

        // Initialize chat with reconstructed history
        chatSessionRef.current = createInterviewSession(career, history);

        // If no saved messages, start the conversation
        if (savedMessages.length === 0) {
          const result = await chatSessionRef.current.sendMessage({ message: "Start the interview." });
          if (result.text) {
            try {
              const data = JSON.parse(result.text);
              const initialMsg: Message = { role: 'model', feedback: data.feedback, question: data.nextQuestion };
              setMessages([initialMsg]);
              localStorage.setItem(storageKey, JSON.stringify([initialMsg]));
            } catch (e) {
              console.error("Failed to parse initial JSON", e);
              const fallbackMsg: Message = { role: 'model', question: result.text || "Hello! Ready to start?" };
              setMessages([fallbackMsg]);
            }
          }
        }
      } catch (error) {
        console.error("Failed to start chat", error);
        setMessages([{ role: 'model', question: "Sorry, I couldn't start the interview. Please check your connection." }]);
      } finally {
        setIsLoading(false);
      }
    };
    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [career]);

  // Save messages to local storage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current || isLoading) return;

    const userMsg = input;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg });
      if (result.text) {
        try {
          const data = JSON.parse(result.text);
          setMessages([...newMessages, { role: 'model', feedback: data.feedback, question: data.nextQuestion }]);
        } catch (e) {
          // Fallback if JSON fails
          setMessages([...newMessages, { role: 'model', question: result.text || "I didn't catch that." }]);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: 'model', question: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!chatSessionRef.current || isLoading) return;
    if (!window.confirm("Are you sure you want to finish the interview and get your report?")) return;

    setIsLoading(true);
    try {
      const result = await chatSessionRef.current.sendMessage({ message: "FINISH_INTERVIEW" });
      if (result.text) {
        try {
          const data = JSON.parse(result.text);
          const finishMsg: Message = { 
            role: 'model', 
            feedback: data.feedback, 
            question: "", // Not needed for summary view
            summary: data.interviewSummary 
          };
          setMessages(prev => [...prev, finishMsg]);
          setIsFinished(true);
        } catch (e) {
          console.error("Error parsing summary", e);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm("Start over? This will clear your current interview progress.")) {
      setIsLoading(true);
      setIsFinished(false);
      localStorage.removeItem(storageKey);
      setMessages([]);
      
      try {
        // Re-initialize a fresh session
        chatSessionRef.current = createInterviewSession(career, []); // Empty history
        const result = await chatSessionRef.current.sendMessage({ message: "Start the interview." });
        if (result.text) {
           try {
            const data = JSON.parse(result.text);
            const initialMsg: Message = { role: 'model', feedback: data.feedback, question: data.nextQuestion };
            setMessages([initialMsg]);
          } catch (e) {
            setMessages([{ role: 'model', question: result.text || "Hello! Ready to start?" }]);
          }
        }
      } catch (e) {
        console.error("Error restarting", e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-brand-600 p-4 flex justify-between items-center">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Coach Interview: {career}
          </h3>
          <div className="flex items-center gap-2">
            {!isFinished && (
              <button 
                onClick={handleFinish}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors border border-white/20"
              >
                Finish & Get Summary
              </button>
            )}
            <button 
              onClick={handleReset}
              className="text-white/80 hover:text-white hover:bg-white/10 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              Restart
            </button>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.role === 'user' ? (
                // User Message
                <div className="max-w-[80%] bg-brand-600 text-white rounded-2xl rounded-br-none px-4 py-3 text-sm leading-relaxed shadow-sm">
                  {msg.text}
                </div>
              ) : (
                // Model Message
                <div className="max-w-[90%] w-full space-y-2">
                  {/* Summary Card (If Present) */}
                  {msg.summary ? (
                    <div className="bg-white border-2 border-brand-200 rounded-xl p-6 shadow-md animate-fade-in">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-brand-100 text-brand-700 p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        <h4 className="text-xl font-bold text-slate-800">Interview Summary</h4>
                      </div>
                      
                      {msg.feedback && (
                         <div className="mb-4 text-slate-600 italic border-l-4 border-slate-300 pl-3">
                           "{msg.feedback}"
                         </div>
                      )}

                      <div className="space-y-4">
                        <div className="prose prose-sm prose-slate max-w-none">
                           <div className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                             {msg.summary}
                           </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                        <button onClick={onClose} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium">
                          Close Interview
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Standard Feedback & Question
                    <>
                      {msg.feedback && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg shadow-sm w-fit max-w-[85%]">
                          <div className="flex items-center gap-2 text-yellow-800 font-bold text-xs uppercase tracking-wide mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Coach's Feedback
                          </div>
                          <p className="text-slate-700 text-sm">{msg.feedback}</p>
                        </div>
                      )}
                      
                      {msg.question && (
                        <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-sm leading-relaxed shadow-sm w-fit max-w-[85%]">
                          {msg.question}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-200">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {!isFinished && (
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your answer..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white p-3 rounded-xl transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewModal;
