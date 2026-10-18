import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import { MediaMetadata, QualityOption } from '../types';
import { DownloadProgressInfo } from '../services/download/downloadManager';

interface MediaPreviewCardProps {
  media: MediaMetadata;
  onDownload: (option: QualityOption) => void;
  isDownloading: boolean;
  downloadProgress: DownloadProgressInfo | null;
  savedLocalUri: string | null;
  onShare: (uri: string) => void;
  onReset: () => void;
}

export const MediaPreviewCard: React.FC<MediaPreviewCardProps> = ({
  media,
  onDownload,
  isDownloading,
  downloadProgress,
  savedLocalUri,
  onShare,
  onReset,
}) => {
  const videoOptions = (media.qualityOptions || []).filter((o) => o.type === 'video');
  const audioOptions = (media.qualityOptions || []).filter((o) => o.type === 'audio');

  const [activeFormatTab, setActiveFormatTab] = useState<'video' | 'audio'>(
    videoOptions.length > 0 ? 'video' : 'audio'
  );

  const [selectedOption, setSelectedOption] = useState<QualityOption>(
    media.qualityOptions?.find((o) => o.type === 'video') ||
      media.qualityOptions?.[0] || {
        label: 'HD Video',
        url: media.videoUrl,
        type: 'video',
      }
  );

  useEffect(() => {
    if (media.qualityOptions && media.qualityOptions.length > 0) {
      if (activeFormatTab === 'audio' && audioOptions.length > 0) {
        setSelectedOption(audioOptions[0]);
      } else {
        const defaultOpt =
          media.qualityOptions.find((o) => o.type === 'video') ||
          media.qualityOptions[0];
        setSelectedOption(defaultOpt);
      }
    }
  }, [media.id, media.originalUrl, media.qualityOptions]);

  const getPlatformMeta = () => {
    switch (media.platform) {
      case 'tiktok':
        return {
          name: 'TikTok',
          badgeText: 'NO WATERMARK',
          icon: <FontAwesome5 name="tiktok" size={11} color={COLORS.accentPrimary} />,
        };
      case 'instagram':
        return {
          name: 'Instagram',
          badgeText: 'REEL / POST',
          icon: <FontAwesome5 name="instagram" size={11} color={COLORS.accentPrimary} />,
        };
      case 'youtube':
      case 'youtube_music':
        return {
          name: 'YouTube',
          badgeText: selectedOption.type === 'audio' ? 'SONG / MP3' : 'SHORTS / HD',
          icon: <FontAwesome5 name="youtube" size={11} color={COLORS.accentPrimary} />,
        };
      default:
        return {
          name: 'Video',
          badgeText: 'HD STREAM',
          icon: <Feather name="video" size={11} color={COLORS.accentPrimary} />,
        };
    }
  };

  const meta = getPlatformMeta();
  const currentOptionsToShow =
    activeFormatTab === 'audio' ? (audioOptions.length > 0 ? audioOptions : media.qualityOptions) : (videoOptions.length > 0 ? videoOptions : media.qualityOptions);

  return (
    <View style={styles.card}>
      {/* Thumbnail + Overlays */}
      <View style={styles.thumbnailContainer}>
        {media.thumbnail ? (
          <Image
            source={{ uri: media.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderThumb]}>
            <Ionicons name="film-outline" size={40} color={COLORS.textMuted} />
          </View>
        )}

        {/* Platform Badge Overlay */}
        <View style={styles.platformBadge}>
          {meta.icon}
          <Text style={styles.platformBadgeText}>{meta.badgeText}</Text>
        </View>

        {/* Duration badge if exists */}
        {media.duration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {typeof media.duration === 'number'
                ? `${Math.floor(media.duration / 60)}:${(media.duration % 60).toString().padStart(2, '0')}`
                : media.duration}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {media.title || 'Untitled Video'}
        </Text>

        <View style={styles.authorRow}>
          {media.authorAvatar ? (
            <Image
              source={{ uri: media.authorAvatar }}
              style={styles.authorAvatar}
            />
          ) : (
            <View style={styles.authorAvatarFallback}>
              <Text style={styles.avatarLetter}>
                {media.author ? media.author[0].toUpperCase() : '@'}
              </Text>
            </View>
          )}
          <Text style={styles.authorName} numberOfLines={1}>
            {media.author || 'Creator'}
          </Text>
        </View>

        {/* Format Category Switcher (Video vs Audio / Song) */}
        {!savedLocalUri && videoOptions.length > 0 && audioOptions.length > 0 && (
          <View style={styles.formatSwitchContainer}>
            <TouchableOpacity
              style={[
                styles.formatTabBtn,
                activeFormatTab === 'video' && styles.formatTabBtnActive,
              ]}
              onPress={async () => {
                try {
                  await Haptics.selectionAsync();
                } catch (_) {}
                setActiveFormatTab('video');
                if (videoOptions.length > 0) setSelectedOption(videoOptions[0]);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="videocam"
                size={14}
                color={activeFormatTab === 'video' ? '#FFFFFF' : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.formatTabBtnText,
                  activeFormatTab === 'video' && styles.formatTabBtnTextActive,
                ]}
              >
                HD Video ({videoOptions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.formatTabBtn,
                activeFormatTab === 'audio' && styles.formatTabBtnActive,
              ]}
              onPress={async () => {
                try {
                  await Haptics.selectionAsync();
                } catch (_) {}
                setActiveFormatTab('audio');
                if (audioOptions.length > 0) setSelectedOption(audioOptions[0]);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="musical-notes"
                size={14}
                color={activeFormatTab === 'audio' ? '#FFFFFF' : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.formatTabBtnText,
                  activeFormatTab === 'audio' && styles.formatTabBtnTextActive,
                ]}
              >
                Songs / MP3 ({audioOptions.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quality Options / Resolution Buttons */}
        {currentOptionsToShow && currentOptionsToShow.length > 0 && !savedLocalUri && (
          <View style={styles.optionsSection}>
            <Text style={styles.sectionLabel}>
              {activeFormatTab === 'audio' ? 'Select Audio Bitrate / Quality:' : 'Select Video Resolution:'}
            </Text>
            <View style={styles.optionsRow}>
              {currentOptionsToShow.map((opt, idx) => {
                const isSelected = selectedOption.url === opt.url;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.optionChip,
                      isSelected && styles.optionChipActive,
                    ]}
                    onPress={async () => {
                      try {
                        await Haptics.selectionAsync();
                      } catch (_) {}
                      setSelectedOption(opt);
                    }}
                    disabled={isDownloading}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        isSelected
                          ? 'checkmark-circle'
                          : opt.type === 'audio'
                          ? 'musical-notes'
                          : 'videocam'
                      }
                      size={14}
                      color={isSelected ? COLORS.accentPrimary : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.optionChipText,
                        isSelected && styles.optionChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Download Progress Bar */}
        {isDownloading && downloadProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {downloadProgress.statusText ||
                  (selectedOption.type === 'audio'
                    ? 'Downloading Song (MP3)...'
                    : 'Downloading Video to Device...')}
              </Text>
              <Text style={styles.progressPercent}>{downloadProgress.percent}%</Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${downloadProgress.percent}%` },
                ]}
              />
            </View>

            {downloadProgress.totalBytesExpectedToWrite > 0 ? (
              <Text style={styles.progressBytes}>
                {(downloadProgress.totalBytesWritten / 1024 / 1024).toFixed(1)} MB of{' '}
                {(downloadProgress.totalBytesExpectedToWrite / 1024 / 1024).toFixed(1)} MB
              </Text>
            ) : (
              <Text style={styles.progressBytes}>
                {downloadProgress.statusText || 'Converting & preparing media...'}
              </Text>
            )}
          </View>
        )}

        {/* Post-Download Success Status */}
        {savedLocalUri && (
          <View style={styles.successBox}>
            <View style={styles.successRow}>
              <Ionicons
                name={selectedOption.type === 'audio' ? 'musical-notes' : 'checkmark-circle'}
                size={22}
                color={COLORS.success}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>
                  {selectedOption.type === 'audio' ? 'Song Downloaded! 🎵' : 'Download Complete!'}
                </Text>
                <Text style={styles.successSub}>
                  {selectedOption.type === 'audio'
                    ? 'Saved as MP3 in device & OmniSaver Songs'
                    : 'Saved to your Gallery & OmniSaver album'}
                </Text>
              </View>
            </View>

            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={() => onShare(savedLocalUri)}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={15} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>
                  {selectedOption.type === 'audio' ? 'Share Song' : 'Share'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.newBtn}
                onPress={onReset}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={15} color={COLORS.textPrimary} />
                <Text style={styles.newBtnText}>Download Another</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Primary Download Trigger Button */}
        {!savedLocalUri && (
          <TouchableOpacity
            style={[
              styles.downloadBtn,
              isDownloading && styles.downloadBtnDisabled,
            ]}
            onPress={() => onDownload(selectedOption)}
            disabled={isDownloading}
            activeOpacity={0.85}
          >
            {isDownloading ? (
              <View style={styles.btnRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.btnText}>
                  {selectedOption.type === 'audio'
                    ? 'Downloading Song MP3...'
                    : 'Downloading Video...'}
                </Text>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <Ionicons
                  name={
                    selectedOption.type === 'audio'
                      ? 'musical-notes'
                      : 'arrow-down-circle'
                  }
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.btnText}>
                  {selectedOption.type === 'audio'
                    ? 'Download Song (MP3 Audio) 🎵'
                    : media.platform === 'tiktok'
                    ? 'Download No Watermark (Gallery)'
                    : `Download ${selectedOption.quality ? selectedOption.quality + ' ' : ''}Video to Gallery`}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    marginHorizontal: 22,
    marginBottom: 24,
  },
  thumbnailContainer: {
    width: '100%',
    height: 210,
    backgroundColor: COLORS.cardBgLight,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 16, 16, 0.85)',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  platformBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(17, 16, 16, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  durationText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  authorAvatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cardBgLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  authorName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  formatSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBgLight,
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  formatTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
    gap: 7,
  },
  formatTabBtnActive: {
    backgroundColor: COLORS.accentPrimary,
  },
  formatTabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  formatTabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  optionsSection: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBgLight,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  optionChipActive: {
    borderColor: COLORS.accentPrimary,
    backgroundColor: COLORS.accentSoft,
  },
  optionChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  optionChipTextActive: {
    color: COLORS.textPrimary,
  },
  progressContainer: {
    marginBottom: 16,
    backgroundColor: COLORS.cardBgLight,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 12,
    color: COLORS.accentPrimary,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: COLORS.bg,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accentPrimary,
    borderRadius: 3,
  },
  progressBytes: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  successBox: {
    backgroundColor: COLORS.successSoft,
    borderWidth: 1,
    borderColor: 'rgba(124, 179, 104, 0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  successSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  successActions: {
    flexDirection: 'row',
    gap: 10,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 7,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  newBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBgLight,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 7,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  newBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  downloadBtn: {
    backgroundColor: COLORS.accentPrimary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtnDisabled: {
    backgroundColor: COLORS.cardBgLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
