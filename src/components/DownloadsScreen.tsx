import React from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import {
  cancelDownload,
  clearCompletedDownloads,
  DownloadQueueItem,
  DownloadQueueSnapshot,
  pauseDownload,
  removeQueueItem,
  resumeDownload,
  retryDownload,
} from '../services/download/downloadQueue';
import { formatSpeed } from '../services/download/downloadTelemetry';
import { shareDownloadedMedia } from '../services/download/downloadManager';
import { NotificationPermissionState } from '../services/notifications/notificationService';

interface DownloadsScreenProps {
  queue: DownloadQueueSnapshot;
  notificationPermission: NotificationPermissionState;
  onRequestNotifications: () => void;
  onGoToHome: () => void;
  onOpenSaved: () => void;
}

export const DownloadsScreen: React.FC<DownloadsScreenProps> = ({
  queue,
  notificationPermission,
  onRequestNotifications,
  onGoToHome,
  onOpenSaved,
}) => {
  const hasFinishedItems = queue.items.some(
    (item) =>
      item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled'
  );

  const handleShare = async (item: DownloadQueueItem) => {
    if (!item.localUri) return;
    try {
      await shareDownloadedMedia(item.localUri);
    } catch (err: unknown) {
      Alert.alert('Share Error', err instanceof Error ? err.message : 'Unable to share file.');
    }
  };

  const renderPlatformBadge = (item: DownloadQueueItem) => {
    switch (item.platform) {
      case 'tiktok':
        return <FontAwesome5 name="tiktok" size={11} color="#00F2FE" />;
      case 'instagram':
        return <FontAwesome5 name="instagram" size={11} color="#E1306C" />;
      case 'youtube':
      case 'youtube_music':
        return <FontAwesome5 name="youtube" size={11} color="#FF0000" />;
      default:
        return <Ionicons name="videocam" size={12} color={COLORS.textSecondary} />;
    }
  };

  const getStatusMeta = (status: DownloadQueueItem['status']) => {
    switch (status) {
      case 'downloading':
        return { label: 'Downloading', color: COLORS.accentPrimary, bg: COLORS.accentSoft };
      case 'resolving':
        return { label: 'Preparing', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.14)' };
      case 'queued':
        return { label: 'Queued', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.14)' };
      case 'paused':
        return { label: 'Paused', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'completed':
        return { label: 'Completed', color: COLORS.success, bg: COLORS.successSoft };
      case 'failed':
        return { label: 'Failed', color: COLORS.danger, bg: COLORS.dangerSoft };
      case 'cancelled':
        return { label: 'Cancelled', color: COLORS.textMuted, bg: 'rgba(100, 116, 139, 0.14)' };
    }
  };

  const renderItem = ({ item }: { item: DownloadQueueItem }) => {
    const statusMeta = getStatusMeta(item.status);
    const { telemetry } = item;
    const isActiveTransfer =
      item.status === 'downloading' || item.status === 'resolving' || item.status === 'queued';

    return (
      <View style={styles.card} testID={`download-item-${item.id}`}>
        <View style={styles.cardHeader}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={styles.thumbFallback}>
              <Ionicons
                name={item.isAudio ? 'musical-notes' : 'film'}
                size={20}
                color={COLORS.accentPrimary}
              />
            </View>
          )}

          <View style={styles.titleBlock}>
            <View style={styles.metaTopRow}>
              <View style={styles.platformChip}>
                {renderPlatformBadge(item)}
                <Text style={styles.platformChipText}>{item.qualityLabel}</Text>
              </View>

              <View
                testID={`download-status-${item.id}`}
                style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}
              >
                <Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>
                  {statusMeta.label}
                </Text>
              </View>
            </View>

            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={
                item.status === 'completed'
                  ? ['#10B981', '#059669']
                  : item.status === 'paused'
                    ? ['#F59E0B', '#D97706']
                    : item.status === 'failed'
                      ? ['#EF4444', '#B91C1C']
                      : COLORS.gradientPrimary
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: `${Math.max(item.status === 'queued' ? 4 : 2, telemetry.percent)}%` },
              ]}
            />
          </View>
        </View>

        {/* 4-Cell Live Telemetry Matrix: % | Speed | Downloaded | Remaining */}
        <View style={styles.telemetryGrid}>
          <View style={styles.telemetryCell}>
            <Text style={styles.telemetryLabel}>PROGRESS</Text>
            <Text style={styles.telemetryValueAccent} testID="telemetry-percent">
              {telemetry.percent}%
            </Text>
          </View>

          <View style={styles.telemetryCell}>
            <Text style={styles.telemetryLabel}>SPEED</Text>
            <Text style={styles.telemetryValue} testID="telemetry-speed">
              {item.status === 'downloading' ? telemetry.speedText : item.status === 'paused' ? 'Paused' : '0 KB/s'}
            </Text>
          </View>

          <View style={styles.telemetryCell}>
            <Text style={styles.telemetryLabel}>DOWNLOADED</Text>
            <Text style={styles.telemetryValue} testID="telemetry-downloaded">
              {telemetry.downloadedMB}
            </Text>
          </View>

          <View style={styles.telemetryCell}>
            <Text style={styles.telemetryLabel}>REMAINING</Text>
            <Text style={styles.telemetryValue} testID="telemetry-remaining">
              {telemetry.totalBytes > 0 ? `${telemetry.remainingMB} left` : telemetry.etaText}
            </Text>
          </View>
        </View>

        {/* Total / ETA sub-strip */}
        <View style={styles.subTelemetryRow}>
          <Text style={styles.subTelemetryText} numberOfLines={1}>
            {telemetry.statusText || 'Ready'}
            {telemetry.totalBytes > 0 ? ` • Total ${telemetry.totalMB}` : ''}
          </Text>
          {isActiveTransfer && telemetry.etaText !== '--' ? (
            <Text style={styles.etaBadge} testID="telemetry-eta">
              {telemetry.etaText}
            </Text>
          ) : null}
        </View>

        {item.errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
            <Text style={styles.errorText}>{item.errorMessage}</Text>
          </View>
        ) : null}

        {/* Action Controls */}
        <View style={styles.actionsRow}>
          {isActiveTransfer ? (
            <>
              <TouchableOpacity
                testID="btn-pause-download"
                style={styles.secondaryActionBtn}
                onPress={() => void pauseDownload(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="pause" size={14} color={COLORS.textPrimary} />
                <Text style={styles.secondaryActionText}>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="btn-cancel-download"
                style={styles.dangerActionBtn}
                onPress={() => void cancelDownload(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={15} color={COLORS.danger} />
                <Text style={styles.dangerActionText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : item.status === 'paused' ? (
            <>
              <TouchableOpacity
                testID="btn-resume-download"
                style={styles.primaryActionBtn}
                onPress={() => void resumeDownload(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={14} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="btn-cancel-download"
                style={styles.dangerActionBtn}
                onPress={() => void cancelDownload(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={15} color={COLORS.danger} />
                <Text style={styles.dangerActionText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : item.status === 'completed' ? (
            <>
              <TouchableOpacity
                testID="btn-share-download"
                style={styles.successActionBtn}
                onPress={() => void handleShare(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social" size={14} color={COLORS.success} />
                <Text style={styles.successActionText}>Share / Open</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={onOpenSaved}
                activeOpacity={0.8}
              >
                <Ionicons name="folder-open-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.secondaryActionText}>Saved Tab</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconOnlyBtn}
                onPress={() => removeQueueItem(item.id)}
                activeOpacity={0.75}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                testID="btn-retry-download"
                style={styles.primaryActionBtn}
                onPress={() => void retryDownload(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={14} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconOnlyBtn}
                onPress={() => removeQueueItem(item.id)}
                activeOpacity={0.75}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container} testID="screen-downloads">
      {/* Top Overview Panel */}
      <View style={styles.headerPanel}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.screenTitle}>Download Manager</Text>
            <Text style={styles.screenSubtitle}>
              {queue.nativeBackgroundSupported
                ? 'Native Background Service Active'
                : 'Live Transfer Queue & Telemetry'}
            </Text>
          </View>
          {hasFinishedItems ? (
            <TouchableOpacity
              testID="btn-clear-completed"
              style={styles.clearBtn}
              onPress={clearCompletedDownloads}
              activeOpacity={0.75}
            >
              <Ionicons name="sparkles-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.clearBtnText}>Clear Done</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ACTIVE</Text>
            <Text style={styles.statNumber} testID="downloads-active-count">
              {queue.activeCount}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>LIVE SPEED</Text>
            <Text style={styles.statSpeed} testID="downloads-total-speed">
              {formatSpeed(queue.totalSpeedBps)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>COMPLETED</Text>
            <Text style={styles.statNumber} testID="downloads-completed-count">
              {queue.completedCount}
            </Text>
          </View>
        </View>

        {notificationPermission !== 'granted' ? (
          <View style={styles.notifPrompt}>
            <Ionicons name="notifications-off-outline" size={16} color="#F59E0B" />
            <Text style={styles.notifPromptText}>
              Turn on alerts to monitor background progress in your status bar.
            </Text>
            <TouchableOpacity
              testID="downloads-enable-notif-btn"
              style={styles.notifPromptBtn}
              onPress={onRequestNotifications}
            >
              <Text style={styles.notifPromptBtnText}>Allow</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {queue.items.length === 0 ? (
        <View style={styles.emptyState} testID="downloads-empty-state">
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cloud-download-outline" size={32} color={COLORS.accentPrimary} />
          </View>
          <Text style={styles.emptyTitle}>No Active Downloads</Text>
          <Text style={styles.emptyDesc}>
            Start any video or MP3 download from the Home tab. Transfers continue reliably in the
            background with live speed and remaining MB tracking.
          </Text>
          <TouchableOpacity
            testID="downloads-go-home-btn"
            style={styles.emptyCtaBtn}
            onPress={onGoToHome}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={16} color="#FFFFFF" />
            <Text style={styles.emptyCtaText}>Paste Link on Home</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={queue.items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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
  headerPanel: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorderLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  clearBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.cardBorder,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 3,
  },
  statNumber: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  statSpeed: {
    color: COLORS.accentPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  notifPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  notifPromptText: {
    flex: 1,
    color: '#FDE68A',
    fontSize: 11.5,
    lineHeight: 16,
  },
  notifPromptBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  notifPromptBtnText: {
    color: '#080A0F',
    fontSize: 11.5,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorderLight,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.cardBgLight,
  },
  thumbFallback: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  metaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
    gap: 8,
  },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.cardBgLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  platformChipText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  itemTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressTrack: {
    height: 7,
    backgroundColor: COLORS.cardBgElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  telemetryGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 9,
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  telemetryCell: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryLabel: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  telemetryValue: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  telemetryValueAccent: {
    color: COLORS.accentPrimary,
    fontSize: 12.5,
    fontWeight: '800',
  },
  subTelemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  subTelemetryText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 11.5,
  },
  etaBadge: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: COLORS.cardBgLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.dangerSoft,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 10,
  },
  errorText: {
    flex: 1,
    color: '#FCA5A5',
    fontSize: 11.5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.accentPrimary,
    paddingVertical: 9,
    borderRadius: 10,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.cardBgLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorderLight,
    paddingVertical: 9,
    borderRadius: 10,
  },
  secondaryActionText: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  successActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.successSoft,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingVertical: 9,
    borderRadius: 10,
  },
  successActionText: {
    color: COLORS.success,
    fontSize: 12.5,
    fontWeight: '700',
  },
  dangerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.28)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  dangerActionText: {
    color: COLORS.danger,
    fontSize: 12.5,
    fontWeight: '700',
  },
  iconOnlyBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.cardBgLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accentPrimary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});

