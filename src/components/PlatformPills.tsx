import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { PlatformType } from '../types';

interface PlatformPillsProps {
  selectedPlatform: PlatformType | 'all';
  onSelect: (platform: PlatformType | 'all') => void;
}

export const PlatformPills: React.FC<PlatformPillsProps> = ({
  selectedPlatform,
  onSelect,
}) => {
  const platforms = [
    {
      id: 'all' as const,
      label: 'All Sites',
      iconName: 'sparkles',
      isIonicons: true,
      badge: 'Auto',
    },
    {
      id: 'youtube_music' as const,
      label: 'YT Songs',
      iconName: 'musical-notes',
      isIonicons: true,
      badge: 'MP3',
    },
    {
      id: 'youtube' as const,
      label: 'YouTube',
      iconName: 'youtube',
      isIonicons: false,
      badge: 'Shorts/HD',
    },
    {
      id: 'tiktok' as const,
      label: 'TikTok',
      iconName: 'tiktok',
      isIonicons: false,
      badge: 'No Mark',
    },
    {
      id: 'instagram' as const,
      label: 'Instagram',
      iconName: 'instagram',
      isIonicons: false,
      badge: 'Reels',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
      >
        {platforms.map((p) => {
          const isSelected = selectedPlatform === p.id;
          const iconColor = isSelected ? COLORS.accentPrimary : COLORS.textMuted;

          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.pill,
                isSelected && styles.pillSelected,
              ]}
              onPress={() => onSelect(p.id)}
              activeOpacity={0.7}
            >
              <View style={styles.pillIcon}>
                {p.isIonicons ? (
                  <Ionicons name={p.iconName as any} size={13} color={iconColor} />
                ) : (
                  <FontAwesome5 name={p.iconName} size={12} color={iconColor} />
                )}
              </View>
              <Text
                style={[
                  styles.pillText,
                  isSelected && styles.pillTextSelected,
                ]}
              >
                {p.label}
              </Text>
              <View
                style={[
                  styles.badge,
                  isSelected ? styles.badgeSelected : styles.badgeDefault,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isSelected ? styles.badgeTextSelected : styles.badgeTextDefault,
                  ]}
                >
                  {p.badge}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingLeft: 22,
    marginBottom: 20,
  },
  scrollRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 22,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 7,
  },
  pillSelected: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentPrimary,
  },
  pillIcon: {
    marginRight: 1,
  },
  pillText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeDefault: {
    backgroundColor: COLORS.cardBgLight,
  },
  badgeSelected: {
    backgroundColor: 'rgba(212, 160, 82, 0.18)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  badgeTextDefault: {
    color: COLORS.textMuted,
  },
  badgeTextSelected: {
    color: COLORS.accentPrimary,
  },
});
