import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import { MediaMetadata, QualityOption } from '../types';
import { useProStore } from '../store/useProStore';
import { requestRewardedUnlock } from '../services/ads/adManager';

interface MediaPreviewCardProps {
  media: MediaMetadata;
  onDownload: (option: QualityOption) => void;
  activeQueueCount?: number;
  onOpenDownloads?: () => void;
  defaultFormatTab?: 'video' | 'audio';
  onOpenProUpgrade?: () => void;
}

export const MediaPreviewCard: React.FC<MediaPreviewCardProps> = ({
  media,
  onDownload,
  activeQueueCount = 0,
  onOpenDownloads,
  defaultFormatTab,
  onOpenProUpgrade,
}) => {
  const pro = useProStore();
  const videoOptions = (media.qualityOptions || []).filter((o) => o.type === 'video');
  const audioOptions = (media.qualityOptions || []).filter((o) => o.type === 'audio');

  const preferredTab: 'video' | 'audio' =
    defaultFormatTab === 'audio' && audioOptions.length > 0
      ? 'audio'
      : videoOptions.length > 0
        ? 'video'
        : 'audio';

  const [activeFormatTab, setActiveFormatTab] = useState<'video' | 'audio'>(preferredTab);

  const [selectedOption, setSelectedOption] = useState<QualityOption>(
    (preferredTab === 'audio' ? audioOptions[0] : videoOptions[0]) ||
      media.qualityOptions?.[0] || {
        label: 'HD Video',
        url: media.videoUrl,
        type: 'video',
      }
  );

  useEffect(() => {
    if (media.qualityOptions && media.qualityOptions.length > 0) {
      const targetTab =
        defaultFormatTab === 'audio' && audioOptions.length > 0
          ? 'audio'
          : videoOptions.length > 0
            ? 'video'
            : 'audio';
      setActiveFormatTab(targetTab);
      if (targetTab === 'audio' && audioOptions.length > 0) {
        setSelectedOption(audioOptions[0]);
      } else {
        const defaultOpt =
          media.qualityOptions.find((o) => o.type === 'video') ||
          media.qualityOptions[0];
        setSelectedOption(defaultOpt);
      }
    }
  }, [media.id, media.originalUrl, media.qualityOptions, defaultFormatTab]);

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
      case 'youtube_music': {
        const isShorts =
          (media.originalUrl && media.originalUrl.includes('/shorts/')) ||
          (typeof media.duration === 'number' && media.duration > 0 && media.duration <= 60);
        return {
          name: 'YouTube',
          badgeText:
            selectedOption.type === 'audio'
              ? 'SONG / AUDIO'
              : isShorts
                ? 'SHORTS / HD'
                : 'VIDEO / HD',
          icon: <FontAwesome5 name="youtube" size={11} color={COLORS.accentPrimary} />,
        };
      }
      case 'pinterest':
        const isPhoto =
          selectedOption.fileExtension === '.jpg' ||
          selectedOption.fileExtension === '.png' ||
          selectedOption.url.includes('.jpg') ||
          selectedOption.url.includes('.png');
        return {
          name: 'Pinterest',
          badgeText: isPhoto ? 'PIN / PHOTO' : 'PIN / HD VIDEO',
          icon: <FontAwesome5 name="pinterest" size={11} color={COLORS.pinterest || '#E60023'} />,
        };
      default:
        return {
          name: 'Video',
          badgeText: 'HD STREAM',
          icon: <Feather name="video" size={11} color={COLORS.accentPrimary} />,
        };
    }
  };

  const getQualityBadgeMeta = (opt: QualityOption) => {
    const text = `${opt.quality || ''} ${opt.label || ''}`.toLowerCase();
    const ext = (opt.fileExtension || '').toLowerCase();
    const isAudio =
      opt.type === 'audio' ||
      ext === '.mp3' ||
      ext === '.m4a' ||
      text.includes('mp3') ||
      text.includes('m4a') ||
      text.includes('audio') ||
      text.includes('song');
    const isPhoto =
      opt.type === 'image' ||
      ext === '.jpg' ||
      ext === '.jpeg' ||
      ext === '.png' ||
      ext === '.webp' ||
      text.includes('photo') ||
      text.includes('image') ||
      text.includes('pin');

    if (isAudio) {
      return {
        badge: 'AUDIO',
        color: '#FF5E3A',
        bg: 'rgba(255, 94, 58, 0.16)',
        borderColor: 'rgba(255, 94, 58, 0.45)',
        icon: 'musical-notes' as const,
        desc: text.includes('320')
          ? '320kbps Studio MP3 Audio'
          : ext === '.m4a' || text.includes('m4a')
            ? 'Lossless M4A AAC Audio'
            : 'High Quality Audio Track',
      };
    }

    if (isPhoto) {
      const imgBadge = ext === '.png' ? 'PNG' : ext === '.webp' ? 'WEBP' : 'IMAGE';
      return {
        badge: imgBadge,
        color: '#EC4899',
        bg: 'rgba(236, 72, 153, 0.16)',
        borderColor: 'rgba(236, 72, 153, 0.45)',
        icon: 'image' as const,
        desc: 'Original Full-Resolution Master Photo',
      };
    }

    if (text.includes('4k') || text.includes('2160')) {
      return {
        badge: '4K',
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.16)',
        borderColor: 'rgba(245, 158, 11, 0.45)',
        icon: 'sparkles' as const,
        desc: 'Master 4K Ultra HD • Crystal Clear',
      };
    }
    if (text.includes('2k') || text.includes('1440')) {
      return {
        badge: '2K',
        color: '#06B6D4',
        bg: 'rgba(6, 182, 212, 0.16)',
        borderColor: 'rgba(6, 182, 212, 0.45)',
        icon: 'film' as const,
        desc: 'Crisp 1440p Quad HD • High Bitrate',
      };
    }
    if (text.includes('1080') || text.includes('full hd')) {
      return {
        badge: '1080P',
        color: '#3B82F6',
        bg: 'rgba(59, 130, 246, 0.16)',
        borderColor: 'rgba(59, 130, 246, 0.45)',
        icon: 'videocam' as const,
        desc:
          media.platform === 'tiktok'
            ? 'Original Quality • No Watermark'
            : 'Cinema 1080p • Most Popular',
      };
    }
    if (text.includes('480') || text.includes('480p')) {
      return {
        badge: '480P',
        color: '#38BDF8',
        bg: 'rgba(56, 189, 248, 0.16)',
        borderColor: 'rgba(56, 189, 248, 0.45)',
        icon: 'videocam-outline' as const,
        desc: 'Standard 480p • Fast & Light',
      };
    }
    if (text.includes('360') || text.includes('360p')) {
      return {
        badge: '360P',
        color: '#94A3B8',
        bg: 'rgba(148, 163, 184, 0.12)',
        borderColor: 'rgba(148, 163, 184, 0.3)',
        icon: 'videocam-outline' as const,
        desc: 'Fast 360p • Data Saver',
      };
    }
    if (text.includes('720') || text.includes('hd')) {
      return {
        badge: '720P',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.16)',
        borderColor: 'rgba(16, 185, 129, 0.45)',
        icon: 'videocam-outline' as const,
        desc:
          media.platform === 'tiktok'
            ? 'Original Quality • No Watermark'
            : 'Fast Download • Smooth Playback',
      };
    }
    return {
      badge: 'STD',
      color: '#94A3B8',
      bg: 'rgba(148, 163, 184, 0.12)',
      borderColor: 'rgba(148, 163, 184, 0.3)',
      icon: 'play-circle-outline' as const,
      desc: 'Standard Compatible Stream',
    };
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
        {videoOptions.length > 0 && audioOptions.length > 0 && (
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
                Songs / Audio ({audioOptions.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quality Options / Resolution Buttons */}
        {currentOptionsToShow && currentOptionsToShow.length > 0 && (
          <View style={styles.optionsSection}>
            <View style={styles.optionsHeaderRow}>
              <View style={styles.optionsHeaderLeft}>
                <Ionicons name="options-outline" size={13} color={COLORS.accentPrimary} />
                <Text style={styles.sectionLabel}>
                  {activeFormatTab === 'audio'
                    ? `Available Audio Streams (${currentOptionsToShow.length})`
                    : `Available Resolutions (${currentOptionsToShow.length})`}
                </Text>
              </View>
              {currentOptionsToShow.length > 1 && (
                <View style={styles.multiQualityBadge}>
                  <Ionicons name="sparkles" size={10} color={COLORS.accentPrimary} />
                  <Text style={styles.multiQualityBadgeText}>TAP TO SWITCH</Text>
                </View>
              )}
            </View>

            <View style={styles.qualityCardsContainer}>
              {currentOptionsToShow.map((opt, idx) => {
                const isSelected = selectedOption.url === opt.url;
                const badgeMeta = getQualityBadgeMeta(opt);
                const fileExt = (opt.fileExtension || (opt.type === 'audio' ? '.mp3' : '.mp4')).toUpperCase();

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.qualityCard,
                      isSelected && styles.qualityCardActive,
                      isSelected && { borderColor: badgeMeta.borderColor },
                    ]}
                    onPress={async () => {
                      try {
                        await Haptics.selectionAsync();
                      } catch (_) {}
                      setSelectedOption(opt);
                    }}
                    activeOpacity={0.75}
                  >
                    {/* Left: Resolution Badge */}
                    <View
                      style={[
                        styles.resBadgeBox,
                        { backgroundColor: badgeMeta.bg, borderColor: badgeMeta.borderColor },
                      ]}
                    >
                      <Ionicons name={badgeMeta.icon} size={12} color={badgeMeta.color} />
                      <Text style={[styles.resBadgeText, { color: badgeMeta.color }]}>
                        {badgeMeta.badge}
                      </Text>
                    </View>

                    {/* Middle: Title & Description */}
                    <View style={styles.qualityCardMiddle}>
                      <Text
                        style={[
                          styles.qualityCardTitle,
                          isSelected && styles.qualityCardTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {opt.label}
                      </Text>
                      <Text style={styles.qualityCardDesc} numberOfLines={1}>
                        {badgeMeta.desc}
                      </Text>
                    </View>

                    {/* Right: Extension chip + Selection Check */}
                    <View style={styles.qualityCardRight}>
                      {(badgeMeta.badge === '4K' ||
                        badgeMeta.badge === '2K' ||
                        (opt.label && opt.label.includes('320')) ||
                        (opt.quality && opt.quality.includes('320'))) &&
                        !pro.isPro && (
                          <View style={styles.vipPill}>
                            <Ionicons name="sparkles" size={9} color="#FFD700" />
                            <Text style={styles.vipPillText}>VIP</Text>
                          </View>
                        )}
                      <View style={styles.extChip}>
                        <Text style={styles.extChipText}>{fileExt}</Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleActive,
                          isSelected && { backgroundColor: COLORS.accentPrimary, borderColor: COLORS.accentPrimary },
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Primary Download Trigger Button */}
        <TouchableOpacity
          testID="start-download-btn"
          style={styles.downloadTouchWrapper}
          onPress={async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (_) {}

            const selectedBadge = getQualityBadgeMeta(selectedOption);
            const isVipStream =
              selectedBadge.badge === '4K' ||
              selectedBadge.badge === '2K' ||
              (selectedOption.label && selectedOption.label.includes('320')) ||
              (selectedOption.quality && selectedOption.quality.includes('320'));

            if (!pro.isPro && isVipStream) {
              Alert.alert(
                '⭐ VIP Stream Selected',
                `${selectedOption.quality || selectedOption.label} is an Ultra HD / Lossless stream.\n\nFree users can watch a short ad to unlock this download, or upgrade to OmniSaver PRO for instant 1-tap access forever!`,
                [
                  {
                    text: 'Watch Short Ad to Unlock',
                    onPress: async () => {
                      await requestRewardedUnlock('4k_download');
                      onDownload(selectedOption);
                    },
                  },
                  {
                    text: 'Upgrade to PRO (Rs. 750/mo)',
                    onPress: () => {
                      if (onOpenProUpgrade) onOpenProUpgrade();
                    },
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
              return;
            }

            onDownload(selectedOption);
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={COLORS.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.downloadBtnGradient}
          >
            <View style={styles.btnRow}>
              <Ionicons
                name={
                  selectedOption.type === 'audio' ||
                  selectedOption.fileExtension === '.m4a' ||
                  selectedOption.fileExtension === '.mp3'
                    ? 'musical-notes'
                    : selectedOption.type === 'image' ||
                        selectedOption.fileExtension === '.jpg' ||
                        selectedOption.fileExtension === '.png' ||
                        selectedOption.fileExtension === '.webp'
                      ? 'image'
                      : 'arrow-down-circle'
                }
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.btnText}>
                {(() => {
                  const isAudio =
                    selectedOption.type === 'audio' ||
                    selectedOption.fileExtension === '.m4a' ||
                    selectedOption.fileExtension === '.mp3';
                  const isM4a =
                    selectedOption.fileExtension === '.m4a' ||
                    selectedOption.url.includes('.m4a') ||
                    (selectedOption.label && selectedOption.label.toLowerCase().includes('m4a'));
                  const isImage =
                    selectedOption.type === 'image' ||
                    selectedOption.fileExtension === '.jpg' ||
                    selectedOption.fileExtension === '.png' ||
                    selectedOption.fileExtension === '.webp';

                  if (isAudio) {
                    return isM4a ? 'Download Song (M4A Audio)' : 'Download Song (MP3 Audio)';
                  }
                  if (isImage) {
                    return 'Download Image (HD Photo)';
                  }
                  if (media.platform === 'tiktok') {
                    return 'Download No Watermark';
                  }
                  return `Download ${selectedOption.quality ? selectedOption.quality + ' ' : ''}Video`;
                })()}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {activeQueueCount > 0 && onOpenDownloads && (
          <TouchableOpacity
            testID="preview-view-downloads-btn"
            style={styles.newBtn}
            onPress={onOpenDownloads}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-download-outline" size={15} color={COLORS.accentPrimary} />
            <Text style={styles.newBtnText}>
              View Active Downloads ({activeQueueCount})
            </Text>
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
    marginBottom: 20,
  },
  optionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  optionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  multiQualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 94, 58, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 94, 58, 0.25)',
  },
  multiQualityBadgeText: {
    fontSize: 9,
    color: COLORS.accentPrimary,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  qualityCardsContainer: {
    gap: 8,
  },
  qualityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBgLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  qualityCardActive: {
    backgroundColor: COLORS.cardBgElevated,
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  resBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 58,
    justifyContent: 'center',
  },
  resBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  qualityCardMiddle: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  qualityCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  qualityCardTitleActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  qualityCardDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  qualityCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  vipPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  extChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  extChipText: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  radioCircleActive: {
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
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
    borderColor: 'rgba(16, 185, 129, 0.25)',
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
  downloadTouchWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  downloadBtnGradient: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  downloadBtnDisabled: {
    backgroundColor: COLORS.cardBgLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
