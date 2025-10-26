import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type WalkingHomePageProps = {
  onBack: () => void;
  sosHolding: boolean;
  sosTimer: number;
  handleSosPress: () => void;
  handleSosRelease: () => void;
  setSosAlertOpen: (open: boolean) => void;
};

export function WalkingHomePage({
  onBack,
  sosHolding,
  sosTimer,
  handleSosPress,
  handleSosRelease,
}: WalkingHomePageProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Walking Home</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* SOS Button */}
        <View style={styles.sosButtonContainer}>
          <TouchableOpacity
            onPressIn={handleSosPress}
            onPressOut={handleSosRelease}
            activeOpacity={0.9}
            style={[
              styles.sosButton,
              {
                backgroundColor: sosHolding ? colors.danger : `${colors.danger}e6`,
                transform: [{ scale: sosHolding ? 0.95 : 1 }],
              },
            ]}
          >
            <Ionicons name="warning" size={80} color="#ffffff" style={styles.sosIcon} />
            <Text style={styles.sosText}>
              {sosHolding ? `${Math.ceil(3 - sosTimer)}s` : 'SOS'}
            </Text>
            {sosHolding && (
              <View style={styles.sosProgressContainer}>
                <View style={[styles.sosProgressBar, { width: `${(sosTimer / 3) * 100}%` }]} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Warning Message */}
        <View
          style={[
            styles.warningCard,
            {
              backgroundColor: `${colors.warning}1a`,
              borderColor: `${colors.warning}33`,
            },
          ]}
        >
          <View style={styles.warningContent}>
            <Ionicons name="warning" size={24} color={colors.warning} style={styles.warningIcon} />
            <View style={styles.warningTextContainer}>
              <Text style={[styles.warningTitle, { color: colors.textPrimary }]}>
                Safety Check-In Active
              </Text>
              <Text style={[styles.warningDescription, { color: colors.textSecondary }]}>
                The app will send you a discreet notification every 5 minutes to confirm your presence. If you
                don't respond within 1 minute, Emergency SOS will be automatically triggered and your emergency
                contacts will be notified.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  sosButtonContainer: {
    marginBottom: 48,
  },
  sosButton: {
    width: 192,
    height: 192,
    borderRadius: 96,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
    position: 'relative',
  },
  sosIcon: {
    marginBottom: 8,
  },
  sosText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sosProgressContainer: {
    position: 'absolute',
    bottom: 32,
    width: 128,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sosProgressBar: {
    height: '100%',
    backgroundColor: '#ffffff',
  },
  warningCard: {
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    borderWidth: 1,
  },
  warningContent: {
    flexDirection: 'row',
    gap: 12,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

