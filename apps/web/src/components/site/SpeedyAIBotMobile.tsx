'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ExtractedData {
  pickupAddress?: string;
  dropoffAddress?: string;
  numberOfRooms?: number;
  specialItems?: string[];
  movingDate?: string;
}

interface QuoteData {
  total: number;
  vehicleType: string;
  estimatedDuration: string;
}

export default function SpeedyAIBotMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! 👋 I\'m Speedy AI. I can help you get an instant quote for your move. Where are you moving from?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [canCalculate, setCanCalculate] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<Array<{ name: string; type: string; url?: string }>>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Init Web Speech API
  useEffect(() => {
    // Load TTS preference
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('sv_ai_tts_enabled') : null;
      if (saved != null) setTtsEnabled(saved === 'true');
    } catch {}

    const SpeechRecognition: any =
      (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    setSupportsSpeech(Boolean(SpeechRecognition));
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-GB';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        try {
          const transcript: string = event.results[0][0].transcript;
          if (transcript && transcript.trim()) {
            handleSendMessage(transcript.trim());
          }
        } catch {}
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const handleSendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!overrideText) setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
          extractedData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        if (ttsEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            const utter = new SpeechSynthesisUtterance(data.message);
            utter.lang = 'en-GB';
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utter);
          } catch {}
        }

        if (data.extractedData) {
          setExtractedData((prev) => ({ ...prev, ...data.extractedData }));
        }
        setCanCalculate(Boolean(data.shouldCalculateQuote && data.extractedData));
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, I\'m experiencing technical difficulties. Please try again or call us at +44 1202129746.',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    // Lazy init
    if (!recognitionRef.current) {
      const SpeechRecognition: any =
        (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
        null;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-GB';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (ev: any) => {
          setIsListening(false);
          try {
            const err = ev?.error || 'unknown';
            alert(err === 'not-allowed'
              ? 'Microphone permission denied. Allow mic access in your browser settings.'
              : err === 'service-not-allowed'
              ? 'Speech service blocked. Use HTTPS or Chrome/Edge/Safari.'
              : `Speech error: ${String(err)}`);
          } catch {}
        };
        recognition.onresult = (event: any) => {
          try {
            const transcript: string = event.results[0][0].transcript;
            if (transcript && transcript.trim()) {
              handleSendMessage(transcript.trim());
            }
          } catch {}
        };
        recognitionRef.current = recognition;
        setSupportsSpeech(true);
      }
    }
    if (!supportsSpeech || !recognitionRef.current) {
      try { window.alert('Voice input not supported on this browser. Use Chrome/Edge/Safari over HTTPS.'); } catch {}
      return;
    }
    try {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
    } catch {}
  };

  const toggleTts = () => {
    const next = !ttsEnabled;
    setTtsEnabled(next);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('sv_ai_tts_enabled', String(next));
      }
    } catch {}
  };

  const calculateQuote = async (data: ExtractedData) => {
    try {
      setCanCalculate(false);
      const response = await fetch('/api/ai/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddress: data.pickupAddress,
          dropoffAddress: data.dropoffAddress,
          numberOfRooms: data.numberOfRooms || 2,
          specialItems: data.specialItems || [],
          movingDate: data.movingDate,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setQuoteData(result.quote);
        
        const quoteMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `Great! Based on your requirements:\n\n💰 Total: £${result.quote.total.toFixed(2)}\n🚚 Vehicle: ${result.quote.vehicleType}\n⏱️ Duration: ${result.quote.estimatedDuration}\n\nWould you like to proceed with booking?`,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, quoteMessage]);
      }
    } catch (error) {
      console.error('Quote calculation error:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const onUploadClick = () => fileInputRef.current?.click();

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const maxSize = 10 * 1024 * 1024;
    const accepted = Array.from(files).filter(f => (
      ['image/jpeg','image/png','image/webp','image/jpg','text/plain','application/pdf'].includes(f.type)
    ) && f.size <= maxSize);
    if (accepted.length === 0) return;
    const previews = accepted.map(f => ({ name: f.name, type: f.type, url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined }));
    setPendingFiles(previews);
    const form = new FormData();
    form.append('message', inputValue || '');
    accepted.forEach(f => form.append('files', f));
    form.append('conversationHistory', JSON.stringify(messages.slice(-6).map(m => ({ role: m.role, content: m.content }))));
    form.append('extractedData', JSON.stringify(extractedData));
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        const aiMessage: Message = { id: (Date.now()+1).toString(), role: 'assistant', content: data.message, timestamp: new Date() };
        setMessages(prev => [...prev, aiMessage]);
        if (data.extractedData) setExtractedData(prev => ({ ...prev, ...data.extractedData }));
        setCanCalculate(Boolean(data.shouldCalculateQuote && data.extractedData));
        if (ttsEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try { const u = new SpeechSynthesisUtterance(data.message); u.lang='en-GB'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);} catch {}
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes slideUp {
          from { 
            transform: translateY(100%);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Floating Button - Mobile Only */}
      {!isOpen && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            right: 'auto',
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            border: 'none',
            padding: '0',
            overflow: 'hidden',
            cursor: 'pointer',
            zIndex: 9998,
            boxShadow: 'none',
            transition: 'transform 0.2s ease',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            background: 'transparent',
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onTouchCancel={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <div
            style={{
              width: '18%',
              height: '100%',
              display: 'right',
              alignItems: 'right',
              justifyContent: 'right',
            }}
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: '140%',
                height: '136%',
                objectFit: 'cover',
                objectPosition: 'right',
                display: 'block',
              }}
            >
              <source src="/logo/AB7D9FB6-5E70-43CC-A81F-A47E875EC79F-video.mp4" type="video/mp4" />
            </video>
          </div>
        </button>
      )}

      {/* Chat Window - Mobile Only */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
              padding: '16px',
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                >
                  <source src="/logo/AB7D9FB6-5E70-43CC-A81F-A47E875EC79F-video.mp4" type="video/mp4" />
                </video>
              </div>
              
              <div>
                <div style={{
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: '700',
                  marginBottom: '2px',
                }}>
                  Speedy AI
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.9)',
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    animation: 'pulse 2s ease-in-out infinite',
                  }} />
                  Online
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={toggleTts}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                }}
                title={ttsEnabled ? 'Voice replies on' : 'Voice replies off'}
              >
                {ttsEnabled ? '🔊' : '🔇'}
              </button>

              <button
                onClick={() => setIsOpen(false)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              }}
            >
              ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '16px',
              backgroundColor: '#f9fafb',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {messages.map((message, index) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '16px',
                  animation: 'fadeIn 0.3s ease-out',
                }}
              >
                {message.role === 'assistant' && (
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginRight: '8px',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    }}
                  >
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    >
                      <source src="/logo/AB7D9FB6-5E70-43CC-A81F-A47E875EC79F-video.mp4" type="video/mp4" />
                    </video>
                  </div>
                )}
                
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    backgroundColor: message.role === 'user' ? '#3B82F6' : '#ffffff',
                    color: message.role === 'user' ? '#ffffff' : '#1f2937',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    wordWrap: 'break-word',
                    boxShadow: message.role === 'user' 
                      ? '0 2px 8px rgba(59, 130, 246, 0.3)' 
                      : '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginRight: '8px',
                    flexShrink: 0,
                  }}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  >
                    <source src="/logo/AB7D9FB6-5E70-43CC-A81F-A47E875EC79F-video.mp4" type="video/mp4" />
                  </video>
                </div>
                
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '16px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#3B82F6',
                      animation: 'pulse 1s ease-in-out infinite',
                    }} />
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#3B82F6',
                      animation: 'pulse 1s ease-in-out 0.2s infinite',
                    }} />
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#3B82F6',
                      animation: 'pulse 1s ease-in-out 0.4s infinite',
                    }} />
                  </div>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quote Summary */}
          {quoteData && (
            <div
              style={{
                padding: '16px',
                backgroundColor: '#eff6ff',
                borderTop: '1px solid #dbeafe',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <span style={{ color: '#10B981', fontSize: '18px' }}>✓</span>
                  Quote Ready
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#3B82F6',
                }}>
                  £{quoteData.total.toFixed(2)}
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                }}
              >
                Book Now
              </button>
            </div>
          )}

          {/* Calculate Quote Now CTA - Mobile */}
          {canCalculate && !quoteData && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#ecfdf5',
                borderTop: '1px solid #bbf7d0',
              }}
            >
              <button
                onClick={() => calculateQuote(extractedData)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                Calculate quote now
              </button>
            </div>
          )}

          {/* Input */}
          <div
            style={{
              padding: '16px',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            {!!pendingFiles.length && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {pendingFiles.slice(0,3).map((f, idx) => (
                  <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '4px' }}>
                    {f.url ? (
                      <img src={f.url} alt={f.name} style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '12px', maxWidth: '80px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              style={{
                flex: 1,
                height: '22px',
                padding: '0 20px',
                borderRadius: '28px',
                border: '1px solid rgb(229, 229, 235)',
                fontSize: '17px',
                outline: 'none',
                backgroundColor: '#f9fafb',
                transition: 'border 0.2s ease-in-out',
              }}
            />
            <button
              onClick={onUploadClick}
              style={{
                width: '44px', height: '44px', borderRadius: '50%', border: '1px solid #d1d5db', backgroundColor: '#ffffff', fontSize: '18px'
              }}
              title="Upload files"
            >
              📎
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg,text/plain,application/pdf" multiple onChange={handleFilesSelected} style={{ display:'none' }} />
            {/* Mic button */}
            <button
              onClick={toggleListening}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: isListening ? '2px solid #ef4444' : '1px solid #d1d5db',
                backgroundColor: isListening ? '#fee2e2' : '#ffffff',
                color: isListening ? '#b91c1c' : '#374151',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={supportsSpeech ? (isListening ? 'Stop voice input' : 'Start voice input') : 'Voice input not supported'}
            >
              🎤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

