import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';

export type AppTab = 'download' | 'queue' | 'history' | 'alerts';

interface BottomNavBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  activeDownloadsCount: number;
  pausedDownloadsCount: number;
  historyCount: number;
  unreadAlertsCount: number;
  notificationsDenied: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  activeDownloadsCount,
  pausedDownloadsCount,
  historyCount,
  unreadAlertsCount,
  notificationsDenied,
}) => {
  const queueBadgeCount = activeDownloadsCount + pausedDownloadsCount;

  const tabs: Array<{
    key: AppTab;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
    badgeCount?: number;
    badgeTone?: 'accent' | 'warning' | 'neutral';
    dotWarning?: boolean;
  }> = [
    {
      key: 'download',
      label: 'Home',
      icon: 'home-outline',
      activeIcon: 'home',
    },
    {
      key: 'queue',
      label: 'Downloads',
      icon: 'cloud-download-outline',
      activeIcon: 'cloud-download',
      badgeCount: queueBadgeCount,
      badgeTone: activeDownloadsCount > 0 ? 'accent' : 'warning',
    },
    {
      key: 'history',
      label: 'Saved',
      icon: 'folder-open-outline',
      activeIcon: 'folder-open',
      badgeCount: historyCount,
      badgeTone: 'neutral',
    },
    {
      key: 'alerts',
      label: 'Alerts',
      icon: 'notifications-outline',
      activeIcon: 'notifications',
      badgeCount: unreadAlertsCount,
      badgeTone: 'accent',
      dotWarning: notificationsDenied && unreadAlertsCount === 0,
    },
  ];

  const handlePress = async (tab: AppTab) => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    onTabChange(tab);
  };

  return (
    <View style={styles.dockWrapper} testID="bottom-nav-bar">
      <View style={styles.dockInner}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              testID={`nav-tab-${tab.key}`}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
              onPress={() => void handlePress(tab.key)}
              activeOpacity={0.8}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
            >
              <View style={styles.iconContainer}>
                {isActive ? (
                  <LinearGradient
                    testID="nav-active-capsule"
                    colors={COLORS.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.activeCapsule}
                  >
                    <Ionicons name={tab.activeIcon} size={19} color="#FFFFFF" />
                  </LinearGradient>
                ) : (
                  <View style={styles.inactiveIconBox}>
                    <Ionicons name={tab.icon} size={20} color={COLORS.textSecondary} />
                  </View>
                )}

                {typeof tab.badgeCount === 'number' && tab.badgeCount > 0 ? (
                  <View
                    testID={`nav-badge-${tab.key}`}
                    style={[
                      styles.badge,
                      tab.badgeTone === 'accent' && (isActive ? styles.badgeActiveInvert : styles.badgeAccent),
                      tab.badgeTone === 'warning' && styles.badgeWarning,
                      tab.badgeTone === 'neutral' && styles.badgeNeutral,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        tab.badgeTone === 'accent' && isActive && styles.badgeTextInvert,
                      ]}
                    >
                      {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                    </Text>
                  </View>
                ) : tab.dotWarning ? (
                  <View testID={`nav-warning-${tab.key}`} style={styles.warningDot} />
                ) : null}
              </View>

              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    backgroundColor: '#0C0F17',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 10,
  },
  dockInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    gap: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabButtonActive: {},
  iconContainer: {
    position: 'relative',
    width: 58,
    height: 30,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCapsule: {
    width: 58,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIconBox: {
    width: 58,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: COLORS.accentLight,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.8,
    borderColor: '#0C0F17',
  },
  badgeAccent: {
    backgroundColor: COLORS.accentPrimary,
  },
  badgeActiveInvert: {
    backgroundColor: '#FFFFFF',
  },
  badgeWarning: {
    backgroundColor: '#F59E0B',
  },
  badgeNeutral: {
    backgroundColor: '#334155',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  badgeTextInvert: {
    color: '#FF2A6D',
  },
  warningDot: {
    position: 'absolute',
    top: 1,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#0C0F17',
  },
});

