import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type VoiceMemoPageProps = {
  onBack: () => void;
};

type Memo = {
  id: number;
  title: string;
  duration: string;
  date: string;
};

export function VoiceMemoPage({ onBack }: VoiceMemoPageProps) {
  const { colors } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [pastMemos] = useState<Memo[]>([
    { id: 1, title: 'Memo 1', duration: '0:45', date: 'Today, 2:30 PM' },
    { id: 2, title: 'Memo 2', duration: '1:20', date: 'Yesterday, 5:15 PM' },
    { id: 3, title: 'Memo 3', duration: '0:32', date: 'Jan 15, 3:45 PM' },
  ]);

  // Animation values for visualizer bars
  const barHeights = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(20))
  ).current;

  useEffect(() => {
    if (isRecording) {
      // Animate bars when recording
      const animations = barHeights.map((height, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(height, {
              toValue: Math.random() * 60 + 20,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(height, {
              toValue: Math.random() * 60 + 20,
              duration: 200,
              useNativeDriver: false,
            }),
          ])
        );
      });

      // Stagger animations
      animations.forEach((anim, index) => {
        setTimeout(() => anim.start(), index * 50);
      });

      return () => {
        animations.forEach((anim) => anim.stop());
      };
    } else {
      // Reset bars when not recording
      barHeights.forEach((height) => {
        Animated.timing(height, {
          toValue: 20,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [isRecording]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Voice Memos</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Recording Section */}
        <View style={styles.recordingSection}>
          <View style={[styles.recordingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Audio Visualizer */}
            <View style={styles.visualizer}>
              {barHeights.map((height, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.visualizerBar,
                    {
                      height: height,
                      backgroundColor: isRecording ? colors.danger : `${colors.textSecondary}30`,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Record Button */}
            <TouchableOpacity
              onPress={toggleRecording}
              style={[
                styles.recordButton,
                {
                  backgroundColor: isRecording ? colors.danger : colors.accent,
                  transform: [{ scale: isRecording ? 1.1 : 1 }],
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="mic" size={40} color="#ffffff" />
            </TouchableOpacity>

            {/* Status Text */}
            <Text style={[styles.recordingStatus, { color: colors.textPrimary }]}>
              {isRecording ? 'Recording...' : 'Tap to Record'}
            </Text>
          </View>
        </View>

        {/* Past Memos */}
        <View style={styles.pastMemosSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Past Memos</Text>
          <View style={styles.memosList}>
            {pastMemos.map((memo) => (
              <View
                key={memo.id}
                style={[styles.memoItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <TouchableOpacity style={[styles.playButton, { backgroundColor: colors.accent }]}>
                  <Ionicons name="play" size={20} color="#ffffff" style={styles.playIcon} />
                </TouchableOpacity>
                <View style={styles.memoInfo}>
                  <Text style={[styles.memoTitle, { color: colors.textPrimary }]}>{memo.title}</Text>
                  <Text style={[styles.memoDetails, { color: colors.textSecondary }]}>
                    {memo.duration} • {memo.date}
                  </Text>
                </View>
                <TouchableOpacity style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  recordingSection: {
    marginBottom: 32,
  },
  recordingCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 24,
    borderWidth: 1,
  },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 96,
    width: '100%',
  },
  visualizerBar: {
    width: 4,
    borderRadius: 2,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingStatus: {
    fontSize: 18,
    fontFamily: 'monospace',
  },
  pastMemosSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  memosList: {
    gap: 12,
  },
  memoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 2,
  },
  memoInfo: {
    flex: 1,
  },
  memoTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  memoDetails: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
});

