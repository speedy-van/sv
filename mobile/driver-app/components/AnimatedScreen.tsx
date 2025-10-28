import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface AnimatedScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
}

export const AnimatedScreen: React.FC<AnimatedScreenProps> = ({ 
  children, 
  style,
  duration = 300 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();

    // Cleanup: fade out when unmounting
    return () => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: duration / 2,
        useNativeDriver: true,
      }).start();
    };
  }, []);

  return (
    <Animated.View
      style={[
        { flex: 1 },
        style,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

