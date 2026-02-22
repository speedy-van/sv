'use client';

import { useState, useRef, useEffect } from 'react';
import {
  safeLocalStorageGetItem,
  safeLocalStorageSetItem,
  safeSessionStorageSetItem,
} from '@/lib/safe-storage';

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
  vehicleType?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

interface QuoteData {
  total: number;
  subtotal: number;
  vat: number;
  basePrice: number;
  helpersCost: number;
  specialItemsCost: number;
  vehicleType: string;
  estimatedDuration: string;
  helpers: number;
  distance: number;
}

export default function SpeedyAIBotMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Speedy AI. I'll get you an instant moving quote. Where are you moving from?",
      timestamp: new Date(),
    },
  ]);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [canCalculate, setCanCalculate] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<{name?: string; email?: string; phone?: string}>({});
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
    const saved = safeLocalStorageGetItem('sv_ai_tts_enabled');
    if (saved != null) setTtsEnabled(saved === 'true');

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
        
        // Update progress step
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
        
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

          // Update customer details separately for payment handoff
          if (data.extractedData.customerName || data.extractedData.customerEmail || data.extractedData.customerPhone) {
            setCustomerDetails((prev) => ({
              ...prev,
              name: data.extractedData.customerName || prev.name,
              email: data.extractedData.customerEmail || prev.email,
              phone: data.extractedData.customerPhone || prev.phone,
            }));
          }
        }
        setCanCalculate(Boolean(data.shouldCalculateQuote && data.extractedData));
      } else {
        // Use API error message if available
        const apiError = data.error || 'Failed to get response';
        const apiMessage = data.message || apiError;
        throw new Error(JSON.stringify({ error: apiError, message: apiMessage }));
      }
    } catch (error: any) {
      console.error('Chat error:', error);

      // H4: Specific error messages based on error type
      let errorContent = 'I apologize, I\'m experiencing technical difficulties. Please try again or call us at 01202 129746.';

      // Try to parse API error response
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.message) {
          errorContent = errorData.message;
        }
      } catch {
        // Not a JSON error, check message patterns
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          errorContent = 'Connection issue detected. Please check your internet connection and try again.';
        } else if (error.message?.includes('timeout')) {
          errorContent = 'Our servers are busy right now. Please try again in a moment.';
        }
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
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
    safeLocalStorageSetItem('sv_ai_tts_enabled', String(next));
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
        
        // H1: Detailed pricing breakdown
        const breakdown = [
          `**Base:** £${result.quote.basePrice.toFixed(2)}`,
          result.quote.distance ? `**Distance:** ${result.quote.distance.toFixed(1)}mi` : null,
          result.quote.helpersCost > 0 ? `**Helpers:** £${result.quote.helpersCost.toFixed(2)}` : null,
          result.quote.specialItemsCost > 0 ? `**Items:** £${result.quote.specialItemsCost.toFixed(2)}` : null,
          `**Subtotal:** £${result.quote.subtotal.toFixed(2)}`,
          `**VAT:** £${result.quote.vat.toFixed(2)}`,
        ].filter(Boolean).join('\n');

        const quoteMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `Great! Based on your requirements:\n\n💰 **Total: £${result.quote.total.toFixed(2)}**\n\n${breakdown}\n\n🚚 ${result.quote.vehicleType}\n⏱️ ${result.quote.estimatedDuration}\n\nReady to book?`,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, quoteMessage]);
      }
    } catch (error) {
      console.error('Quote calculation error:', error);
    }
  };

  const handleProceedToPayment = async () => {
    try {
      setIsLoading(true);

      // Parse customer name
      const nameParts = (customerDetails.name || '').trim().split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || 'Speedy';

      // Prepare items array
      const items = (extractedData.specialItems || []).map(item => {
        const [quantityPart, ...nameParts] = item.split(' ');
        const quantity = parseInt(quantityPart) || 1;
        const name = nameParts.join(' ') || item;

        return {
          id: `item_${Date.now()}_${Math.random()}`,
          name: name,
          category: 'furniture',
          quantity: quantity,
          weight: 20,
          volume: 0.5,
        };
      });

      // Create booking
      const response = await fetch('/api/ai/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerDetails: {
            firstName,
            lastName,
            email: customerDetails.email || '',
            phone: customerDetails.phone || '',
          },
          pickupAddress: {
            full: extractedData.pickupAddress || '',
            postcode: extractedData.pickupAddress?.split(',').pop()?.trim() || '',
          },
          dropoffAddress: {
            full: extractedData.dropoffAddress || '',
            postcode: extractedData.dropoffAddress?.split(',').pop()?.trim() || '',
          },
          items: items.length > 0 ? items : [{
            id: `room_${Date.now()}`,
            name: `${extractedData.numberOfRooms || 2} Bedroom Move`,
            category: 'room-package',
            quantity: 1,
            weight: (extractedData.numberOfRooms || 2) * 50,
            volume: (extractedData.numberOfRooms || 2) * 2,
          }],
          serviceType: 'standard',
          pickupDate: extractedData.movingDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          pricing: {
            subtotal: quoteData?.total || 150,
            vat: (quoteData?.total || 150) * 0.2,
            total: quoteData?.total || 150,
            distance: quoteData?.distance || 10,
          },
        }),
      });

      const result = await response.json();

      if (result.success && result.payment?.url) {
        // Show success message
        const successMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `🎉 Booking created successfully! Your booking number is **${result.booking.bookingNumber}**.\n\nRedirecting you to secure payment in 3 seconds...`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, successMessage]);

        // Store payment URL for safety
        safeSessionStorageSetItem('pending_payment_url', result.payment.url);
        safeSessionStorageSetItem('pending_booking_number', result.booking.bookingNumber);

        // Auto-redirect to payment after 3 seconds
        setTimeout(() => {
          if (typeof window !== 'undefined' && result.payment?.url) {
            window.location.href = result.payment.url;
          }
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to create booking');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, there was an error creating your booking: ${error.message || 'Please try again or call us at 01202 129746.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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

        /* FORCE Speedy AI button to bottom-right */
        .speedy-ai-mobile-button {
          position: fixed;
          bottom: 8px;
          right: 8px;
          left: unset;
          margin: 0;
          padding: 0;
          background: transparent;
        }

        /* iPhone 14/15/16/17 SPECIFIC FIX - Manual Layout Control */
        @media only screen 
          and (device-width: 390px) 
          and (device-height: 844px) 
          and (-webkit-device-pixel-ratio: 3),
        only screen 
          and (device-width: 393px) 
          and (device-height: 852px) 
          and (-webkit-device-pixel-ratio: 3),
        only screen 
          and (device-width: 430px) 
          and (device-height: 932px) 
          and (-webkit-device-pixel-ratio: 3) {
          
          /* Force input container layout */
          .speedy-ai-input-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 16px;
            gap: 12px;
            width: 100%;
            box-sizing: border-box;
            background-color: #ffffff;
          }

          /* Force input field to take proper space */
          .speedy-ai-input-field {
            width: calc(100% - 58px);
            max-width: calc(100% - 58px);
            min-width: 0;
            height: 44px;
            min-height: 44px;
            max-height: 44px;
            flex: none;
            box-sizing: border-box;
            font-size: 16px;
            padding: 0 18px;
            background-color: #fff;
            background: #fff;
            border: 1.5px solid #e5e7eb;
            border-radius: 22px;
            color: #1f2937;
            -webkit-appearance: none;
          }

          .speedy-ai-input-field:focus {
            background-color: #fff;
            background: #fff;
          }

          /* Force send button to be properly sized */
          .speedy-ai-send-button {
            width: 44px;
            height: 44px;
            min-width: 44px;
            min-height: 44px;
            max-width: 44px;
            max-height: 44px;
            flex: none;
            flex-shrink: 0;
            padding: 0;
            margin: 0;
          }
        }

        /* Galaxy S20 Ultra - 412x915 */
        @media only screen 
          and (device-width: 412px) 
          and (device-height: 915px) {
          
          .speedy-ai-input-container {
            background-color: #ffffff;
          }
          
          .speedy-ai-input-field {
            background-color: #fff;
            background: #fff;
            -webkit-appearance: none;
            appearance: none;
          }
          
          .speedy-ai-input-field:focus,
          .speedy-ai-input-field:active {
            background-color: #fff;
            background: #fff;
          }
        }

        /* Additional Safari on iPhone fix */
        @supports (-webkit-touch-callout: none) {
          @media (max-width: 430px) and (max-height: 932px) {
            .speedy-ai-input-container {
              display: flex;
              flex-direction: row;
              align-items: center;
              background-color: #ffffff;
            }
            
            .speedy-ai-input-field {
              flex: 1 1 auto;
              width: auto;
              min-width: 0;
              height: 44px;
              background-color: #fff;
              background: #fff;
              -webkit-appearance: none;
              appearance: none;
            }
            
            .speedy-ai-input-field:focus,
            .speedy-ai-input-field:active {
              background-color: #fff;
              background: #fff;
            }
            
            .speedy-ai-send-button {
              flex: 0 0 44px;
              width: 44px;
              height: 44px;
            }
          }
        }

        /* Universal mobile fix - catch all */
        @media (max-width: 768px) {
          .speedy-ai-input-field {
            background-color: #fff;
            background: #fff;
          }
          
          .speedy-ai-input-field:focus,
          .speedy-ai-input-field:active,
          .speedy-ai-input-field:hover {
            background-color: #fff;
            background: #fff;
          }
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
          className="speedy-ai-mobile-button"
          style={{
            position: 'fixed',
            bottom: '8px',
            right: '8px',
            left: 'unset',
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            border: 'none',
            padding: '0',
            margin: '0',
            overflow: 'hidden',
            cursor: 'pointer',
            zIndex: 9998,
            boxShadow: '0 4px 12px rgba(0, 194, 255, 0.4)',
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
          <video
            autoPlay
            loop
            muted
            playsInline
            webkit-playsinline="true"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              margin: 0,
              padding: 0,
              background: 'transparent',
            }}
          >
            <source src="/logo/AB7D9FB6-5E70-43CC-A81F-A47E875EC79F-video.mp4" type="video/mp4" />
          </video>
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
              background: '#3B82F6',
              backgroundImage: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
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
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.95)',
                  fontWeight: '500',
                }}>
                  Get accurate quotes in 2 minutes
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

          {/* Progress Indicator */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '12px 16px',
            borderBottom: '1px solid #E5E7EB',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#2A3A5E' }}>
                Step {currentStep} of {totalSteps}
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                ~{Math.max(1, totalSteps - currentStep + 1)} min left
              </div>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: '#E5E7EB',
              borderRadius: '10px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#3B82F6',
                borderRadius: '10px',
                width: `${(currentStep / totalSteps) * 100}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Trust Signals */}
          <div style={{
            backgroundColor: '#EFF6FF',
            padding: '10px 16px',
            borderBottom: '1px solid #DBEAFE',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              fontSize: '12px',
              color: '#2A3A5E',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#10B981' }}>✓</span>
                <span style={{ fontWeight: '500' }}>No obligation quote</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>⭐</span>
                <span style={{ fontWeight: '500' }}>4.9/5 (2,400+ reviews)</span>
              </div>
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
                    maxWidth: '85%',
                    padding: '14px 16px',
                    borderRadius: '18px',
                    backgroundColor: message.role === 'user' ? '#3B82F6' : '#0B1020',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 'normal',
                    lineHeight: '1.5',
                    wordWrap: 'break-word',
                    boxShadow: message.role === 'user' 
                      ? '0 1px 3px rgba(0,0,0,0.1)' 
                      : '0 2px 8px rgba(0,0,0,0.3)',
                    border: message.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    borderBottomLeftRadius: message.role === 'assistant' ? '4px' : '18px',
                    borderBottomRightRadius: message.role === 'user' ? '4px' : '18px',
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

            {/* Quick Reply Buttons - Show on first message only */}
            {messages.length === 1 && !isLoading && (
              <div style={{ marginTop: '12px' }}>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: '500',
                  marginBottom: '10px',
                  paddingLeft: '4px',
                }}>
                  Popular UK Cities:
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}>
                  {['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Bristol'].map((city) => (
                    <button
                      key={city}
                      onClick={() => handleSendMessage(city)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '20px',
                        border: '1.5px solid rgba(255,255,255,0.1)',
                        backgroundColor: '#0B1020',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                      onTouchStart={(e) => {
                        e.currentTarget.style.backgroundColor = '#18233A';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.backgroundColor = '#0B1020';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      }}
                    >
                      {city}
                    </button>
                  ))}
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
                onClick={handleProceedToPayment}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isLoading ? '#9CA3AF' : 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? 'Creating booking...' : 'Book Now'}
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

          {/* Input Area - iPhone 14/15/16/17 Manual Fix */}
          <div
            className="speedy-ai-input-container"
            style={{
              padding: '16px',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'row',
              gap: '12px',
              alignItems: 'center',
              boxSizing: 'border-box',
              width: '100%',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your answer here..."
              disabled={isLoading}
              className="speedy-ai-input-field"
              style={{
                flex: '1 1 auto',
                width: 'auto',
                minWidth: '0',
                height: '44px',
                minHeight: '44px',
                maxHeight: '44px',
                padding: '0 18px',
                borderRadius: '22px',
                border: '1.5px solid #e5e7eb',
                fontSize: '16px',
                lineHeight: '44px',
                color: '#1f2937',
                outline: 'none',
                backgroundColor: '#ffffff',
                background: '#ffffff',
                transition: 'all 0.2s ease',
                fontWeight: '400',
                boxSizing: 'border-box',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none',
                WebkitTextFillColor: '#1f2937',
              } as React.CSSProperties}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            {/* Send Button - Manual Size Control */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
              className="speedy-ai-send-button"
              style={{
                flex: '0 0 44px',
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                maxWidth: '44px',
                maxHeight: '44px',
                borderRadius: '50%',
                border: 'none',
                background: inputValue.trim() && !isLoading
                  ? 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)'
                  : '#d1d5db',
                color: '#ffffff',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                boxShadow: inputValue.trim() && !isLoading
                  ? '0 2px 8px rgba(59, 130, 246, 0.3)'
                  : 'none',
                opacity: inputValue.trim() && !isLoading ? 1 : 0.5,
                padding: '0',
                margin: '0',
                boxSizing: 'border-box',
              }}
              onTouchStart={(e) => {
                if (inputValue.trim() && !isLoading) {
                  e.currentTarget.style.transform = 'scale(0.92)';
                }
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isLoading ? (
                <span style={{ fontSize: '16px' }}>⏳</span>
              ) : (
                <span style={{ fontSize: '18px', marginLeft: '2px' }}>➤</span>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

