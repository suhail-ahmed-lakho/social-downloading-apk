import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useProStore } from '../store/useProStore';
import { getCachedRemoteConfig } from '../services/api/backendClient';

interface AdBannerSlotProps {
  placement: 'home' | 'saved' | 'preview';
  style?: StyleProp<ViewStyle>;
}

export const AdBannerSlot: React.FC<AdBannerSlotProps> = ({ placement, style }) => {
  const pro = useProStore();

  // 100% Ad-Free experience for PRO subscribers or if remotely disabled
  if (pro.isPro) {
    return null;
  }

  const remote = getCachedRemoteConfig();
  if (remote?.adConfig && (remote.adConfig.adsEnabled === false || remote.adConfig.bannerEnabled === false)) {
    return null;
  }

  return (
    <View style={[styles.container, style]} testID={`ad-slot-${placement}`}>
      <LinearGradient
        colors={['#171B28', '#101420']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.contentRow}>
          <View style={styles.badgeBox}>
            <Text style={styles.badgeText}>PRO BOOST</Text>
          </View>

          <View style={styles.copyCol}>
            <Text style={styles.titleText}>OmniSaver Turbo Speed Active</Text>
            <Text style={styles.subText}>Enjoy fast multi-threaded 4K & MP3 downloads with zero limits.</Text>
          </View>

          <View style={styles.iconCircle}>
            <Ionicons name="sparkles" size={14} color={COLORS.accentPrimary} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  cardGradient: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeBox: {
    backgroundColor: 'rgba(255, 94, 58, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 94, 58, 0.35)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.accentPrimary,
    letterSpacing: 0.5,
  },
  copyCol: {
    flex: 1,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subText: {
    fontSize: 10,
    color: COLORS.textMuted,
    lineHeight: 14,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 94, 58, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

