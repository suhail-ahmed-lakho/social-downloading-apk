import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppLogo } from './AppLogo';
import { COLORS } from '../theme/colors';

interface HeaderProps {
  onOpenHowTo: () => void;
  activeTab: 'download' | 'history';
  onTabChange: (tab: 'download' | 'history') => void;
  historyCount: number;
  hasUpdate?: boolean;
  onOpenUpdate?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHowTo,
  activeTab,
  onTabChange,
  historyCount,
  hasUpdate = false,
  onOpenUpdate,
}) => {
  const handleTabSwitch = async (tab: 'download' | 'history') => {
    if (tab !== activeTab) {
      try {
        await Haptics.selectionAsync();
      } catch (_) {}
      onTabChange(tab);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <AppLogo size={36} />
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.titleMain}>Omni</Text>
              <Text style={styles.titleAccent}>Saver</Text>
              <View style={styles.versionChip}>
                <Text style={styles.versionText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.subtitleText}>Universal HD & Audio Downloader</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {onOpenUpdate && (
            <TouchableOpacity
              style={[
                styles.iconButton,
                hasUpdate && styles.iconButtonActive,
              ]}
              onPress={onOpenUpdate}
              activeOpacity={0.7}
            >
              <Ionicons
                name={hasUpdate ? 'cloud-download' : 'sync-outline'}
                size={16}
                color={hasUpdate ? COLORS.accentPrimary : COLORS.textSecondary}
              />
              {hasUpdate && <View style={styles.updateDot} />}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.iconButton}
            onPress={onOpenHowTo}
            activeOpacity={0.7}
          >
            <Feather name="help-circle" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Segmented Pill Controller */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[
            styles.segmentItem,
            activeTab === 'download' && styles.segmentItemActive,
          ]}
          onPress={() => handleTabSwitch('download')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-down-circle"
            size={15}
            color={activeTab === 'download' ? '#FFFFFF' : COLORS.textMuted}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'download' && styles.segmentTextActive,
            ]}
          >
            Downloader
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentItem,
            activeTab === 'history' && styles.segmentItemActive,
          ]}
          onPress={() => handleTabSwitch('history')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="file-tray-full"
            size={15}
            color={activeTab === 'history' ? '#FFFFFF' : COLORS.textMuted}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'history' && styles.segmentTextActive,
            ]}
          >
            Saved Files
          </Text>
          {historyCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{historyCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: COLORS.bg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleMain: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  titleAccent: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.accentPrimary,
    letterSpacing: -0.4,
  },
  versionChip: {
    backgroundColor: 'rgba(255, 94, 58, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 94, 58, 0.3)',
  },
  versionText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.accentPrimary,
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconButtonActive: {
    borderColor: COLORS.accentPrimary,
    backgroundColor: COLORS.accentSoft,
  },
  updateDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentPrimary,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 7,
  },
  segmentItemActive: {
    backgroundColor: COLORS.cardBgElevated,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: COLORS.accentPrimary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 3,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
