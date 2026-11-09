import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
      iconName: 'layers-outline',
      isIonicons: true,
      badge: 'Auto',
      accentColor: COLORS.accentPrimary,
    },
    {
      id: 'youtube_music' as const,
      label: 'YT Songs',
      iconName: 'musical-notes',
      isIonicons: true,
      badge: 'MP3',
      accentColor: '#FF5E3A',
    },
    {
      id: 'youtube' as const,
      label: 'YouTube',
      iconName: 'youtube',
      isIonicons: false,
      badge: '4K/HD',
      accentColor: '#FF0000',
    },
    {
      id: 'tiktok' as const,
      label: 'TikTok',
      iconName: 'tiktok',
      isIonicons: false,
      badge: 'No Mark',
      accentColor: '#00F2FE',
    },
    {
      id: 'instagram' as const,
      label: 'Instagram',
      iconName: 'instagram',
      isIonicons: false,
      badge: 'Reels',
      accentColor: '#E1306C',
    },
  ];

  const handleSelect = async (id: PlatformType | 'all') => {
    try {
      await Haptics.selectionAsync();
    } catch (_) {}
    onSelect(id);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
      >
        {platforms.map((p) => {
          const isSelected = selectedPlatform === p.id;
          const iconColor = isSelected ? p.accentColor : COLORS.textMuted;

          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.pill,
                isSelected && styles.pillSelected,
              ]}
              onPress={() => handleSelect(p.id)}
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
                  isSelected ? { backgroundColor: `${p.accentColor}25` } : styles.badgeDefault,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isSelected ? { color: p.accentColor } : styles.badgeTextDefault,
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
    paddingLeft: 20,
    marginBottom: 16,
  },
  scrollRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 6,
  },
  pillSelected: {
    backgroundColor: COLORS.cardBgElevated,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badgeTextDefault: {
    color: COLORS.textMuted,
  },
});
