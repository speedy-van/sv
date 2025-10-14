import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ShimmerLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const ShimmerLoader: React.FC<ShimmerLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View
      style={[
        styles.container,
        {
          width: width as any,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['#1A1A1A', '#262626', '#333333', '#262626', '#1A1A1A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

interface ProfileShimmerProps {
  style?: ViewStyle;
}

export const ProfileShimmer: React.FC<ProfileShimmerProps> = ({ style }) => {
  return (
    <View style={[styles.profileShimmerContainer, style]}>
      {/* Profile Photo */}
      <View style={styles.photoSection}>
        <ShimmerLoader width={100} height={100} borderRadius={50} />
        <ShimmerLoader width={120} height={12} borderRadius={6} style={{ marginTop: 8 }} />
      </View>

      {/* Form Fields */}
      <View style={styles.formSection}>
        <ShimmerLoader width={80} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <ShimmerLoader width="100%" height={48} borderRadius={8} style={{ marginBottom: 16 }} />

        <ShimmerLoader width={80} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <ShimmerLoader width="100%" height={48} borderRadius={8} style={{ marginBottom: 16 }} />

        <ShimmerLoader width={80} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <ShimmerLoader width="100%" height={48} borderRadius={8} style={{ marginBottom: 16 }} />

        <ShimmerLoader width={100} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <ShimmerLoader width="100%" height={48} borderRadius={8} style={{ marginBottom: 16 }} />

        <ShimmerLoader width={100} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <ShimmerLoader width="100%" height={48} borderRadius={8} style={{ marginBottom: 16 }} />
      </View>

      {/* Button */}
      <ShimmerLoader width="100%" height={48} borderRadius={8} style={{ marginTop: 20 }} />
    </View>
  );
};

interface NotificationShimmerProps {
  style?: ViewStyle;
}

export const NotificationShimmer: React.FC<NotificationShimmerProps> = ({ style }) => {
  return (
    <View style={[styles.notificationShimmerContainer, style]}>
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <ShimmerLoader width={150} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
            <ShimmerLoader width={200} height={12} borderRadius={4} />
          </View>
          <ShimmerLoader width={51} height={31} borderRadius={16} />
        </View>
      ))}
      <ShimmerLoader width="100%" height={48} borderRadius={8} style={{ marginTop: 20 }} />
    </View>
  );
};

interface CardShimmerProps {
  style?: ViewStyle;
}

export const CardShimmer: React.FC<CardShimmerProps> = ({ style }) => {
  return (
    <View style={[styles.cardShimmerContainer, style]}>
      <ShimmerLoader width="60%" height={20} borderRadius={4} style={{ marginBottom: 12 }} />
      <ShimmerLoader width="100%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
      <ShimmerLoader width="80%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
      <ShimmerLoader width="90%" height={16} borderRadius={4} />
    </View>
  );
};

interface ListShimmerProps {
  count?: number;
  style?: ViewStyle;
}

export const ListShimmer: React.FC<ListShimmerProps> = ({ count = 3, style }) => {
  return (
    <View style={[styles.listShimmerContainer, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <ShimmerLoader width={60} height={60} borderRadius={8} />
          <View style={styles.listItemContent}>
            <ShimmerLoader width="70%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
            <ShimmerLoader width="50%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
            <ShimmerLoader width="40%" height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    width: 300,
  },
  profileShimmerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formSection: {
    marginBottom: 16,
  },
  notificationShimmerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardShimmerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listShimmerContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
});

