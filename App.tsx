import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  Image,
  LogBox,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

LogBox.ignoreLogs([
  'Due to changes in Androids permission requirements',
  'Due to changes in Android',
  "Can't open url:",
  "Can't open url: intent://",
  'SafeAreaView has been deprecated',
]);

import { Header } from './src/components/Header';
import { PlatformPills } from './src/components/PlatformPills';
import { UrlInputBar } from './src/components/UrlInputBar';
import { MediaPreviewCard } from './src/components/MediaPreviewCard';
import { HistoryList } from './src/components/HistoryList';
import { HowToUseModal } from './src/components/HowToUseModal';
import { InstagramBrowserModal } from './src/components/InstagramBrowserModal';
import { HeadlessInstagramExtractor } from './src/components/HeadlessInstagramExtractor';
import { OpeningSplashScreen } from './src/components/OpeningSplashScreen';
import { UpdateModal } from './src/components/UpdateModal';
import { COLORS } from './src/theme/colors';
import { MediaMetadata, PlatformType, QualityOption, DownloadHistoryItem } from './src/types';
import { extractMedia, InstagramRequiresBrowserError } from './src/services/api/extractor';
import {
  downloadAndSaveMedia,
  DownloadProgressInfo,
  shareDownloadedMedia,
  requestGalleryPermissions,
} from './src/services/download/downloadManager';
import {
  getDownloadHistory,
  addDownloadToHistory,
  deleteHistoryItem,
  clearAllHistory,
} from './src/services/storage/history';
import { getClipboardUrl } from './src/services/clipboard';
import {
  checkForAppUpdates,
  dismissUpdateVersion,
  UpdateCheckResult,
} from './src/services/update/updateChecker';
import { CURRENT_APP_VERSION } from './src/config/updateConfig';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'download' | 'history'>('download');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | 'all'>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<MediaMetadata | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgressInfo | null>(null);
  const [savedLocalUri, setSavedLocalUri] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<DownloadHistoryItem[]>([]);
  const [showHowToModal, setShowHowToModal] = useState(false);
  const [showInstagramBrowser, setShowInstagramBrowser] = useState(false);
  const [headlessInstagramUrl, setHeadlessInstagramUrl] = useState<string | null>(null);
  const [browserInitialUrl, setBrowserInitialUrl] = useState('https://www.instagram.com');
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [clipboardBanner, setClipboardBanner] = useState<{
    text: string;
    platform: string;
  } | null>(null);

  // Load history on mount
  useEffect(() => {
    loadHistory();
    checkClipboard();
    // Auto-check for update after splash screen initializes
    const updateTimer = setTimeout(() => {
      handleCheckForUpdates(false);
    }, 2000);
    return () => clearTimeout(updateTimer);
  }, []);

  const loadHistory = async () => {
    const list = await getDownloadHistory();
    setHistoryItems(list);
  };

  const checkClipboard = async () => {
    const clip = await getClipboardUrl();
    if (clip && clip.isValidMedia && clip.text !== url) {
      setClipboardBanner({ text: clip.text, platform: clip.platform });
    }
  };

  const handleApplyClipboard = () => {
    if (clipboardBanner) {
      const target = clipboardBanner.text;
      setUrl(target);
      setClipboardBanner(null);
      handleFetchMedia(target);
    }
  };

  const handleFetchMedia = async (targetUrlToFetch?: string) => {
    const raw = typeof targetUrlToFetch === 'string' ? targetUrlToFetch : url;
    const trimmed = raw.trim();
    if (!trimmed) {
      Alert.alert('Empty Link', 'Please paste a TikTok, Instagram, or YouTube link first.');
      return;
    }

    setIsAnalyzing(true);
    setCurrentMedia(null);
    setSavedLocalUri(null);
    setDownloadProgress(null);

    // If Instagram link, automatically extract in background WITHOUT login or signup
    if (trimmed.includes('instagram.com') || trimmed.includes('instagr.am')) {
      setBrowserInitialUrl(trimmed);
      setHeadlessInstagramUrl(trimmed);
      return;
    }

    try {
      const media = await extractMedia(trimmed);
      setCurrentMedia(media);
    } catch (err: any) {
      if (err instanceof InstagramRequiresBrowserError || err.isInstagramLoginRequired) {
        setBrowserInitialUrl(trimmed);
        Alert.alert(
          'Instagram Reel Detected 📸',
          'Instagram blocks external servers. Would you like to open it in the built-in browser to capture & download this video (works for both public & private)?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open in Browser',
              onPress: () => setShowInstagramBrowser(true),
            },
          ]
        );
      } else {
        Alert.alert(
          'Extraction Error',
          err.message || 'Unable to fetch video details. Please verify the link is active.'
        );
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleHeadlessInstagramSuccess = (videoUrl: string, title?: string, poster?: string) => {
    setIsAnalyzing(false);
    setHeadlessInstagramUrl(null);
    handleCapturedInstagramVideo(videoUrl, title, poster);
  };

  const handleHeadlessInstagramError = (errorMsg: string) => {
    setIsAnalyzing(false);
    setHeadlessInstagramUrl(null);
    Alert.alert(
      'Instagram Private or Restricted 📸',
      'This Reel could not be resolved automatically (it may be age-restricted or from a private account). Would you like to view it in the built-in browser?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open in Browser',
          onPress: () => setShowInstagramBrowser(true),
        },
      ]
    );
  };

  const handleCapturedInstagramVideo = (videoUrl: string, title?: string, poster?: string) => {
    const media: MediaMetadata = {
      id: String(Date.now()),
      platform: 'instagram',
      title: title || 'Instagram Video (No Login)',
      author: 'Instagram Creator',
      thumbnail: poster || '',
      videoUrl: videoUrl,
      originalUrl: browserInitialUrl || url,
      qualityOptions: [
        {
          label: 'HD Video (No Watermark)',
          url: videoUrl,
          type: 'video',
          quality: '1080p HD',
        },
      ],
    };

    setCurrentMedia(media);
    setSavedLocalUri(null);
    setDownloadProgress(null);
  };

  const handleDownload = async (option: QualityOption) => {
    if (!currentMedia) return;

    // Check permission upfront
    await requestGalleryPermissions();

    setIsDownloading(true);
    setDownloadProgress({ percent: 0, totalBytesWritten: 0, totalBytesExpectedToWrite: 0 });

    try {
      const isAudio = option.type === 'audio';
      const cleanTitle = (currentMedia.title || 'video')
        .slice(0, 30)
        .replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${currentMedia.platform.toUpperCase()}_${cleanTitle}_${Date.now()}`;

      const result = await downloadAndSaveMedia({
        url: option.url,
        filename,
        isAudio,
        originalUrl: currentMedia.originalUrl || url,
        onProgress: (info) => {
          setDownloadProgress(info);
        },
      });

      setSavedLocalUri(result.localUri);

      // Save to persistent history
      const historyItem: DownloadHistoryItem = {
        id: String(Date.now()),
        platform: currentMedia.platform,
        title: currentMedia.title || 'Untitled Video',
        author: currentMedia.author || 'Creator',
        thumbnail: currentMedia.thumbnail,
        localUri: result.localUri,
        originalUrl: currentMedia.originalUrl,
        fileSize: result.fileSize,
        createdAt: Date.now(),
      };

      const updated = await addDownloadToHistory(historyItem);
      setHistoryItems(updated);

      if (isAudio) {
        Alert.alert(
          'Song Downloaded! 🎵',
          'Your MP3 audio has been saved to your device & OmniSaver Songs album.'
        );
      } else if (result.savedToGallery) {
        Alert.alert(
          'Saved to Gallery! 🎉',
          'Your video has been downloaded and added to your Photos & OmniSaver album.'
        );
      } else {
        Alert.alert(
          'Download Complete',
          'Media saved to your device. You can share it directly or view it in the Saved Files tab.'
        );
      }
    } catch (err: any) {
      Alert.alert('Download Error', err.message || 'Failed to download the file.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCheckForUpdates = async (isManual: boolean = false) => {
    try {
      const res = await checkForAppUpdates(isManual);
      if (res.hasUpdate) {
        setUpdateInfo(res);
        setShowUpdateModal(true);
      } else if (isManual) {
        Alert.alert(
          'OmniSaver Up to Date',
          `You are using the latest version (v${CURRENT_APP_VERSION}) by Lakho's team.`
        );
      }
    } catch (err: any) {
      if (isManual) {
        Alert.alert('Update Check', err?.message || 'Could not connect to update service. Please verify your connection.');
      }
    }
  };

  const handleDismissUpdate = async (version: string) => {
    await dismissUpdateVersion(version);
    setShowUpdateModal(false);
  };

  const handleShare = async (localUri: string) => {
    try {
      await shareDownloadedMedia(localUri);
    } catch (err: any) {
      Alert.alert('Share Error', err.message || 'Could not share the file.');
    }
  };

  const handleDeleteHistory = async (id: string) => {
    const updated = await deleteHistoryItem(id);
    setHistoryItems(updated);
  };

  const handleClearAllHistory = async () => {
    await clearAllHistory();
    setHistoryItems([]);
  };

  const handleResetCard = () => {
    setCurrentMedia(null);
    setSavedLocalUri(null);
    setDownloadProgress(null);
    setUrl('');
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Opening Splash Animation */}
      {showSplash && (
        <OpeningSplashScreen onAnimationFinish={() => setShowSplash(false)} />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        {/* Top Header & Navigation Tabs */}
        <Header
          onOpenHowTo={() => setShowHowToModal(true)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          historyCount={historyItems.length}
          hasUpdate={!!updateInfo?.hasUpdate}
          onOpenUpdate={() => handleCheckForUpdates(true)}
        />

        {/* Floating Clipboard Detection Toast */}
        {clipboardBanner && activeTab === 'download' && (
          <TouchableOpacity
            style={styles.clipboardBanner}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleApplyClipboard();
            }}
            activeOpacity={0.88}
          >
            <View style={styles.clipLeft}>
              <View style={styles.clipIconCircle}>
                <Ionicons name="link-outline" size={16} color={COLORS.accentPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.clipTagRow}>
                  <Text style={styles.clipTag}>{clipboardBanner.platform.toUpperCase()}</Text>
                  <Text style={styles.clipTitle}>Link Detected</Text>
                </View>
                <Text style={styles.clipSub} numberOfLines={1}>
                  {clipboardBanner.text}
                </Text>
              </View>
            </View>
            <LinearGradient
              colors={COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.clipActionGradient}
            >
              <Ionicons name="arrow-down-circle-outline" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.clipActionText}>Paste & Fetch</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {activeTab === 'download' ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Filter / Platform Selector Chips */}
            <PlatformPills
              selectedPlatform={selectedPlatform}
              onSelect={setSelectedPlatform}
            />

            {/* URL Input Bar & Instant Paste */}
            <UrlInputBar
              url={url}
              onChangeUrl={setUrl}
              onSubmit={handleFetchMedia}
              isLoading={isAnalyzing}
            />

            {/* Dedicated Instagram In-App Browser Action Button */}
            <TouchableOpacity
              style={styles.instagramBrowserBanner}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setBrowserInitialUrl(url.trim() || 'https://www.instagram.com');
                setShowInstagramBrowser(true);
              }}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#171B28', '#101420']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.instagramCardGradient}
              >
                <LinearGradient
                  colors={COLORS.instagramGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.igIconBox}
                >
                  <FontAwesome5 name="instagram" size={18} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <View style={styles.igHeaderRow}>
                    <Text style={styles.igBannerTitle}>Instagram In-App Browser</Text>
                    <View style={styles.igBadge}>
                      <Text style={styles.igBadgeText}>PRO</Text>
                    </View>
                  </View>
                  <Text style={styles.igBannerSub}>
                    Browse, watch & capture private reels or stories in 1 tap
                  </Text>
                </View>
                <View style={styles.igArrowCircle}>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Media Result & Download Card */}
            {currentMedia && (
              <MediaPreviewCard
                media={currentMedia}
                onDownload={handleDownload}
                isDownloading={isDownloading}
                downloadProgress={downloadProgress}
                savedLocalUri={savedLocalUri}
                onShare={handleShare}
                onReset={handleResetCard}
              />
            )}

            {/* Quick Engine Capabilities Grid */}
            {!currentMedia && (
              <View style={styles.capabilitiesContainer}>
                <View style={styles.capabilitiesRow}>
                  <View style={styles.capabilityBadge}>
                    <Ionicons name="film-outline" size={15} color={COLORS.accentPrimary} />
                    <Text style={styles.capabilityText}>4K & 1080p Ultra HD</Text>
                  </View>
                  <View style={styles.capabilityBadge}>
                    <Ionicons name="musical-notes-outline" size={15} color="#38BDF8" />
                    <Text style={styles.capabilityText}>320k Lossless MP3</Text>
                  </View>
                </View>
                <View style={styles.capabilitiesRow}>
                  <View style={styles.capabilityBadge}>
                    <Ionicons name="shield-checkmark-outline" size={15} color="#10B981" />
                    <Text style={styles.capabilityText}>Zero Watermarks</Text>
                  </View>
                  <View style={styles.capabilityBadge}>
                    <Ionicons name="images-outline" size={15} color="#F59E0B" />
                    <Text style={styles.capabilityText}>Instant Gallery Sync</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Recent Downloads Horizontal Carousel */}
            {!currentMedia && historyItems.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="time-outline" size={15} color={COLORS.accentPrimary} />
                    <Text style={styles.sectionTitle}>RECENT DOWNLOADS</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setActiveTab('history');
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.seeAllText}>See All ({historyItems.length}) ›</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentCarousel}
                >
                  {historyItems.slice(0, 5).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.recentCard}
                      activeOpacity={0.82}
                      onPress={() => {
                        Haptics.selectionAsync();
                        handleShare(item.localUri);
                      }}
                    >
                      {item.thumbnail ? (
                        <Image source={{ uri: item.thumbnail }} style={styles.recentThumb} />
                      ) : (
                        <View style={[styles.recentThumb, styles.recentThumbPlaceholder]}>
                          <Ionicons
                            name={item.platform === 'youtube' ? 'logo-youtube' : item.platform === 'tiktok' ? 'videocam' : 'camera'}
                            size={20}
                            color={COLORS.textMuted}
                          />
                        </View>
                      )}
                      <View style={styles.recentCardInfo}>
                        <View style={styles.recentPlatformBadge}>
                          <Text style={styles.recentPlatformText}>{item.platform.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.recentTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                      </View>
                      <View style={styles.recentShareBtn}>
                        <Ionicons name="share-social-outline" size={13} color={COLORS.textPrimary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Platform Quick Guides Showcase */}
            {!currentMedia && (
              <View style={styles.platformShowcase}>
                <View style={styles.showcaseCard}>
                  <View style={[styles.showcaseIconWrap, { backgroundColor: 'rgba(255, 0, 0, 0.12)', borderColor: 'rgba(255, 0, 0, 0.25)' }]}>
                    <Ionicons name="logo-youtube" size={18} color="#FF0000" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.showcaseTitle}>YouTube & Shorts</Text>
                    <Text style={styles.showcaseSub}>
                      Extract 1080p/720p MP4 or convert audio to 320kbps MP3 directly
                    </Text>
                  </View>
                </View>

                <View style={styles.showcaseCard}>
                  <View style={[styles.showcaseIconWrap, { backgroundColor: 'rgba(0, 242, 254, 0.12)', borderColor: 'rgba(0, 242, 254, 0.25)' }]}>
                    <Ionicons name="videocam-outline" size={18} color={COLORS.tiktokCyan} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.showcaseTitle}>TikTok (Clean HD)</Text>
                    <Text style={styles.showcaseSub}>
                      Clean video extraction with author watermark removed automatically
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          <HistoryList
            items={historyItems}
            onShare={handleShare}
            onDelete={handleDeleteHistory}
            onClearAll={handleClearAllHistory}
          />
        )}

        {/* How To Use Modal */}
        <HowToUseModal
          visible={showHowToModal}
          onClose={() => setShowHowToModal(false)}
          onCheckUpdates={() => handleCheckForUpdates(true)}
        />

        {/* In-App Update Modal (Popup when update is available) */}
        <UpdateModal
          visible={showUpdateModal}
          updateInfo={updateInfo}
          onClose={() => setShowUpdateModal(false)}
          onDismissUpdate={handleDismissUpdate}
        />

        {/* In-App Instagram Downloader Browser Modal (Optional Fallback) */}
        <InstagramBrowserModal
          visible={showInstagramBrowser}
          initialUrl={browserInitialUrl}
          onClose={() => setShowInstagramBrowser(false)}
          onVideoCaptured={handleCapturedInstagramVideo}
        />

        {/* Background Headless Instagram Extractor (1-Tap Direct Download - No Login / Signup) */}
        <HeadlessInstagramExtractor
          targetUrl={headlessInstagramUrl}
          onSuccess={handleHeadlessInstagramSuccess}
          onError={handleHeadlessInstagramError}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 20) : 44,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  clipboardBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#121624',
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  clipIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clipTag: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentPrimary,
    letterSpacing: 0.5,
  },
  clipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  clipSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  clipActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  clipActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  instagramBrowserBanner: {
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  instagramCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  igIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  igHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  igBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  igBadge: {
    backgroundColor: 'rgba(245, 133, 41, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  igBadgeText: {
    color: '#F58529',
    fontSize: 9,
    fontWeight: '800',
  },
  igBannerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  igArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capabilitiesContainer: {
    marginHorizontal: 20,
    marginBottom: 18,
    gap: 8,
  },
  capabilitiesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  capabilityBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  capabilityText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  recentSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentPrimary,
  },
  recentCarousel: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 12,
  },
  recentCard: {
    width: 170,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  recentThumb: {
    width: '100%',
    height: 96,
    backgroundColor: COLORS.surface,
  },
  recentThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentCardInfo: {
    padding: 10,
  },
  recentPlatformBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  recentPlatformText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '800',
  },
  recentTitle: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  recentShareBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformShowcase: {
    paddingHorizontal: 20,
    gap: 10,
  },
  showcaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  showcaseIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showcaseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  showcaseSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
