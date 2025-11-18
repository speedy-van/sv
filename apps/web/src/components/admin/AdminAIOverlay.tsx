'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Input,
  Textarea,
  Badge,
  Avatar,
  Divider,
  Select,
  useToast,
  Tag,
  TagLabel,
  TagLeftIcon,
  Tooltip,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Stack,
} from '@chakra-ui/react';
import { 
  FiX, 
  FiSend, 
  FiPlus, 
  FiZap, 
  FiDownload, 
  FiBarChart2, 
  FiClock, 
  FiRefreshCw, 
  FiMic, 
  FiMicOff,
  FiVolume2,
  FiVolumeX,
  FiSettings,
  FiImage,
  FiMaximize2,
  FiDownloadCloud,
  FiCopy,
  FiCheck,
} from 'react-icons/fi';

type Lang = 'en' | 'ar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: Date;
  audioUrl?: string; // For voice messages
  isTranscribed?: boolean; // Was this transcribed from audio?
  imageUrl?: string; // For generated images
  imageMetadata?: {
    prompt: string;
    revisedPrompt?: string;
    model: string;
    size: string;
    quality: string;
  };
}

interface AssistantMetadata {
  requestId: string;
  processingTimeMs?: number;
  references?: { orders: string[]; routes: string[] };
  liveStats?: any;
  driverAvailability?: any;
  predictiveAnalytics?: any;
  proactiveSuggestions?: { suggestions: string[]; isClear?: boolean };
}

export default function AdminAIOverlay({
  adminName = 'Admin',
  adminEmail = '',
}: {
  adminName?: string;
  adminEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [metadata, setMetadata] = useState<AssistantMetadata | null>(null);
  const [liveLane, setLiveLane] = useState<Array<{ id: string; title: string; createdAt: string }>>([]);
  const [history, setHistory] = useState<Array<{ id: string; title: string; createdAt: string }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [ttsVoice, setTtsVoice] = useState<'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'>('nova'); // Default female
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioRefs, setAudioRefs] = useState<Map<string, HTMLAudioElement>>(new Map());
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // Image generation states
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [imageModel, setImageModel] = useState<'dall-e-3' | 'dall-e-2'>('dall-e-3');
  const [imageSize, setImageSize] = useState<string>('1024x1024');
  const [imageQuality, setImageQuality] = useState<'standard' | 'hd'>('standard');
  const [imageSafetyMode, setImageSafetyMode] = useState<'strict' | 'moderate' | 'permissive'>('strict');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  
  const endRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener('sv-ai-open', onOpen as EventListener);
    window.addEventListener('sv-ai-close', onClose as EventListener);
    return () => {
      window.removeEventListener('sv-ai-open', onOpen as EventListener);
      window.removeEventListener('sv-ai-close', onClose as EventListener);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Live lane polling
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/admin/ai/notifications');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          const items = Array.isArray(data.items)
            ? data.items.map((x: any) => ({
                id: String(x.id || x._id || x.createdAt || Math.random()),
                title: x.title || x.message || x.text || 'Notification',
                createdAt: x.createdAt || new Date().toISOString(),
              }))
            : [];
          setLiveLane(items.slice(0, 20));
        }
      } catch {
        // ignore
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const placeholder = useMemo(
    () => (lang === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'),
    [lang]
  );

  const newConversation = () => {
    setMessages([]);
    setMetadata(null);
    setInput('');
  };

  const exportTxt = () => {
    const txt = messages
      .map((m) => `[${m.ts.toLocaleString()}] ${m.role === 'user' ? adminName : 'Speedy AI'}:\n${m.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speedy-ai-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Image Generation Function
  const generateImage = async (prompt: string) => {
    if (generatingImage || !prompt.trim()) return;
    
    setGeneratingImage(true);
    
    // Add user message
    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      content: `🎨 ${prompt}`,
      ts: new Date(),
    };
    
    // Add placeholder for image
    const imageId = String(Date.now() + 1);
    const imageMsg: Message = {
      id: imageId,
      role: 'assistant',
      content: lang === 'ar' ? 'جاري إنشاء الصورة...' : 'Generating image...',
      ts: new Date(),
    };
    
    setMessages((prev) => [...prev, userMsg, imageMsg]);
    
    try {
      toast({
        title: lang === 'ar' ? 'جاري إنشاء الصورة...' : 'Generating image...',
        description: lang === 'ar' ? 'قد يستغرق هذا 10-30 ثانية' : 'This may take 10-30 seconds',
        status: 'info',
        duration: 3000,
      });
      
      const res = await fetch('/api/admin/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: imageModel,
          size: imageSize,
          quality: imageQuality,
          safetyMode: imageSafetyMode,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Image generation failed');
      }
      
      const data = await res.json();
      
      // Update message with generated image
      setMessages((prev) =>
        prev.map((m) =>
          m.id === imageId
            ? {
                ...m,
                content: data.revisedPrompt || prompt,
                imageUrl: data.publicUrl,
                imageMetadata: {
                  prompt,
                  revisedPrompt: data.revisedPrompt,
                  model: data.model,
                  size: data.size,
                  quality: data.quality,
                },
              }
            : m
        )
      );
      
      toast({
        title: lang === 'ar' ? 'تم إنشاء الصورة' : 'Image generated',
        description: lang === 'ar' ? 'انقر على الصورة لعرضها بالحجم الكامل' : 'Click image to view full size',
        status: 'success',
        duration: 3000,
      });
      
    } catch (error: any) {
      console.error('Image generation error:', error);
      
      setMessages((prev) =>
        prev.map((m) =>
          m.id === imageId
            ? {
                ...m,
                content: `❌ ${error.message || (lang === 'ar' ? 'فشل إنشاء الصورة' : 'Image generation failed')}`,
              }
            : m
        )
      );
      
      toast({
        title: lang === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (lang === 'ar' ? 'فشل إنشاء الصورة' : 'Image generation failed'),
        status: 'error',
        duration: 5000,
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const send = async () => {
    if (loading || !input.trim()) return;
    const content = input.trim();
    setInput('');
    
    // Detect image generation commands
    const imageKeywords = [
      'generate image', 'create image', 'draw', 'picture of', 'image of',
      'generate a picture', 'create a picture', 'make an image', 'make a picture',
      'أنشئ صورة', 'ارسم', 'صورة ل', 'اصنع صورة'
    ];
    
    const isImageRequest = imageKeywords.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (isImageRequest) {
      // Extract prompt (remove command keywords)
      let imagePrompt = content;
      imageKeywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        imagePrompt = imagePrompt.replace(regex, '').trim();
      });
      
      // Clean up common artifacts
      imagePrompt = imagePrompt.replace(/^(of|for|:|-)\s*/i, '').trim();
      
      if (imagePrompt.length < 10) {
        toast({
          title: lang === 'ar' ? 'وصف قصير جداً' : 'Prompt too short',
          description: lang === 'ar' ? 'يرجى تقديم وصف أطول للصورة' : 'Please provide a longer description',
          status: 'warning',
          duration: 3000,
        });
        return;
      }
      
      await generateImage(imagePrompt);
      return;
    }

    const userMsg: Message = { id: String(Date.now()), role: 'user', content, ts: new Date() };
    const streamId = String(Date.now() + 1);
    const aiMsg: Message = { id: streamId, role: 'assistant', content: '', ts: new Date() };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setLoading(true);
    setMetadata(null);

    try {
      const res = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationHistory: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
            message: m.content,
          })),
          language: lang,
          mode: 'stream',
        }),
      });
      if (!res.ok || !res.body) throw new Error('Chat API error');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let aggregate = '';
      let meta: AssistantMetadata | null = null;
      let finalLang: Lang = lang;

      const apply = (content: string) => {
        setMessages((prev) => prev.map((m) => (m.id === streamId ? { ...m, content } : m)));
      };

      const handleLine = (line: string) => {
        try {
          const payload = JSON.parse(line);
          if (payload.event === 'token') {
            const token = typeof payload.data === 'string' ? payload.data : '';
            aggregate += token;
            apply(aggregate);
          } else if (payload.event === 'final') {
            const data = payload.data || {};
            if (typeof data.response === 'string') {
              aggregate = data.response;
              apply(aggregate);
            }
            if (data.language === 'en' || data.language === 'ar') {
              finalLang = data.language;
              setLang(finalLang);
            }
            if (data.metadata) {
              meta = {
                ...(data.metadata as AssistantMetadata),
                processingTimeMs:
                  typeof data.processingTimeMs === 'number'
                    ? data.processingTimeMs
                    : undefined,
              };
            }
          }
        } catch {
          // ignore malformed lines
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (line) handleLine(line);
        }
      }
      if (buffer.trim()) handleLine(buffer.trim());
      if (!aggregate) {
        const fallback = finalLang === 'ar' ? 'تمت المعالجة.' : 'Processed.';
        apply(fallback);
      }
      if (meta) setMetadata(meta);
    } catch (e: any) {
      const err = lang === 'ar' ? 'حدث خطأ. حاول لاحقاً.' : 'An error occurred. Please try again.';
      setMessages((prev) => prev.map((m) => (m.id === streamId ? { ...m, content: err } : m)));
      toast({ title: 'Error', description: e?.message || err, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Voice recording with full transcription
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: lang === 'ar' ? 'غير مدعوم' : 'Not supported',
          description: lang === 'ar' ? 'المتصفح لا يدعم التسجيل الصوتي' : 'Browser does not support audio recording',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // Upload and transcribe immediately
        toast({
          title: lang === 'ar' ? 'جاري المعالجة...' : 'Processing...',
          description: lang === 'ar' ? 'جاري تحويل الصوت إلى نص...' : 'Transcribing audio to text...',
          status: 'info',
          duration: 2000,
        });

        try {
          // Upload audio
          const uploadFormData = new FormData();
          uploadFormData.append('audio', blob, 'voice.webm');
          
          const uploadRes = await fetch('/api/admin/voice/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          if (!uploadRes.ok) throw new Error('Upload failed');
          const { url: audioUrl } = await uploadRes.json();

          // Transcribe audio
          const transcribeFormData = new FormData();
          transcribeFormData.append('audio', blob, 'voice.webm');

          const transcribeRes = await fetch('/api/admin/voice/transcribe', {
            method: 'POST',
            body: transcribeFormData,
          });

          if (!transcribeRes.ok) throw new Error('Transcription failed');
          const { text } = await transcribeRes.json();

          // Set transcribed text as input
          setInput(text);

          // Add user message with audio
          const userMsg: Message = {
            id: String(Date.now()),
            role: 'user',
            content: text,
            ts: new Date(),
            audioUrl,
            isTranscribed: true,
          };

          setMessages((prev) => [...prev, userMsg]);
          
          // Auto-send to AI
          setTimeout(() => sendTranscribedMessage(text, userMsg), 100);

          toast({
            title: lang === 'ar' ? 'تم التحويل' : 'Transcription complete',
            description: lang === 'ar' ? 'تم إرسال الرسالة إلى SpeedyAI' : 'Message sent to SpeedyAI',
            status: 'success',
            duration: 2000,
          });
        } catch (error: any) {
          console.error('Voice processing error:', error);
          toast({
            title: lang === 'ar' ? 'خطأ' : 'Error',
            description: error?.message || (lang === 'ar' ? 'فشل معالجة الصوت' : 'Voice processing failed'),
            status: 'error',
            duration: 3000,
          });
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      toast({
        title: lang === 'ar' ? 'جاري التسجيل...' : 'Recording...',
        status: 'info',
        duration: 1000,
      });
    } catch (error: any) {
      console.error('Microphone error:', error);
      const errorMessage = error?.name === 'NotAllowedError' 
        ? (lang === 'ar' ? 'لم يتم السماح بالوصول للميكروفون' : 'Microphone access denied')
        : (lang === 'ar' ? 'خطأ في الوصول للميكروفون' : 'Microphone access error');
      
      toast({
        title: lang === 'ar' ? 'خطأ' : 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  // Send transcribed message to AI
  const sendTranscribedMessage = async (content: string, userMsg: Message) => {
    const streamId = String(Date.now() + 1);
    const aiMsg: Message = { id: streamId, role: 'assistant', content: '', ts: new Date() };
    setMessages((prev) => [...prev, aiMsg]);
    setLoading(true);
    setMetadata(null);

    try {
      const res = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationHistory: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          language: lang,
          mode: 'stream',
        }),
      });

      if (!res.ok || !res.body) throw new Error('Chat API error');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let aggregate = '';

      const apply = (content: string) => {
        setMessages((prev) => prev.map((m) => (m.id === streamId ? { ...m, content } : m)));
      };

      const handleLine = (line: string) => {
        try {
          const payload = JSON.parse(line);
          if (payload.event === 'token') {
            aggregate += typeof payload.data === 'string' ? payload.data : '';
            apply(aggregate);
          } else if (payload.event === 'final') {
            const data = payload.data || {};
            if (typeof data.response === 'string') {
              aggregate = data.response;
              apply(aggregate);
            }
          }
        } catch {}
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (line) handleLine(line);
        }
      }
      if (buffer.trim()) handleLine(buffer.trim());
      if (!aggregate) apply(lang === 'ar' ? 'تمت المعالجة.' : 'Processed.');
    } catch (e: any) {
      const err = lang === 'ar' ? 'حدث خطأ' : 'An error occurred';
      setMessages((prev) => prev.map((m) => (m.id === streamId ? { ...m, content: err } : m)));
    } finally {
      setLoading(false);
    }
  };

  // Text-to-Speech for AI messages
  const playTTS = async (messageId: string, text: string) => {
    try {
      // Stop any currently playing audio
      if (playingAudio) {
        const currentAudio = audioRefs.get(playingAudio);
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        setPlayingAudio(null);
      }

      setPlayingAudio(messageId);

      toast({
        title: lang === 'ar' ? 'جاري التحويل...' : 'Converting...',
        description: lang === 'ar' ? 'جاري تحويل النص إلى صوت...' : 'Converting text to speech...',
        status: 'info',
        duration: 1000,
      });

      const res = await fetch('/api/admin/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: ttsVoice }),
      });

      // Check if response is audio or JSON (fallback instruction)
      const contentType = res.headers.get('content-type');
      
      // If service unavailable (503) or JSON response, use browser TTS
      if (!res.ok || contentType?.includes('application/json')) {
        try {
          const data = await res.json();
          if (data.fallback === 'browser-tts' || res.status === 503) {
            useBrowserTTS(messageId, text);
            return;
          }
        } catch {
          // If parsing fails, fallback to browser TTS anyway
          useBrowserTTS(messageId, text);
          return;
        }
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setPlayingAudio(null);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setPlayingAudio(null);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: lang === 'ar' ? 'خطأ' : 'Error',
          description: lang === 'ar' ? 'فشل تشغيل الصوت' : 'Audio playback failed',
          status: 'error',
          duration: 2000,
        });
      };

      audioRefs.set(messageId, audio);
      await audio.play();

    } catch (error: any) {
      console.error('TTS error (using browser fallback):', error);
      setPlayingAudio(null);
      
      // Always try browser TTS as fallback
      if ('speechSynthesis' in window) {
        useBrowserTTS(messageId, text);
      } else {
        toast({
          title: lang === 'ar' ? 'خطأ' : 'Error',
          description: lang === 'ar' ? 'المتصفح لا يدعم قراءة النصوص' : 'Browser does not support speech',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  // Browser TTS fallback (free, works offline)
  const useBrowserTTS = (messageId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      setPlayingAudio(null);
      toast({
        title: lang === 'ar' ? 'غير مدعوم' : 'Not supported',
        description: lang === 'ar' ? 'المتصفح لا يدعم قراءة النصوص' : 'Browser does not support speech synthesis',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    // Load voices if not loaded yet
    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Wait for voices to load
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        voices = window.speechSynthesis.getVoices();
      });
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try to match voice gender
    const preferredVoice = voices.find(v => {
      const isCorrectLang = lang === 'ar' ? v.lang.startsWith('ar') : v.lang.startsWith('en');
      const matchesGender = ttsVoice === 'nova' 
        ? v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha')
        : v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('alex');
      return isCorrectLang && matchesGender;
    });

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => setPlayingAudio(null);
    utterance.onerror = (e) => {
      console.error('Browser TTS error:', e);
      setPlayingAudio(null);
      toast({
        title: lang === 'ar' ? 'خطأ' : 'Error',
        description: lang === 'ar' ? 'فشلت القراءة' : 'Speech failed',
        status: 'error',
        duration: 2000,
      });
    };

    window.speechSynthesis.cancel(); // Stop any ongoing speech
    window.speechSynthesis.speak(utterance);
    setPlayingAudio(messageId);
  };

  const stopTTS = (messageId: string) => {
    const audio = audioRefs.get(messageId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    
    // Stop browser TTS if active
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    setPlayingAudio(null);
  };

  // Play recorded audio
  const playRecordedAudio = (audioUrl: string, messageId: string) => {
    if (playingAudio === messageId) {
      stopTTS(messageId);
      return;
    }

    // Stop any currently playing
    if (playingAudio) {
      stopTTS(playingAudio);
    }

    const audio = new Audio(audioUrl);
    audio.onended = () => setPlayingAudio(null);
    audio.onerror = () => {
      setPlayingAudio(null);
      toast({
        title: lang === 'ar' ? 'خطأ' : 'Error',
        description: lang === 'ar' ? 'فشل تشغيل التسجيل' : 'Audio playback failed',
        status: 'error',
        duration: 2000,
      });
    };

    audioRefs.set(messageId, audio);
    setPlayingAudio(messageId);
    audio.play();
  };

  // Toggle voice gender
  const toggleVoiceGender = () => {
    const newVoice = ttsVoice === 'nova' ? 'onyx' : 'nova';
    setTtsVoice(newVoice);
    toast({
      title: lang === 'ar' ? 'تم التغيير' : 'Voice changed',
      description: newVoice === 'nova' 
        ? (lang === 'ar' ? 'صوت أنثوي' : 'Female voice')
        : (lang === 'ar' ? 'صوت ذكري' : 'Male voice'),
      status: 'success',
      duration: 1500,
    });
  };

  if (!open) return null;

  return (
    <Box 
      position="fixed" 
      top="0" 
      left="0" 
      right="0" 
      bottom="80px" 
      zIndex={1000} 
      bg="#0b0e14"
    >
      {/* Header Bar */}
      <HStack justify="space-between" px={5} py={3} borderBottom="1px solid #232735" bg="#0b0e14">
        <HStack spacing={3}>
          {/* Video Avatar */}
          <Box
            as="video"
            autoPlay
            loop
            muted
            playsInline
            w="40px"
            h="40px"
            borderRadius="full"
            overflow="hidden"
            border="2px solid #2563eb"
            boxShadow="0 0 10px rgba(37, 99, 235, 0.5)"
            objectFit="cover"
            src="/speedy-ai-header.mp4"
          />
          <VStack align="start" spacing={0}>
            <HStack>
              <Text color="#ECECF1" fontWeight="bold">Speedy AI</Text>
              <Badge colorScheme="green" borderRadius="full">{lang === 'ar' ? 'متصل' : 'Online'}</Badge>
            </HStack>
            <Text color="#9aa0b4" fontSize="xs">{lang === 'ar' ? 'مساعدك الذكي' : 'Your AI assistant'}</Text>
          </VStack>
        </HStack>
        <HStack>
          <Tooltip label={ttsVoice === 'nova' ? (lang === 'ar' ? 'صوت أنثوي' : 'Female voice') : (lang === 'ar' ? 'صوت ذكري' : 'Male voice')}>
            <Button
              size="sm"
              variant="ghost"
              color="#ECECF1"
              onClick={toggleVoiceGender}
              leftIcon={ttsVoice === 'nova' ? <Text>♀</Text> : <Text>♂</Text>}
              _hover={{ bg: 'rgba(16, 185, 129, 0.1)' }}
            >
              {ttsVoice === 'nova' ? (lang === 'ar' ? 'أنثى' : 'Female') : (lang === 'ar' ? 'ذكر' : 'Male')}
            </Button>
          </Tooltip>
          <Tooltip label={lang === 'ar' ? 'لغة' : 'Language'}>
            <Select
              size="sm"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              width="80px"
              bg="#0f1420"
              color="#ECECF1"
              borderColor="#2a2f3a"
            >
              <option value="en" style={{ background: '#0b0e14', color: '#fff' }}>EN</option>
              <option value="ar" style={{ background: '#0b0e14', color: '#fff' }}>AR</option>
            </Select>
          </Tooltip>
          <Tooltip label={lang === 'ar' ? 'إعدادات الصور' : 'Image Settings'}>
            <IconButton 
              aria-label="AI Settings" 
              icon={<FiImage />} 
              size="sm" 
              variant="ghost" 
              color="#ECECF1" 
              onClick={() => setAiSettingsOpen(true)}
              _hover={{ bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
            />
          </Tooltip>
          <Tooltip label={lang === 'ar' ? 'تصدير' : 'Export'}>
            <IconButton aria-label="Export" icon={<FiDownload />} size="sm" variant="ghost" color="#ECECF1" onClick={exportTxt} isDisabled={messages.length === 0} />
          </Tooltip>
          <Tooltip label={lang === 'ar' ? 'تحديث' : 'Refresh'}>
            <IconButton aria-label="Refresh" icon={<FiRefreshCw />} size="sm" variant="ghost" color="#ECECF1" onClick={() => window.location.reload()} />
          </Tooltip>
          <IconButton aria-label="Close" icon={<FiX />} size="sm" variant="ghost" color="#ECECF1" onClick={() => setOpen(false)} />
        </HStack>
      </HStack>

      {/* Enterprise Grid */}
      <Grid templateColumns={{ base: '1fr', lg: '280px 1fr 360px' }} templateRows={{ base: '1fr auto', lg: '1fr auto' }} gap={0} h="calc(100vh - 56px)">
        {/* Sidebar - History */}
        <GridItem display={{ base: 'none', lg: 'block' }} borderRight="1px solid #232735" bg="#0b0e14">
          <VStack align="stretch" spacing={3} p={4}>
            <Button leftIcon={<FiPlus />} size="sm" colorScheme="blue" onClick={newConversation}>
              {lang === 'ar' ? 'محادثة جديدة' : 'New chat'}
            </Button>
            <Divider borderColor="#232735" />
            <VStack align="stretch" spacing={2} maxH="calc(100vh - 140px)" overflowY="auto">
              {history.length === 0 ? (
                <Text fontSize="sm" color="#9aa0b4">{lang === 'ar' ? 'لا يوجد محفوظات.' : 'No history yet.'}</Text>
              ) : (
                history.map((h) => (
                  <HStack key={h.id} justify="space-between" p={2} border="1px solid #232735" borderRadius="md" bg="#0f1420" _hover={{ bg: '#111625' }}>
                    <Text color="#ECECF1" fontSize="sm" noOfLines={1}>{h.title}</Text>
                    <Text color="#9aa0b4" fontSize="xs">{new Date(h.createdAt).toLocaleDateString()}</Text>
                  </HStack>
                ))
              )}
            </VStack>
          </VStack>
        </GridItem>

        {/* Chat - Center */}
        <GridItem bg="#0b0e14" borderRight={{ base: 'none', lg: '1px solid #232735' }}>
          <VStack align="stretch" spacing={0} h="100%">
            <Box flex={1} overflowY="auto" p={{ base: 3, md: 5 }}>
              <VStack align="stretch" spacing={4}>
                {messages.map((m) => (
                  <HStack key={m.id} justify={m.role === 'user' ? 'flex-end' : 'flex-start'} align="flex-start">
                    {m.role === 'assistant' && <Avatar size="sm" bg="#2563eb" icon={<FiZap />} />}
                    <VStack align={m.role === 'user' ? 'flex-end' : 'flex-start'} spacing={1}>
                      <Box
                        maxW="80%"
                        bg={m.role === 'user' ? '#111625' : '#0f1420'}
                        border="1px solid #232735"
                        borderRadius="lg"
                        px={4}
                        py={3}
                      >
                        {/* Generated Image Display */}
                        {m.imageUrl && (
                          <Box
                            position="relative"
                            mb={2}
                            borderRadius="md"
                            overflow="hidden"
                            cursor="pointer"
                            onClick={() => {
                              setSelectedImage(m.imageUrl!);
                              setImageModalOpen(true);
                            }}
                            _hover={{
                              transform: 'scale(1.02)',
                              transition: 'transform 0.2s',
                            }}
                          >
                            {generatingImage && m.content.includes('جاري إنشاء') || m.content.includes('Generating') ? (
                              <Box
                                w="300px"
                                h="300px"
                                bg="linear-gradient(90deg, #1a1d29 0%, #232735 50%, #1a1d29 100%)"
                                backgroundSize="200% 100%"
                                animation="shimmer 1.5s infinite"
                                sx={{
                                  '@keyframes shimmer': {
                                    '0%': { backgroundPosition: '200% 0' },
                                    '100%': { backgroundPosition: '-200% 0' },
                                  },
                                }}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <VStack spacing={2}>
                                  <Progress size="xs" colorScheme="blue" isIndeterminate w="200px" />
                                  <Text color="#9aa0b4" fontSize="xs">
                                    {lang === 'ar' ? 'جاري إنشاء الصورة...' : 'Generating image...'}
                                  </Text>
                                </VStack>
                              </Box>
                            ) : (
                              <Box
                                as="img"
                                src={m.imageUrl}
                                alt={m.imageMetadata?.prompt || 'Generated image'}
                                maxW="400px"
                                maxH="400px"
                                objectFit="contain"
                                borderRadius="md"
                                border="2px solid transparent"
                                _hover={{ borderColor: '#10b981' }}
                                transition="all 0.2s"
                              />
                            )}
                            {m.imageMetadata && (
                              <HStack
                                position="absolute"
                                bottom="8px"
                                right="8px"
                                bg="rgba(0,0,0,0.7)"
                                px={2}
                                py={1}
                                borderRadius="md"
                                spacing={1}
                              >
                                <Badge colorScheme="blue" fontSize="9px">{m.imageMetadata.model}</Badge>
                                <Badge colorScheme="green" fontSize="9px">{m.imageMetadata.size}</Badge>
                                {m.imageMetadata.quality === 'hd' && (
                                  <Badge colorScheme="purple" fontSize="9px">HD</Badge>
                                )}
                              </HStack>
                            )}
                          </Box>
                        )}
                        
                        <Text color="#ECECF1" fontSize="sm" whiteSpace="pre-wrap">{m.content}</Text>
                        <HStack justify="space-between" mt={1}>
                          <HStack spacing={2}>
                            <Text color="#9aa0b4" fontSize="xs">
                              {m.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            {m.isTranscribed && (
                              <Badge colorScheme="purple" fontSize="9px" px={2}>
                                {lang === 'ar' ? 'صوتي' : 'Voice'}
                              </Badge>
                            )}
                          </HStack>
                          <HStack spacing={1}>
                            {/* Copy message */}
                            {m.role === 'assistant' && m.content && (
                              <Tooltip label={copiedMessageId === m.id ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ الرد' : 'Copy answer')}>
                                <IconButton
                                  aria-label="Copy message"
                                  icon={copiedMessageId === m.id ? <FiCheck /> : <FiCopy />}
                                  size="xs"
                                  variant="ghost"
                                  color={copiedMessageId === m.id ? '#10b981' : '#6B7280'}
                                  _hover={{ color: '#10b981' }}
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(m.content);
                                      setCopiedMessageId(m.id);
                                      setTimeout(() => setCopiedMessageId(null), 2000);
                                      toast({
                                        title: lang === 'ar' ? 'تم النسخ' : 'Copied',
                                        description: lang === 'ar' ? 'تم نسخ الرد إلى الحافظة' : 'Answer copied to clipboard',
                                        status: 'success',
                                        duration: 2000,
                                      });
                                    } catch (err) {
                                      toast({
                                        title: lang === 'ar' ? 'خطأ' : 'Error',
                                        description: lang === 'ar' ? 'فشل النسخ' : 'Failed to copy',
                                        status: 'error',
                                        duration: 2000,
                                      });
                                    }
                                  }}
                                />
                              </Tooltip>
                            )}
                            {/* Play recorded audio if available */}
                            {m.audioUrl && (
                              <Tooltip label={playingAudio === m.id ? (lang === 'ar' ? 'إيقاف' : 'Stop') : (lang === 'ar' ? 'تشغيل التسجيل' : 'Play recording')}>
                                <IconButton
                                  aria-label="Play audio"
                                  icon={playingAudio === m.id ? <FiMicOff /> : <FiMic />}
                                  size="xs"
                                  variant="ghost"
                                  color={playingAudio === m.id ? '#10b981' : '#6B7280'}
                                  _hover={{ color: '#10b981' }}
                                  onClick={() => playRecordedAudio(m.audioUrl!, m.id)}
                                />
                              </Tooltip>
                            )}
                            {/* TTS for AI messages */}
                            {m.role === 'assistant' && m.content && (
                              <Tooltip label={playingAudio === m.id ? (lang === 'ar' ? 'إيقاف القراءة' : 'Stop reading') : (lang === 'ar' ? 'قراءة الرسالة' : 'Read message')}>
                                <IconButton
                                  aria-label="Text to speech"
                                  icon={playingAudio === m.id ? <FiMicOff /> : <FiZap />}
                                  size="xs"
                                  variant="ghost"
                                  color={playingAudio === m.id ? '#10b981' : '#6B7280'}
                                  _hover={{ color: '#10b981' }}
                                  onClick={() => playingAudio === m.id ? stopTTS(m.id) : playTTS(m.id, m.content)}
                                  isLoading={playingAudio === m.id}
                                />
                              </Tooltip>
                            )}
                          </HStack>
                        </HStack>
                      </Box>
                    </VStack>
                    {m.role === 'user' && <Avatar size="sm" bg="#4b5563" />}
                  </HStack>
                ))}
                {loading && (
                  <HStack spacing={3} align="center">
                    <Box
                      as="img"
                      src="/ai-typing-avatar.svg"
                      w="32px"
                      h="32px"
                      borderRadius="full"
                      animation="pulse 1.5s ease-in-out infinite"
                      sx={{
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                          '50%': { opacity: 0.7, transform: 'scale(0.95)' },
                        },
                      }}
                    />
                    <VStack align="flex-start" spacing={1}>
                      <Progress size="xs" colorScheme="blue" isIndeterminate w="160px" />
                      <Text color="#9aa0b4" fontSize="xs">{lang === 'ar' ? 'جاري الكتابة...' : 'Typing...'}</Text>
                    </VStack>
                  </HStack>
                )}
                <div ref={endRef} />
              </VStack>
            </Box>

            {/* Input */}
            <Box borderTop="1px solid #232735" p={3} bg="#0f1420">
              <Box
                bg="#1a1d29"
                border="1px solid #232735"
                borderRadius="lg"
                p={2}
                _focusWithin={{
                  borderColor: '#10b981',
                  boxShadow: '0 0 0 1px #10b981',
                }}
                transition="all 0.2s"
              >
                <HStack align="flex-end" spacing={2}>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={placeholder}
                    rows={3}
                    resize="none"
                    bg="#1a1d29 !important"
                    color="#FFFFFF !important"
                    border="none"
                    _placeholder={{ color: '#6B7280' }}
                    _focus={{ 
                      bg: '#1a1d29 !important',
                      boxShadow: 'none',
                      color: '#FFFFFF !important',
                      outline: 'none'
                    }}
                    _active={{
                      bg: '#1a1d29 !important',
                      color: '#FFFFFF !important'
                    }}
                    _hover={{
                      bg: '#1a1d29 !important'
                    }}
                    fontSize="sm"
                    sx={{
                      caretColor: '#10b981',
                      '&:focus': {
                        bg: '#1a1d29 !important',
                        color: '#FFFFFF !important'
                      },
                      '&:active': {
                        bg: '#1a1d29 !important',
                        color: '#FFFFFF !important'
                      },
                      '&::selection': {
                        bg: 'rgba(16, 185, 129, 0.3)',
                        color: '#FFFFFF'
                      }
                    }}
                  />
                  <VStack spacing={2} flexShrink={0}>
                    <Tooltip label={isRecording ? (lang === 'ar' ? 'إيقاف التسجيل' : 'Stop recording') : (lang === 'ar' ? 'تسجيل صوتي' : 'Voice message')}>
                      <IconButton
                        aria-label="Voice message"
                        icon={isRecording ? <FiMicOff /> : <FiMic />}
                        size="md"
                        bg={isRecording ? '#ef4444' : 'transparent'}
                        color={isRecording ? 'white' : '#6B7280'}
                        onClick={isRecording ? stopRecording : startRecording}
                        _hover={{
                          bg: isRecording ? '#dc2626' : 'rgba(255,255,255,0.05)',
                          color: isRecording ? 'white' : '#10b981',
                        }}
                        borderRadius="md"
                        transition="all 0.2s"
                        animation={isRecording ? 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'}
                      />
                    </Tooltip>
                    <IconButton
                      aria-label="Send"
                      icon={<FiSend />}
                      size="md"
                      bg={input.trim() && !loading ? '#10b981' : 'transparent'}
                      color={input.trim() && !loading ? 'white' : '#6B7280'}
                      onClick={send}
                      isDisabled={!input.trim() || loading}
                      _hover={{
                        bg: input.trim() && !loading ? '#059669' : 'rgba(255,255,255,0.05)',
                      }}
                      borderRadius="md"
                      transition="all 0.2s"
                    />
                  </VStack>
                </HStack>
              </Box>
            </Box>
          </VStack>
        </GridItem>

        {/* Insights - Right */}
        <GridItem display={{ base: 'none', lg: 'block' }} bg="#0b0e14">
          <VStack align="stretch" spacing={4} p={4} h="100%" overflowY="auto">
            <HStack>
              <FiBarChart2 color="#9aa0b4" />
              <Text color="#ECECF1" fontWeight="bold">{lang === 'ar' ? 'الرؤى' : 'Insights'}</Text>
            </HStack>
            <Divider borderColor="#232735" />
            {!metadata ? (
              <Text color="#9aa0b4" fontSize="sm">
                {lang === 'ar' ? 'اطلب نظرة عامة للحصول على رؤى فورية.' : 'Ask for an overview to get real-time insights.'}
              </Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                <HStack>
                  <Badge colorScheme="purple">#{metadata.requestId?.slice(0, 8)}</Badge>
                  {typeof metadata.processingTimeMs === 'number' && (
                    <Badge colorScheme="green">{metadata.processingTimeMs}ms</Badge>
                  )}
                </HStack>
                {metadata.references && (metadata.references.orders?.length || metadata.references.routes?.length) ? (
                  <Box border="1px solid #232735" borderRadius="md" p={3} bg="#0f1420">
                    <Text color="#9aa0b4" fontSize="xs" mb={2}>{lang === 'ar' ? 'مراجع' : 'References'}</Text>
                    <HStack spacing={2} wrap="wrap">
                      {metadata.references.orders?.map((o: string) => (
                        <Tag key={`o-${o}`} size="sm" colorScheme="blue"><TagLabel>{lang === 'ar' ? `طلب ${o}` : `Order ${o}`}</TagLabel></Tag>
                      ))}
                      {metadata.references.routes?.map((r: string) => (
                        <Tag key={`r-${r}`} size="sm" colorScheme="purple"><TagLabel>{lang === 'ar' ? `مسار ${r}` : `Route ${r}`}</TagLabel></Tag>
                      ))}
                    </HStack>
                  </Box>
                ) : null}
                {metadata.proactiveSuggestions?.suggestions?.length ? (
                  <Box border="1px solid #232735" borderRadius="md" p={3} bg="#0f1420">
                    <Text color="#9aa0b4" fontSize="xs" mb={2}>{lang === 'ar' ? 'اقتراحات' : 'Suggestions'}</Text>
                    <VStack align="stretch" spacing={1}>
                      {metadata.proactiveSuggestions.suggestions.map((s, i) => (
                        <Text key={i} color="#ECECF1" fontSize="sm">• {s}</Text>
                      ))}
                    </VStack>
                  </Box>
                ) : null}
              </VStack>
            )}

            <Divider borderColor="#232735" />
            <Box position="relative" py={2}>
              <HStack spacing={3} position="relative">
                <Text 
                  color="#10b981" 
                  fontWeight="bold" 
                  fontSize="xs"
                  letterSpacing="wider"
                  animation={loading ? 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'}
                >
                  LIVE
                </Text>
                <Box flex="1" position="relative" h="2px">
                  <Box
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    h="2px"
                    bg="#1a1d29"
                  />
                  <Box
                    position="absolute"
                    top="0"
                    left="0"
                    h="2px"
                    bg="linear-gradient(90deg, #10b981 0%, #059669 100%)"
                    animation="slideRight 2s ease-in-out infinite"
                    sx={{
                      '@keyframes slideRight': {
                        '0%': { width: '0%' },
                        '50%': { width: '100%' },
                        '100%': { width: '0%' },
                      },
                    }}
                  />
                </Box>
                <Badge 
                  colorScheme="green" 
                  fontSize="9px" 
                  borderRadius="full"
                  px={2}
                  bg="rgba(16, 185, 129, 0.15)"
                  color="#10b981"
                >
                  {liveLane.length}
                </Badge>
              </HStack>
            </Box>
            <VStack 
              align="stretch" 
              spacing={2} 
              maxH="400px" 
              overflowY="auto"
              css={{
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { background: '#0b0e14' },
                '&::-webkit-scrollbar-thumb': {
                  background: '#232735',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': { background: '#2d3548' },
              }}
            >
              {liveLane.length === 0 ? (
                <Box 
                  textAlign="center" 
                  py={8}
                  color="#6B7280"
                >
                  <FiClock size={32} style={{ margin: '0 auto 12px' }} />
                  <Text fontSize="sm">
                    {lang === 'ar' ? 'لا توجد إشعارات جديدة' : 'No new notifications'}
                  </Text>
                </Box>
              ) : (
                liveLane.map((it, index) => (
                  <Box
                    key={it.id}
                    p={3}
                    border="1px solid"
                    borderColor={index === 0 ? '#10b981' : '#232735'}
                    borderRadius="lg"
                    bg={index === 0 ? 'rgba(16, 185, 129, 0.05)' : '#0f1420'}
                    _hover={{ 
                      borderColor: '#10b981',
                      bg: 'rgba(16, 185, 129, 0.08)',
                      transform: 'translateX(-2px)',
                    }}
                    transition="all 0.2s"
                    cursor="pointer"
                    position="relative"
                  >
                    {index === 0 && (
                      <Box
                        position="absolute"
                        top="12px"
                        left="-6px"
                        w="3px"
                        h="20px"
                        bg="#10b981"
                        borderRadius="full"
                      />
                    )}
                    <VStack align="stretch" spacing={1}>
                      <Text 
                        color="#ECECF1" 
                        fontSize="sm" 
                        fontWeight={index === 0 ? '600' : '400'}
                        noOfLines={2}
                      >
                        {it.title}
                      </Text>
                      <HStack justify="space-between">
                        <Text color="#6B7280" fontSize="xs">
                          {new Date(it.createdAt).toLocaleTimeString()}
                        </Text>
                        {index === 0 && (
                          <Badge 
                            colorScheme="green" 
                            fontSize="9px" 
                            borderRadius="full"
                          >
                            NEW
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                  </Box>
                ))
              )}
            </VStack>
          </VStack>
        </GridItem>
      </Grid>
      
      {/* Image Preview Modal */}
      <Modal 
        isOpen={imageModalOpen} 
        onClose={() => setImageModalOpen(false)} 
        size="6xl"
        isCentered
      >
        <ModalOverlay bg="rgba(0,0,0,0.8)" />
        <ModalContent bg="#0b0e14" border="1px solid #232735">
          <ModalHeader color="#ECECF1">
            {lang === 'ar' ? 'معاينة الصورة' : 'Image Preview'}
          </ModalHeader>
          <ModalCloseButton color="#ECECF1" />
          <ModalBody>
            {selectedImage && (
              <Box
                as="img"
                src={selectedImage}
                alt="Full size preview"
                w="100%"
                h="auto"
                maxH="80vh"
                objectFit="contain"
                borderRadius="md"
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              leftIcon={<FiDownloadCloud />}
              colorScheme="blue"
              variant="outline"
              onClick={() => {
                if (selectedImage) {
                  const link = document.createElement('a');
                  link.href = selectedImage;
                  link.download = `speedy-ai-${Date.now()}.png`;
                  link.click();
                }
              }}
            >
              {lang === 'ar' ? 'تحميل' : 'Download'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* AI Tools Settings Modal */}
      <Modal 
        isOpen={aiSettingsOpen} 
        onClose={() => setAiSettingsOpen(false)} 
        size="lg"
      >
        <ModalOverlay />
        <ModalContent bg="#0b0e14" border="1px solid #232735">
          <ModalHeader color="#ECECF1">
            <HStack>
              <FiSettings />
              <Text>{lang === 'ar' ? 'إعدادات توليد الصور' : 'Image Generation Settings'}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="#ECECF1" />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel color="#ECECF1" fontSize="sm">
                  {lang === 'ar' ? 'نموذج الصورة' : 'Image Model'}
                </FormLabel>
                <RadioGroup value={imageModel} onChange={(val) => setImageModel(val as any)}>
                  <Stack spacing={2}>
                    <Radio value="dall-e-3" colorScheme="green">
                      <VStack align="start" spacing={0}>
                        <Text color="#ECECF1" fontSize="sm">DALL-E 3</Text>
                        <Text color="#9aa0b4" fontSize="xs">
                          {lang === 'ar' ? 'جودة عالية، أبطأ قليلاً' : 'Higher quality, slightly slower'}
                        </Text>
                      </VStack>
                    </Radio>
                    <Radio value="dall-e-2" colorScheme="green">
                      <VStack align="start" spacing={0}>
                        <Text color="#ECECF1" fontSize="sm">DALL-E 2</Text>
                        <Text color="#9aa0b4" fontSize="xs">
                          {lang === 'ar' ? 'أسرع، جودة جيدة' : 'Faster, good quality'}
                        </Text>
                      </VStack>
                    </Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel color="#ECECF1" fontSize="sm">
                  {lang === 'ar' ? 'حجم الصورة' : 'Image Size'}
                </FormLabel>
                <Select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value)}
                  bg="#0f1420"
                  color="#ECECF1"
                  borderColor="#2a2f3a"
                >
                  {imageModel === 'dall-e-3' ? (
                    <>
                      <option value="1024x1024">1024x1024 (Square)</option>
                      <option value="1024x1792">1024x1792 (Portrait)</option>
                      <option value="1792x1024">1792x1024 (Landscape)</option>
                    </>
                  ) : (
                    <>
                      <option value="256x256">256x256 (Small)</option>
                      <option value="512x512">512x512 (Medium)</option>
                      <option value="1024x1024">1024x1024 (Large)</option>
                    </>
                  )}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color="#ECECF1" fontSize="sm">
                  {lang === 'ar' ? 'جودة الصورة' : 'Image Quality'}
                </FormLabel>
                <RadioGroup value={imageQuality} onChange={(val) => setImageQuality(val as any)}>
                  <Stack spacing={2}>
                    <Radio value="standard" colorScheme="green">
                      <Text color="#ECECF1" fontSize="sm">
                        {lang === 'ar' ? 'قياسي' : 'Standard'}
                      </Text>
                    </Radio>
                    <Radio value="hd" colorScheme="green">
                      <VStack align="start" spacing={0}>
                        <Text color="#ECECF1" fontSize="sm">HD</Text>
                        <Text color="#9aa0b4" fontSize="xs">
                          {lang === 'ar' ? 'جودة عالية، يستغرق وقتاً أطول' : 'Higher quality, takes longer'}
                        </Text>
                      </VStack>
                    </Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel color="#ECECF1" fontSize="sm">
                  {lang === 'ar' ? 'وضع الأمان' : 'Safety Mode'}
                </FormLabel>
                <RadioGroup value={imageSafetyMode} onChange={(val) => setImageSafetyMode(val as any)}>
                  <Stack spacing={2}>
                    <Radio value="strict" colorScheme="green">
                      <VStack align="start" spacing={0}>
                        <Text color="#ECECF1" fontSize="sm">
                          {lang === 'ar' ? 'صارم' : 'Strict'}
                        </Text>
                        <Text color="#9aa0b4" fontSize="xs">
                          {lang === 'ar' ? 'فلترة محتوى قوية' : 'Strong content filtering'}
                        </Text>
                      </VStack>
                    </Radio>
                    <Radio value="moderate" colorScheme="green">
                      <Text color="#ECECF1" fontSize="sm">
                        {lang === 'ar' ? 'متوسط' : 'Moderate'}
                      </Text>
                    </Radio>
                    <Radio value="permissive" colorScheme="green">
                      <Text color="#ECECF1" fontSize="sm">
                        {lang === 'ar' ? 'متساهل' : 'Permissive'}
                      </Text>
                    </Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              <Box bg="#0f1420" p={3} borderRadius="md" border="1px solid #232735">
                <VStack align="start" spacing={1}>
                  <Text color="#10b981" fontSize="xs" fontWeight="bold">
                    {lang === 'ar' ? 'كيفية الاستخدام:' : 'How to use:'}
                  </Text>
                  <Text color="#9aa0b4" fontSize="xs">
                    {lang === 'ar' 
                      ? 'اكتب "أنشئ صورة..." أو "generate image..." في الشات'
                      : 'Type "generate image..." or "create image..." in chat'}
                  </Text>
                  <Text color="#9aa0b4" fontSize="xs">
                    {lang === 'ar'
                      ? 'مثال: "أنشئ صورة لشاحنة توصيل بعلامة Speedy ليلاً"'
                      : 'Example: "generate image of a delivery van with Speedy branding at night"'}
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="blue" 
              onClick={() => setAiSettingsOpen(false)}
            >
              {lang === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}


