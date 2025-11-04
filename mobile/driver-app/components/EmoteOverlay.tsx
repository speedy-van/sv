import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { EmoteDisplay } from './EmoteDisplay';
import { EmoteDisplayData } from '../services/emoteService';

interface EmoteQueueItem {
  id: string;
  data: EmoteDisplayData;
  position?: { x: number; y: number };
}

interface EmoteOverlayProps {
  style?: any;
}

export const EmoteOverlay: React.FC<EmoteOverlayProps> = ({ style }) => {
  const [emoteQueue, setEmoteQueue] = useState<EmoteQueueItem[]>([]);
  const [activeEmotes, setActiveEmotes] = useState<Set<string>>(new Set());

  // Show an emote
  const showEmote = useCallback((emoteData: EmoteDisplayData, position?: { x: number; y: number }) => {
    const queueItem: EmoteQueueItem = {
      id: `${emoteData.id}_${Date.now()}`,
      data: emoteData,
      position,
    };

    setEmoteQueue(prev => [...prev, queueItem]);
  }, []);

  // Handle emote completion
  const handleEmoteComplete = useCallback((emoteId: string) => {
    setActiveEmotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(emoteId);
      return newSet;
    });

    // Remove from queue and show next emote if available
    setEmoteQueue(prev => {
      const newQueue = prev.filter(item => item.id !== emoteId);
      return newQueue;
    });
  }, []);

  // Process queue - show emotes one at a time to avoid overcrowding
  useEffect(() => {
    if (emoteQueue.length > 0 && activeEmotes.size === 0) {
      const nextEmote = emoteQueue[0];
      if (nextEmote && !activeEmotes.has(nextEmote.id)) {
        setActiveEmotes(prev => new Set(prev).add(nextEmote.id));
      }
    }
  }, [emoteQueue, activeEmotes]);

  // Expose showEmote method globally for easy access
  useEffect(() => {
    // @ts-ignore - Global assignment for easy access
    global.showEmote = showEmote;
    return () => {
      // @ts-ignore
      delete global.showEmote;
    };
  }, [showEmote]);

  return (
    <View style={[styles.overlay, style]} pointerEvents="none">
      {emoteQueue
        .filter(item => activeEmotes.has(item.id))
        .map(item => (
          <EmoteDisplay
            key={item.id}
            emoteData={item.data}
            onComplete={() => handleEmoteComplete(item.id)}
            position={item.position}
          />
        ))}
    </View>
  );
};

// Global helper function to show emotes from anywhere in the app
export const showGlobalEmote = (emoteData: EmoteDisplayData, position?: { x: number; y: number }) => {
  // @ts-ignore
  if (global.showEmote) {
    // @ts-ignore
    global.showEmote(emoteData, position);
  }
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
});
