'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  HStack,
  VStack,
  Text,
  IconButton,
  Textarea,
  Button,
  Badge,
  Select,
  Avatar,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  useToast,
} from '@chakra-ui/react';
import { FiMessageCircle, FiSend, FiX, FiZap, FiDownload, FiBarChart2 } from 'react-icons/fi';

type Lang = 'en' | 'ar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: Date;
}

interface AssistantMetadata {
  requestId: string;
  processingTimeMs?: number;
  liveStats?: any;
  driverAvailability?: any;
  predictiveAnalytics?: any;
  proactiveSuggestions?: any;
  references?: { orders: string[]; routes: string[] };
}

export default function AdminChatWidgetMinimal({
  adminName = 'Admin',
  adminEmail = '',
}: {
  adminName?: string;
  adminEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [metadata, setMetadata] = useState<AssistantMetadata | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [liveFeed, setLiveFeed] = useState<Array<{ id: string; title: string; createdAt: string }>>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Global open/close events so header button can control the widget
  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setFullscreen(true); // Always open in fullscreen when triggered from header
    };
    const onClose = () => {
      setOpen(false);
      setFullscreen(false);
    };
    window.addEventListener('sv-ai-open', onOpen as EventListener);
    window.addEventListener('sv-ai-close', onClose as EventListener);
    return () => {
      window.removeEventListener('sv-ai-open', onOpen as EventListener);
      window.removeEventListener('sv-ai-close', onClose as EventListener);
    };
  }, []);

  // Poll live notifications as "Live Lane"
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
          setLiveFeed(items.slice(0, 10));
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

  const send = async () => {
    if (loading || !input.trim()) return;
    const content = input.trim();
    setInput('');

    const userMsg: Message = { id: String(Date.now()), role: 'user', content, ts: new Date() };
    const streamId = String(Date.now() + 1);
    const aiMsg: Message = { id: streamId, role: 'assistant', content: '', ts: new Date() };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setLoading(true);
    setMetadata(null);

    try {
      const body = JSON.stringify({
        message: content,
        conversationHistory: [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
          message: m.content,
        })),
        language: lang,
        mode: 'stream',
      });
      const res = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
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
        if (!line) return;
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
          // ignore malformed chunks
        }
      };

      while (true) {
        const { done, value } = await reader.read();
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
        aggregate = finalLang === 'ar' ? 'تمت المعالجة.' : 'Processed.';
        apply(aggregate);
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

  if (!open) {
    // No floating opener; controlled by header button via events
    return null;
  }

  return (
    <>
      {fullscreen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0,0,0,0.6)"
          zIndex={999}
        />
      )}
      <Card
        position="fixed"
        {...(fullscreen
          ? { top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }
          : { bottom: '20px', right: '20px', width: '360px', height: '520px' })}
        zIndex={1000}
        borderRadius={fullscreen ? '0' : 'lg'}
        bg="#1b1e27"
        border={fullscreen ? 'none' : '1px solid #2a2f3a'}
        boxShadow={fullscreen ? 'none' : '0 20px 50px rgba(0,0,0,0.55)'}
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <CardBody p={0} borderBottom="1px solid #2a2f3a" bg="#0B1020">
          <HStack justify="space-between" p={3}>
            <HStack>
              <Avatar size="sm" bg="#2563eb" icon={<FiZap />} />
              <VStack align="start" spacing={0}>
                <HStack>
                  <Text fontSize="sm" fontWeight="bold" color="#ECECF1">
                    Speedy AI
                  </Text>
                  <Badge colorScheme="green" borderRadius="full">
                    {lang === 'ar' ? 'متصل' : 'Online'}
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="#9ca3af">
                  {lang === 'ar' ? 'مساعدك الذكي' : 'Your assistant'}
                </Text>
              </VStack>
            </HStack>
            <HStack>
              <Select
                size="xs"
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                width="70px"
                bg="#232735"
                color="#ECECF1"
                borderColor="#2a2f3a"
              >
                <option value="en" style={{ background: '#1b1e27', color: '#fff' }}>
                  EN
                </option>
                <option value="ar" style={{ background: '#1b1e27', color: '#fff' }}>
                  AR
                </option>
              </Select>
              <IconButton
                aria-label="Insights"
                icon={<FiBarChart2 />}
                size="sm"
                variant="ghost"
                color="#ECECF1"
                onClick={() => setShowInsights(true)}
              />
              <IconButton
                aria-label="Export"
                icon={<FiDownload />}
                size="sm"
                variant="ghost"
                color="#ECECF1"
                onClick={exportTxt}
                isDisabled={messages.length === 0}
              />
              <IconButton
                aria-label="Close"
                icon={<FiX />}
                size="sm"
                variant="ghost"
                color="#ECECF1"
                onClick={() => {
                  setOpen(false);
                  setFullscreen(false);
                }}
              />
            </HStack>
          </HStack>
        </CardBody>

        <Box flex={1} overflowY="auto" p={3} bg="#1b1e27">
          <VStack align="stretch" spacing={3}>
            {messages.map((m) => (
              <HStack key={m.id} justify={m.role === 'user' ? 'flex-end' : 'flex-start'}>
                {m.role === 'assistant' && <Avatar size="xs" bg="#2563eb" icon={<FiZap />} />}
                <Box
                  maxW="80%"
                  bg={m.role === 'user' ? '#2a2f3a' : '#242836'}
                  color="#ECECF1"
                  borderRadius="md"
                  px={3}
                  py={2}
                  border="1px solid #2a2f3a"
                >
                  <Text fontSize="sm" whiteSpace="pre-wrap">
                    {m.content}
                  </Text>
                </Box>
                {m.role === 'user' && <Avatar size="xs" bg="#4b5563" />}
              </HStack>
            ))}
            {loading && (
              <Text fontSize="xs" color="#9ca3af">
                {lang === 'ar' ? 'جاري الكتابة...' : 'Typing...'}
              </Text>
            )}
            <div ref={endRef} />
          </VStack>
        </Box>

        <CardBody p={3} borderTop="1px solid #2a2f3a" bg="#0B1020">
          <HStack align="flex-end">
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
              rows={2}
              resize="none"
              bg="#0B1020"
              color="#F5F8FF"
              borderColor="#2A3A5E"
              _placeholder={{ color: '#9AA0B4' }}
              fontSize="sm"
              css={{ caretColor: '#F5F8FF' }}
            />
            <IconButton
              aria-label="Send"
              icon={<FiSend color="#fff" />}
              bg="#10b981"
              color="#fff"
              onClick={send}
              isDisabled={!input.trim() || loading}
              _hover={{ bg: '#059669' }}
            />
          </HStack>
        </CardBody>
      </Card>

      <Drawer isOpen={showInsights} placement="right" onClose={() => setShowInsights(false)}>
        <DrawerOverlay />
        <DrawerContent bg="#1b1e27" borderLeft="1px solid #2a2f3a">
          <DrawerHeader color="#ECECF1" borderBottom="1px solid #2a2f3a">
            {lang === 'ar' ? 'رؤى الذكاء الاصطناعي' : 'AI Insights'}
          </DrawerHeader>
          <DrawerBody>
            {metadata ? (
              <VStack align="stretch" spacing={3} color="#ECECF1">
                <Text fontSize="sm">
                  {lang === 'ar' ? 'رقم الطلب' : 'Request'}: {metadata.requestId?.slice(0, 8)}
                </Text>
                {typeof metadata.processingTimeMs === 'number' && (
                  <Text fontSize="sm">
                    {lang === 'ar' ? 'زمن المعالجة' : 'Processing'}: {metadata.processingTimeMs} ms
                  </Text>
                )}
                <Text fontSize="sm" color="#9ca3af">
                  {lang === 'ar'
                    ? 'اعرض نظرة عامة من البوت للحصول على تفاصيل النظام والسائقين والتوقعات.'
                    : 'Ask the bot for an overview to populate system, drivers and forecast details.'}
                </Text>
                <Box mt={2}>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    {lang === 'ar' ? 'تغذية مباشرة' : 'Live Lane'}
                  </Text>
                  <VStack align="stretch" spacing={1}>
                    {liveFeed.length === 0 ? (
                      <Text fontSize="xs" color="#9ca3af">
                        {lang === 'ar' ? 'لا يوجد عناصر حالياً.' : 'No items yet.'}
                      </Text>
                    ) : (
                      liveFeed.map((it) => (
                        <HStack key={it.id} justify="space-between">
                          <Text fontSize="sm">{it.title}</Text>
                          <Text fontSize="xs" color="#9ca3af">
                            {new Date(it.createdAt).toLocaleTimeString()}
                          </Text>
                        </HStack>
                      ))
                    )}
                  </VStack>
                </Box>
              </VStack>
            ) : (
              <Text fontSize="sm" color="#9ca3af">
                {lang === 'ar' ? 'لا توجد بيانات حالياً.' : 'No data yet.'}
              </Text>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}


