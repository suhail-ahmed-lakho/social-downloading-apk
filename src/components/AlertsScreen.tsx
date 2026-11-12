import React, { useState } from 'react';
import {
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import {
  clearNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
  NotificationState,
  openNotificationSettings,
  requestNotificationPermissions,
  sendTestNotification,
} from '../services/notifications/notificationService';

interface AlertsScreenProps {
  notificationState: NotificationState;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({ notificationState }) => {
  const [showPushSetup, setShowPushSetup] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleCopyToken = async () => {
    const value = notificationState.expoPushToken || notificationState.projectId || '';
    if (!value) return;
    try {
      await Clipboard.setStringAsync(value);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } catch {}
  };

  const renderStatusCard = () => {
    const status = notificationState.permissionStatus;

    if (status === 'granted') {
      return (
        <View style={[styles.statusCard, styles.statusCardGranted]} testID="alerts-status-granted">
          <View style={styles.statusHeader}>
            <View style={[styles.statusIconWrap, { backgroundColor: COLORS.successSoft }]}>
              <Ionicons name="notifications" size={18} color={COLORS.success} />
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>Notifications Active</Text>
              <Text style={styles.statusSubtitle}>
                Download completion, background progress, and app updates are enabled.
              </Text>
            </View>
          </View>
          <View style={styles.statusActionsRow}>
            <TouchableOpacity
              testID="alerts-test-btn"
              style={styles.testBtn}
              onPress={() => void sendTestNotification()}
              activeOpacity={0.8}
            >
              <Ionicons name="paper-plane" size={13} color={COLORS.textPrimary} />
              <Text style={styles.testBtnText}>Send Test Alert</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="alerts-push-info-btn"
              style={styles.pushSetupToggle}
              onPress={() => setShowPushSetup((prev) => !prev)}
            >
              <Ionicons name="key-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.pushSetupToggleText}>
                {showPushSetup ? 'Hide Push Setup' : 'Broadcast Setup'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (status === 'denied') {
      return (
        <View style={[styles.statusCard, styles.statusCardDenied]} testID="alerts-status-denied">
          <View style={styles.statusHeader}>
            <View style={[styles.statusIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.16)' }]}>
              <Ionicons name="notifications-off" size={18} color="#F59E0B" />
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>Notifications Denied in Settings</Text>
              <Text style={styles.statusSubtitle}>
                Downloads still save in the background and appear below. Open Settings anytime to turn
                status-bar alerts back on.
              </Text>
            </View>
          </View>
          <View style={styles.statusActionsRow}>
            <TouchableOpacity
              testID="alerts-open-settings-btn"
              style={styles.enableBtn}
              onPress={() => void openNotificationSettings()}
              activeOpacity={0.85}
            >
              <Ionicons name="settings-outline" size={14} color="#FFFFFF" />
              <Text style={styles.enableBtnText}>Open App Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="alerts-test-btn"
              style={styles.testBtn}
              onPress={() => void sendTestNotification()}
            >
              <Text style={styles.testBtnText}>Add In-App Alert</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="alerts-push-info-btn"
              style={styles.pushSetupToggle}
              onPress={() => setShowPushSetup((prev) => !prev)}
            >
              <Text style={styles.pushSetupToggleText}>
                {showPushSetup ? 'Hide Setup' : 'Push Setup'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.statusCard} testID="alerts-status-undetermined">
        <View style={styles.statusHeader}>
          <View style={[styles.statusIconWrap, { backgroundColor: COLORS.accentSoft }]}>
            <Ionicons name="notifications-outline" size={18} color={COLORS.accentPrimary} />
          </View>
          <View style={styles.statusCopy}>
            <Text style={styles.statusTitle}>Stay Updated on Downloads</Text>
            <Text style={styles.statusSubtitle}>
              Get instant status-bar alerts when background videos finish or new platform fixes release.
            </Text>
          </View>
        </View>
        <View style={styles.statusActionsRow}>
          <TouchableOpacity
            testID="alerts-enable-btn"
            style={styles.enableBtn}
            onPress={() => void requestNotificationPermissions()}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" />
            <Text style={styles.enableBtnText}>Allow Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="alerts-push-info-btn"
            style={styles.pushSetupToggle}
            onPress={() => setShowPushSetup((prev) => !prev)}
          >
            <Text style={styles.pushSetupToggleText}>
              {showPushSetup ? 'Hide Setup' : 'Push Setup'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFeedItem = ({ item }: { item: NotificationItem }) => {
    const iconName =
      item.category === 'download'
        ? 'checkmark-circle'
        : item.category === 'announcement'
          ? 'megaphone'
          : 'sparkles';
    const iconColor =
      item.category === 'download'
        ? COLORS.success
        : item.category === 'announcement'
          ? COLORS.accentPrimary
          : '#38BDF8';

    return (
      <TouchableOpacity
        testID={`alert-item-${item.id}`}
        style={[styles.feedItem, !item.read && styles.feedItemUnread]}
        onPress={() => markNotificationRead(item.id)}
        activeOpacity={0.85}
      >
        <View style={styles.feedIconCol}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.feedBodyCol}>
          <View style={styles.feedTitleRow}>
            <Text style={styles.feedTitle}>{item.title}</Text>
            {!item.read ? <View style={styles.unreadDot} /> : null}
          </View>
          <Text style={styles.feedBody}>{item.body}</Text>
          <View style={styles.feedFooter}>
            <Text style={styles.feedTime}>
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {item.ctaUrl ? (
              <TouchableOpacity onPress={() => void Linking.openURL(item.ctaUrl!)}>
                <Text style={styles.ctaLink}>Open Link</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container} testID="screen-alerts">
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTitle}>Alerts & Notifications</Text>
            <Text style={styles.screenSubtitle}>
              {notificationState.unreadCount > 0
                ? `${notificationState.unreadCount} unread updates`
                : 'Download alerts & announcements'}
            </Text>
          </View>
          {notificationState.items.length > 0 ? (
            <View style={styles.headerActions}>
              <TouchableOpacity
                testID="alerts-mark-read-btn"
                style={styles.smallGhostBtn}
                onPress={markAllNotificationsRead}
              >
                <Text style={styles.smallGhostText}>Mark Read</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="alerts-clear-btn"
                style={styles.smallGhostBtn}
                onPress={clearNotifications}
              >
                <Text style={styles.smallGhostText}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {renderStatusCard()}

        {showPushSetup ? (
          <View style={styles.pushInfoBox} testID="alerts-push-setup-panel">
            <Text style={styles.pushInfoTitle}>Push & Remote Broadcast Readiness</Text>
            <Text style={styles.pushInfoText}>
              1. In-app & remote alerts sync automatically from looknow.cyou/api/notifications even if a
              user denies OS notifications.{'\n'}
              2. For true lock-screen push broadcasts (FCM + Expo Push API), link Firebase FCM credentials
              in EAS and send to registered ExpoPushTokens.
            </Text>
            <View style={styles.tokenBox}>
              <Text style={styles.tokenLabel} numberOfLines={1}>
                {notificationState.expoPushToken
                  ? `Token: ${notificationState.expoPushToken}`
                  : `EAS Project: ${notificationState.projectId || 'Not set'}`}
              </Text>
              <TouchableOpacity style={styles.copyTokenBtn} onPress={() => void handleCopyToken()}>
                <Text style={styles.copyTokenText}>{copiedToken ? 'Copied' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>

      {notificationState.items.length === 0 ? (
        <View style={styles.emptyBox} testID="alerts-empty-state">
          <Ionicons name="notifications-outline" size={32} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>You're All Caught Up</Text>
          <Text style={styles.emptyText}>
            Notifications from completed downloads and OmniSaver announcements will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notificationState.items}
          keyExtractor={(item) => item.id}
          renderItem={renderFeedItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallGhostBtn: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorderLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  smallGhostText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorderLight,
    padding: 14,
    gap: 12,
  },
  statusCardGranted: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusCardDenied: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  statusHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  statusIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCopy: {
    flex: 1,
  },
  statusTitle: {
    color: COLORS.textPrimary,
    fontSize: 14.5,
    fontWeight: '800',
    marginBottom: 3,
  },
  statusSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  statusActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  enableBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.accentPrimary,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  enableBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.cardBgLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorderLight,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  testBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  pushSetupToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  pushSetupToggleText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  pushInfoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorderLight,
    padding: 12,
    gap: 8,
  },
  pushInfoTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  pushInfoText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
  },
  tokenBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tokenLabel: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  copyTokenBtn: {
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
  },
  copyTokenText: {
    color: COLORS.accentPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },
  feedItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 13,
  },
  feedItemUnread: {
    borderColor: COLORS.accentBorder,
    backgroundColor: '#171B29',
  },
  feedIconCol: {
    paddingTop: 2,
  },
  feedBodyCol: {
    flex: 1,
    gap: 4,
  },
  feedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  feedTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentPrimary,
  },
  feedBody: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
  },
  feedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  feedTime: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  ctaLink: {
    color: COLORS.accentPrimary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 19,
  },
});
