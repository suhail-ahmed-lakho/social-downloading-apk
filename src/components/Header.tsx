import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
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
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.logoRow}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoBadgeImage}
          />
          <View>
            <View style={styles.titleWrapper}>
              <Text style={styles.title}>OmniSaver</Text>
            </View>
            <View style={styles.identityBadgeRow}>
              <Ionicons name="shield-checkmark" size={10} color={COLORS.accentPrimary} />
              <Text style={styles.identitySubtitle}>by Lakho's team</Text>
            </View>
          </View>
        </View>

        <View style={styles.rightActionsRow}>
          {/* In-App Update Trigger / Badge */}
          {onOpenUpdate && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                hasUpdate && styles.actionButtonWithUpdate,
              ]}
              onPress={onOpenUpdate}
              activeOpacity={0.7}
            >
              <Ionicons
                name={hasUpdate ? 'cloud-download' : 'sync-outline'}
                size={16}
                color={hasUpdate ? COLORS.accentPrimary : COLORS.textMuted}
              />
              {hasUpdate && <View style={styles.updateDot} />}
            </TouchableOpacity>
          )}

          {/* Help / Guide Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onOpenHowTo}
            activeOpacity={0.7}
          >
            <Feather name="help-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'download' && styles.activeTab]}
          onPress={() => onTabChange('download')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-down-circle"
            size={16}
            color={activeTab === 'download' ? COLORS.accentPrimary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'download' && styles.activeTabText,
            ]}
          >
            Downloader
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => onTabChange('history')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="folder"
            size={16}
            color={activeTab === 'history' ? COLORS.accentPrimary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'history' && styles.activeTabText,
            ]}
          >
            Saved Files {historyCount > 0 ? `(${historyCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: COLORS.bg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoBadgeImage: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.accentBorder,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
  },
  identityBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  identitySubtitle: {
    fontSize: 11,
    color: COLORS.accentPrimary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  actionButtonWithUpdate: {
    borderColor: COLORS.accentPrimary,
    backgroundColor: COLORS.accentSoft,
  },
  updateDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.accentPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 5,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: COLORS.cardBgLight,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  activeTabText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
});
