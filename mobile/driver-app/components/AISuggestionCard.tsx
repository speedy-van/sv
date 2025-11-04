import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, typography, spacing, borderRadius, shadows, glassEffect } from '../utils/theme';
import { soundService } from '../services/soundService';
import { AISuggestion } from '../services/aiService';

interface AISuggestionCardProps {
  suggestion: AISuggestion;
  onActionPress: (action: string, suggestionId: string) => void;
  onDismiss: (suggestionId: string) => void;
  style?: any;
}

export const AISuggestionCard: React.FC<AISuggestionCardProps> = ({
  suggestion,
  onActionPress,
  onDismiss,
  style
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Animation refs
  const cardAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const benefitAnims = useRef(
    suggestion.estimatedSavings ?
      Object.keys(suggestion.estimatedSavings).map(() => new Animated.Value(0)) :
      []
  ).current;

  const getTypeIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'route_optimization':
        return '🚗';
      case 'job_reordering':
        return '📋';
      case 'fuel_efficiency':
        return '⛽';
      case 'rest_recommendation':
        return '🛋️';
      default:
        return '🤖';
    }
  };

  const getPriorityColor = (priority: AISuggestion['priority']) => {
    switch (priority) {
      case 'urgent':
        return colors.danger;
      case 'high':
        return colors.accent;
      case 'medium':
        return colors.secondary;
      case 'low':
        return colors.primary;
      default:
        return colors.primary;
    }
  };

  const getPriorityGlow = (priority: AISuggestion['priority']) => {
    switch (priority) {
      case 'urgent':
        return shadows.glow.red;
      case 'high':
        return shadows.glow.orange;
      case 'medium':
        return shadows.glow.green;
      case 'low':
        return shadows.glow.blue;
      default:
        return shadows.glow.blue;
    }
  };

  const handleActionPress = async (action: string) => {
    setIsActionLoading(action);
    soundService.playButtonClick();

    try {
      await onActionPress(action, suggestion.id);
    } finally {
      setIsActionLoading(null);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return colors.success;
    if (confidence >= 0.6) return colors.accent;
    return colors.warning;
  };


  const handleDismiss = async () => {
    await soundService.playContextualFeedback('decline');
    Alert.alert(
      'Dismiss Suggestion',
      'Are you sure you want to dismiss this AI suggestion?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: () => onDismiss(suggestion.id)
        }
      ]
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const renderSavings = () => {
    if (!suggestion.estimatedSavings) return null;

    const savings = [];
    if (suggestion.estimatedSavings.time) savings.push(`⏱️ ${suggestion.estimatedSavings.time}`);
    if (suggestion.estimatedSavings.distance) savings.push(`📍 ${suggestion.estimatedSavings.distance}`);
    if (suggestion.estimatedSavings.fuel) savings.push(`⛽ ${suggestion.estimatedSavings.fuel}`);
    if (suggestion.estimatedSavings.earnings) savings.push(`💰 ${suggestion.estimatedSavings.earnings}`);

    if (savings.length === 0) return null;

    return (
      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Potential Benefits:</Text>
        <View style={styles.benefitsGrid}>
          {savings.map((saving, index) => (
            <Text key={index} style={styles.benefitText}>{saving}</Text>
          ))}
        </View>
      </View>
    );
  };

  // Animation effects
  useEffect(() => {
    // Card entrance animation
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Animate benefits if they exist
    if (benefitAnims.length > 0) {
      const animations = benefitAnims.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          delay: index * 100,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        })
      );
      Animated.stagger(100, animations).start();
    }
  }, []);

  // Pulse animation for urgent/high priority suggestions
  useEffect(() => {
    if (suggestion.priority === 'urgent' || suggestion.priority === 'high') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [suggestion.priority, pulseAnim]);

  const priorityColor = getPriorityColor(suggestion.priority);
  const confidenceColor = getConfidenceColor(suggestion.confidence);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: cardAnim,
          transform: [
            { scale: Animated.multiply(cardAnim, pulseAnim) },
            { translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })}
          ]
        }
      ]}
    >
      <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
        <Animated.View
          style={[
            styles.card,
            getPriorityGlow(suggestion.priority),
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Priority indicator bar */}
          <View style={[styles.priorityBar, { backgroundColor: getPriorityColor(suggestion.priority) }]} />

          {/* Header with premium design */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: getPriorityColor(suggestion.priority) }]}>
                <Text style={styles.typeIcon}>{getTypeIcon(suggestion.type)}</Text>
              </View>
              <View style={styles.titleSection}>
                <Text style={styles.title} numberOfLines={1}>
                  {suggestion.title}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.confidence, { color: getConfidenceColor(suggestion.confidence) }]}>
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </Text>
                  <Text style={styles.priorityBadge}>
                    {suggestion.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => {
                soundService.playButtonClick();
                onDismiss(suggestion.id);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.dismissText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Description with better typography */}
          <Text style={styles.description}>
            {suggestion.description}
          </Text>

          {/* Enhanced Benefits/Savings with animations */}
          {suggestion.estimatedSavings && (
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>🎯 Potential Benefits:</Text>
              <View style={styles.benefitsGrid}>
                {(() => {
                  const benefits = [];
                  let animIndex = 0;

                  if (suggestion.estimatedSavings.time) {
                    benefits.push(
                      <Animated.View
                        key="time"
                        style={[
                          styles.benefitItem,
                          {
                            opacity: benefitAnims[animIndex] || new Animated.Value(1),
                            transform: [{
                              translateY: (benefitAnims[animIndex] || new Animated.Value(1)).interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0]
                              })
                            }]
                          }
                        ]}
                      >
                        <Text style={styles.benefitIcon}>⏱️</Text>
                        <Text style={styles.benefitText}>{suggestion.estimatedSavings.time}</Text>
                        <View style={styles.benefitProgress}>
                          <View style={[styles.benefitProgressFill, { width: '75%' }]} />
                        </View>
                      </Animated.View>
                    );
                    animIndex++;
                  }

                  if (suggestion.estimatedSavings.distance) {
                    benefits.push(
                      <Animated.View
                        key="distance"
                        style={[
                          styles.benefitItem,
                          {
                            opacity: benefitAnims[animIndex] || new Animated.Value(1),
                            transform: [{
                              translateY: (benefitAnims[animIndex] || new Animated.Value(1)).interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0]
                              })
                            }]
                          }
                        ]}
                      >
                        <Text style={styles.benefitIcon}>📍</Text>
                        <Text style={styles.benefitText}>{suggestion.estimatedSavings.distance}</Text>
                        <View style={styles.benefitProgress}>
                          <View style={[styles.benefitProgressFill, { width: '65%' }]} />
                        </View>
                      </Animated.View>
                    );
                    animIndex++;
                  }

                  if (suggestion.estimatedSavings.fuel) {
                    benefits.push(
                      <Animated.View
                        key="fuel"
                        style={[
                          styles.benefitItem,
                          {
                            opacity: benefitAnims[animIndex] || new Animated.Value(1),
                            transform: [{
                              translateY: (benefitAnims[animIndex] || new Animated.Value(1)).interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0]
                              })
                            }]
                          }
                        ]}
                      >
                        <Text style={styles.benefitIcon}>⛽</Text>
                        <Text style={styles.benefitText}>{suggestion.estimatedSavings.fuel}</Text>
                        <View style={styles.benefitProgress}>
                          <View style={[styles.benefitProgressFill, { width: '85%' }]} />
                        </View>
                      </Animated.View>
                    );
                    animIndex++;
                  }

                  if (suggestion.estimatedSavings.earnings) {
                    benefits.push(
                      <Animated.View
                        key="earnings"
                        style={[
                          styles.benefitItem,
                          {
                            opacity: benefitAnims[animIndex] || new Animated.Value(1),
                            transform: [{
                              translateY: (benefitAnims[animIndex] || new Animated.Value(1)).interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0]
                              })
                            }]
                          }
                        ]}
                      >
                        <Text style={styles.benefitIcon}>💰</Text>
                        <Text style={[styles.benefitText, styles.earningsText]}>
                          +{suggestion.estimatedSavings.earnings}
                        </Text>
                        <View style={styles.benefitProgress}>
                          <View style={[styles.benefitProgressFill, styles.earningsProgress, { width: '90%' }]} />
                        </View>
                      </Animated.View>
                    );
                    animIndex++;
                  }

                  return benefits;
                })()}
              </View>
            </View>
          )}

          {/* Enhanced Action Buttons with animations */}
          <View style={styles.actionsContainer}>
            {suggestion.actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionButton,
                  action.primary && styles.primaryActionButton,
                  isActionLoading === action.action && styles.actionButtonLoading,
                  { borderColor: getPriorityColor(suggestion.priority) }
                ]}
                onPress={() => handleActionPress(action.action)}
                activeOpacity={0.8}
                disabled={isActionLoading === action.action}
                onPressIn={() => {
                  Animated.spring(scaleAnim, {
                    toValue: 0.95,
                    useNativeDriver: true,
                  }).start();
                }}
                onPressOut={() => {
                  Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 3,
                    tension: 40,
                    useNativeDriver: true,
                  }).start();
                }}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    action.primary && styles.primaryActionButtonText,
                    isActionLoading === action.action && styles.actionButtonTextLoading
                  ]}
                >
                  {isActionLoading === action.action ? '⏳' : action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Expandable details for advanced users */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              <Text style={styles.expandedTitle}>🤖 AI Analysis Details</Text>
              <Text style={styles.expandedText}>
                This suggestion was generated using real-time traffic data, weather conditions,
                and your current route optimization analysis. Confidence is based on historical
                accuracy of similar recommendations.
              </Text>
            </View>
          )}

          {/* Expand toggle */}
          <TouchableOpacity
            style={styles.expandToggle}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Text style={styles.expandText}>
              {isExpanded ? 'Less Details ▲' : 'More Details ▼'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  blurContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  card: {
    ...glassEffect.medium,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.glow.blue,
  },
  priorityBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadows.md,
  },
  typeIcon: {
    fontSize: 18,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    ...typography.headline,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidence: {
    ...typography.caption2,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.9,
  },
  priorityBadge: {
    ...typography.caption2Emphasized,
    color: '#FFFFFF',
    fontSize: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '800',
    letterSpacing: 1,
  },
  dismissButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glass.light,
  },
  dismissText: {
    ...typography.callout,
    color: colors.text.secondary,
  },
  description: {
    ...typography.body,
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md,
    opacity: 0.95,
    fontWeight: '500',
  },
  benefitsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...shadows.sm,
  },
  benefitsTitle: {
    ...typography.subheadlineEmphasized,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  benefitItem: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: '45%',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...shadows.md,
  },
  benefitIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  benefitText: {
    ...typography.caption1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  benefitProgress: {
    width: '100%',
    height: 3,
    backgroundColor: colors.glass.medium,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  benefitProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 1.5,
    ...shadows.glow.blue,
  },
  earningsText: {
    color: colors.success,
    fontWeight: '700',
  },
  earningsProgress: {
    backgroundColor: colors.success,
    ...shadows.glow.green,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md + spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: colors.primary,
    ...shadows.md,
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.glow.blue,
  },
  actionButtonText: {
    ...typography.calloutEmphasized,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  actionButtonLoading: {
    opacity: 0.7,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
  },
  actionButtonTextLoading: {
    opacity: 0.7,
  },
  expandedContent: {
    backgroundColor: colors.glass.dark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  expandedTitle: {
    ...typography.subheadlineEmphasized,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  expandedText: {
    ...typography.caption1,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  expandToggle: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  expandText: {
    ...typography.caption2,
    color: colors.text.tertiary,
  },
});
