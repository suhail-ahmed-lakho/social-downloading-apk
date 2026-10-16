import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  LogBox,
} from 'react-native';

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
          'OmniSaver Up to Date ✨',
          `You are using the latest version (v${CURRENT_APP_VERSION}) by Lakho's team.`
        );
      }
    } catch (_) {
      if (isManual) {
        Alert.alert('Update Check', 'Could not connect to update service. Please verify your connection.');
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

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
            onPress={handleApplyClipboard}
            activeOpacity={0.8}
          >
            <View style={styles.clipLeft}>
              <Ionicons name="link-outline" size={18} color={COLORS.accentPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.clipTitle}>
                  {clipboardBanner.platform.toUpperCase()} Link Detected
                </Text>
                <Text style={styles.clipSub} numberOfLines={1}>
                  {clipboardBanner.text}
                </Text>
              </View>
            </View>
            <View style={styles.clipAction}>
              <Text style={styles.clipActionText}>Paste & Fetch</Text>
            </View>
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
                setBrowserInitialUrl(url.trim() || 'https://www.instagram.com');
                setShowInstagramBrowser(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.instagramCardContent}>
                <View style={styles.igIconBox}>
                  <FontAwesome5 name="instagram" size={17} color={COLORS.accentPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.igBannerTitle}>Instagram Downloader Browser</Text>
                  <Text style={styles.igBannerSub}>
                    Download Public & Private Reels or Posts with 1 tap
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </View>
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

            {/* Feature Highlights Grid */}
            {!currentMedia && (
              <View style={styles.featureGrid}>
                <View style={styles.featureCard}>
                  <View style={styles.featureIconCircle}>
                    <Ionicons name="musical-notes" size={18} color={COLORS.accentPrimary} />
                  </View>
                  <Text style={styles.featureTitle}>YouTube Songs & MP3</Text>
                  <Text style={styles.featureDesc}>
                    High-speed audio extraction for YouTube tracks & music in original HQ quality.
                  </Text>
                </View>

                <View style={styles.featureCard}>
                  <View style={styles.featureIconCircle}>
                    <Ionicons name="play-circle-outline" size={18} color={COLORS.accentPrimary} />
                  </View>
                  <Text style={styles.featureTitle}>YouTube Shorts & HD</Text>
                  <Text style={styles.featureDesc}>
                    Direct 1080p Full HD & 720p resolution downloads for Shorts and Videos.
                  </Text>
                </View>

                <View style={styles.featureCard}>
                  <View style={styles.featureIconCircle}>
                    <Ionicons name="water-outline" size={18} color={COLORS.accentPrimary} />
                  </View>
                  <Text style={styles.featureTitle}>TikTok (No Watermark)</Text>
                  <Text style={styles.featureDesc}>
                    Crystal-clear downloads without creator watermark directly to Photos.
                  </Text>
                </View>

                <View style={styles.featureCard}>
                  <View style={styles.featureIconCircle}>
                    <Ionicons name="film-outline" size={18} color={COLORS.accentPrimary} />
                  </View>
                  <Text style={styles.featureTitle}>Instagram Public & Private</Text>
                  <Text style={styles.featureDesc}>
                    In-app browser captures any video or reel directly to Gallery.
                  </Text>
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) : 44,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  clipboardBanner: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: 12,
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
  clipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentPrimary,
  },
  clipSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  clipAction: {
    backgroundColor: COLORS.accentPrimary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
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
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  instagramCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  igIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  igBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  igBannerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  featureGrid: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  featureCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  featureIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
