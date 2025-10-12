import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RouteSearchingIndicatorProps {
  message?: string;
  isOnline?: boolean;
  showOfflineMessage?: boolean;
  variant?: 'searching' | 'success' | 'offline';
}

const ROTATING_MESSAGES = [
  "Matching your next route...",
  "Searching for nearby jobs...",
  "You'll be assigned a route soon.",
  "Analyzing optimal routes for you...",
  "Connecting with dispatch system...",
];

const OFFLINE_MESSAGES = [
  "You're currently offline",
  "Go online to receive new routes",
  "Toggle your status to start working",
];

export default function RouteSearchingIndicator({ 
  message,
  isOnline = true,
  showOfflineMessage = false,
  variant,
}: RouteSearchingIndicatorProps) {
  // Auto-detect variant based on message and online status
  const autoVariant = variant || (
    !isOnline || showOfflineMessage ? 'offline' :
    message?.includes('🎉') || message?.includes('matched') ? 'success' :
    'searching'
  );
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayMessage, setDisplayMessage] = useState(
    message || (isOnline ? ROTATING_MESSAGES[0] : OFFLINE_MESSAGES[0])
  );

  useEffect(() => {
    // Stop all animations if offline
    if (!isOnline && showOfflineMessage) {
      return;
    }

    // Animated progress bar moving from left to right
    const progressAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    // Pulsing opacity effect for the text
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Glowing effect for online indicator
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );

    // Wave effect for the dots
    const waveAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );

    progressAnimation.start();
    pulseAnimation.start();
    glowAnimation.start();
    waveAnimation.start();

    return () => {
      progressAnimation.stop();
      pulseAnimation.stop();
      glowAnimation.stop();
      waveAnimation.stop();
    };
  }, [progressAnim, pulseAnim, glowAnim, waveAnim, isOnline, showOfflineMessage]);

  useEffect(() => {
    // If a custom message is provided, use it instead of rotating messages
    if (message) {
      setDisplayMessage(message);
      return;
    }

    // Choose message array based on online status
    const messages = (!isOnline && showOfflineMessage) ? OFFLINE_MESSAGES : ROTATING_MESSAGES;

    // Rotate through messages every 4 seconds
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % messages.length;
        setDisplayMessage(messages[nextIndex]);
        return nextIndex;
      });
    }, 4000);

    return () => {
      clearInterval(messageInterval);
    };
  }, [message, isOnline, showOfflineMessage]);

  const translateX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 420], // Extended range for smoother animation
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const waveScale = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  // Different colors based on variant
  const statusColor = 
    autoVariant === 'offline' ? '#EF4444' :
    autoVariant === 'success' ? '#10B981' :
    '#3B82F6';
  
  const backgroundColor = 
    autoVariant === 'offline' ? '#FEF2F2' :
    autoVariant === 'success' ? '#F0FDF4' :
    '#F8FAFC';
  
  const trackColor = 
    autoVariant === 'offline' ? '#FEE2E2' :
    autoVariant === 'success' ? '#D1FAE5' :
    '#E2E8F0';

  const statusLabel = 
    autoVariant === 'offline' ? 'OFFLINE' :
    autoVariant === 'success' ? 'MATCHED' :
    'SEARCHING';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Status indicator with glow */}
      <View style={styles.statusRow}>
        <Animated.View style={[styles.statusIndicator, { opacity: glowOpacity }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Animated.View 
            style={[
              styles.statusGlow, 
              { 
                backgroundColor: statusColor,
                opacity: glowOpacity,
              }
            ]} 
          />
        </Animated.View>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusLabel}
        </Text>
      </View>

      {/* Progress bar track - only show if online */}
      {(isOnline || !showOfflineMessage) && (
        <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: statusColor,
                transform: [{ translateX }],
              },
            ]}
          />
          {/* Secondary progress bar for depth effect */}
          <Animated.View
            style={[
              styles.secondaryProgressBar,
              {
                backgroundColor: statusColor,
                transform: [{ translateX: translateX }],
                opacity: 0.4,
              },
            ]}
          />
        </View>
      )}

      {/* Message text with pulse effect and animated dots */}
      <Animated.View style={[styles.messageContainer, { opacity }]}>
        <Animated.View style={{ transform: [{ scale: waveScale }] }}>
          <View style={[styles.iconDot, { backgroundColor: statusColor }]} />
        </Animated.View>
        <Text style={styles.messageText}>{displayMessage}</Text>
        <Animated.View style={{ transform: [{ scale: waveScale }] }}>
          <View style={[styles.iconDot, { backgroundColor: statusColor }]} />
        </Animated.View>
      </Animated.View>

      {/* Decorative icon */}
      {autoVariant === 'offline' ? (
        <Ionicons 
          name="power" 
          size={16} 
          color={statusColor} 
          style={styles.decorativeIcon} 
        />
      ) : autoVariant === 'success' ? (
        <Ionicons 
          name="checkmark-circle" 
          size={16} 
          color={statusColor} 
          style={styles.decorativeIcon} 
        />
      ) : (
        <Ionicons 
          name="radio-outline" 
          size={16} 
          color={statusColor} 
          style={styles.decorativeIcon} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    position: 'relative',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 8,
  },
  statusIndicator: {
    position: 'relative',
    width: 12,
    height: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 2,
    left: 2,
    zIndex: 2,
  },
  statusGlow: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 14,
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    width: 120,
    height: '100%',
    borderRadius: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 5,
  },
  secondaryProgressBar: {
    position: 'absolute',
    width: 60,
    height: '100%',
    borderRadius: 2,
    left: -30,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  messageText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  iconDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  decorativeIcon: {
    position: 'absolute',
    top: 18,
    right: 20,
    opacity: 0.4,
  },
});

