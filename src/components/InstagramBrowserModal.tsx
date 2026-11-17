import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { cleanInstagramMediaUrl, extractInstagramViaSnapSave } from '../services/api/extractor';
import { useProStore } from '../store/useProStore';
import { requestRewardedUnlock } from '../services/ads/adManager';

interface InstagramBrowserModalProps {
  visible: boolean;
  initialUrl: string;
  onClose: () => void;
  onVideoCaptured: (videoUrl: string, title?: string, poster?: string) => void;
  onOpenProUpgrade?: () => void;
}

const MOBILE_CHROME_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

export const InstagramBrowserModal: React.FC<InstagramBrowserModalProps> = ({
  visible,
  initialUrl,
  onClose,
  onVideoCaptured,
  onOpenProUpgrade,
}) => {
  const pro = useProStore();
  const webViewRef = useRef<any>(null);
  const quickFetchTimeoutRef = useRef<any>(null);

  const [capturedVideoUrl, setCapturedVideoUrl] = useState<string | null>(null);
  const [capturedPoster, setCapturedPoster] = useState<string | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [currentBrowserUrl, setCurrentBrowserUrl] = useState<string>(
    initialUrl.trim().startsWith('http') ? initialUrl.trim() : 'https://www.instagram.com'
  );
  const [isQuickFetching, setIsQuickFetching] = useState(false);
  const [statusPrompt, setStatusPrompt] = useState('⚡ Download This Reel (Instant)');

  const attemptDeliverMedia = async (url: string, title?: string, poster?: string) => {
    const captureCheck = await pro.recordCapture();
    if (!captureCheck.allowed) {
      Alert.alert(
        'Daily Free Limit Reached',
        'Free users can capture 2 private videos per day in the in-app browser.\n\nWatch a short ad for an extra capture, or upgrade to OmniSaver PRO for unlimited private captures!',
        [
          {
            text: 'Watch Ad for +1 Capture',
            onPress: async () => {
              await requestRewardedUnlock('batch_download');
              onVideoCaptured(url, title || 'Instagram Media', poster);
              onClose();
            },
          },
          {
            text: 'Upgrade to PRO (Rs. 750/mo)',
            onPress: () => {
              onClose();
              if (onOpenProUpgrade) onOpenProUpgrade();
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    onVideoCaptured(url, title || 'Instagram Media', poster);
    onClose();
  };

  useEffect(() => {
    if (visible) {
      setCapturedVideoUrl(null);
      setCapturedPoster(null);
      setIsQuickFetching(false);
      setStatusPrompt('⚡ Download This Reel (Instant)');
      if (initialUrl.trim().startsWith('http')) {
        setCurrentBrowserUrl(initialUrl.trim());
      }
    } else {
      if (quickFetchTimeoutRef.current) {
        clearTimeout(quickFetchTimeoutRef.current);
        quickFetchTimeoutRef.current = null;
      }
    }
  }, [visible, initialUrl]);

  useEffect(() => {
    return () => {
      if (quickFetchTimeoutRef.current) {
        clearTimeout(quickFetchTimeoutRef.current);
      }
    };
  }, []);

  const injectedBeforeContent = `
    (function() {
      window.__captured_url = null;
      function cleanUrl(raw) {
        if (!raw) return '';
        var u = raw;
        u = u.replace(/\\\\\\//g, '/').replace(/\\\\\//g, '/').replace(/\\\//g, '/');
        u = u.replace(/\\\\u0026/g, '&').replace(/\\u0026/g, '&');
        u = u.replace(/&amp;/g, '&');
        u = u.replace(/["'\\\\]+$/, '');
        return u;
      }

      function report(url, poster, type) {
        if (!url) return;
        var finalUrl = cleanUrl(url);
        if (!finalUrl || window.__captured_url === finalUrl) return;
        if (finalUrl.indexOf('blob:') === 0 || finalUrl.indexOf('http') !== 0) return;
        window.__captured_url = finalUrl;
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: type || 'VIDEO_FOUND',
            url: finalUrl,
            poster: poster || ''
          }));
        } catch(e) {}
      }

      // 1. Intercept fetch for both video and high-res image requests
      var origFetch = window.fetch;
      if (origFetch) {
        window.fetch = async function(input, init) {
          try {
            var reqUrl = (typeof input === 'string') ? input : (input && input.url ? input.url : '');
            if (reqUrl && (reqUrl.indexOf('cdninstagram.com') !== -1 || reqUrl.indexOf('fbcdn.net') !== -1 || reqUrl.indexOf('instagram') !== -1)) {
              if (reqUrl.indexOf('.mp4') !== -1) {
                report(reqUrl, '', 'VIDEO_FOUND');
              }
            }
          } catch(e) {}

          var res = await origFetch.apply(this, arguments);
          try {
            var ct = res.headers && res.headers.get ? res.headers.get('content-type') : '';
            if (ct && (ct.indexOf('json') !== -1 || ct.indexOf('text') !== -1)) {
              var clone = res.clone();
              var text = await clone.text();
              var matches = text.match(/https?:[\\\\/]+[^"'\\s<>]+\.mp4[^"'\\s<>"]*/g);
              if (matches && matches.length > 0) {
                for (var m = 0; m < matches.length; m++) {
                  var candidate = cleanUrl(matches[m]);
                  if (candidate && candidate.indexOf('http') === 0 && candidate.indexOf('blob:') === -1) {
                    report(candidate, '', 'VIDEO_FOUND');
                    break;
                  }
                }
              }
            }
          } catch(e) {}
          return res;
        };
      }

      // 2. Intercept XMLHttpRequest
      var origOpen = XMLHttpRequest.prototype.open;
      var origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(method, url) {
        try {
          if (url && typeof url === 'string' && (url.indexOf('cdninstagram.com') !== -1 || url.indexOf('fbcdn.net') !== -1 || url.indexOf('instagram') !== -1)) {
            if (url.indexOf('.mp4') !== -1) {
              report(url, '', 'VIDEO_FOUND');
            }
          }
        } catch(e) {}
        return origOpen.apply(this, arguments);
      };

      XMLHttpRequest.prototype.send = function() {
        this.addEventListener('load', function() {
          try {
            if (this.responseType === '' || this.responseType === 'text') {
              var text = this.responseText;
              if (text && text.indexOf('.mp4') !== -1) {
                var matches = text.match(/https?:[\\\\/]+[^"'\\s<>]+\.mp4[^"'\\s<>"]*/g);
                if (matches && matches.length > 0) {
                  for (var m = 0; m < matches.length; m++) {
                    var candidate = cleanUrl(matches[m]);
                    if (candidate && candidate.indexOf('http') === 0 && candidate.indexOf('blob:') === -1) {
                      report(candidate, '', 'VIDEO_FOUND');
                      break;
                    }
                  }
                }
              }
            }
          } catch(e) {}
        });
        return origSend.apply(this, arguments);
      };
    })();
    true;
  `;

  // Injected JavaScript that detects HTML5 video playback, images, and auto-dismisses login prompts
  const injectedJS = `
    (function() {
      function cleanUrl(raw) {
        if (!raw) return '';
        var u = raw;
        u = u.replace(/\\\\\\//g, '/').replace(/\\\\\//g, '/').replace(/\\\//g, '/');
        u = u.replace(/\\\\u0026/g, '&').replace(/\\u0026/g, '&');
        u = u.replace(/&amp;/g, '&');
        u = u.replace(/["'\\\\]+$/, '');
        return u;
      }

      function report(url, poster, type) {
        if (!url) return;
        var finalUrl = cleanUrl(url);
        if (!finalUrl) return;
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: type || 'VIDEO_FOUND',
            url: finalUrl,
            poster: poster || ''
          }));
        } catch(e) {}
      }

      function scanForMedia() {
        // 1. Performance Resource Timing API
        try {
          if (window.performance && typeof window.performance.getEntriesByType === 'function') {
            var entries = window.performance.getEntriesByType('resource');
            for (var p = entries.length - 1; p >= 0; p--) {
              var entryName = entries[p].name;
              if (entryName && entryName.indexOf('.mp4') !== -1 && (entryName.indexOf('cdninstagram.com') !== -1 || entryName.indexOf('fbcdn.net') !== -1 || entryName.indexOf('instagram') !== -1)) {
                report(entryName, '', 'VIDEO_FOUND');
                return;
              }
            }
          }
        } catch(e) {}

        // 2. Meta og:video
        var meta = document.querySelector('meta[property="og:video"]') ||
                   document.querySelector('meta[property="og:video:secure_url"]');
        if (meta && meta.content && meta.content.indexOf('http') === 0) {
          report(meta.content, '', 'VIDEO_FOUND');
          return;
        }

        // 3. HTML5 <video> elements
        var videos = document.querySelectorAll('video');
        for (var i = 0; i < videos.length; i++) {
          var v = videos[i];
          var src = v.currentSrc || v.src;
          if (!src && v.querySelector('source')) {
            src = v.querySelector('source').src;
          }
          if (src && src.indexOf('http') === 0 && src.indexOf('blob:') === -1) {
            report(src, v.poster || '', 'VIDEO_FOUND');
            return;
          }
        }

        // 4. Scan HTML & Script tags for mp4 strings
        var docHtml = document.documentElement ? document.documentElement.innerHTML : '';
        if (docHtml && docHtml.indexOf('.mp4') !== -1) {
          var htmlMatches = docHtml.match(/https?:[\\/]+[^"'\\s<>]+\.mp4[^"'\\s<>"]*/g);
          if (htmlMatches && htmlMatches.length > 0) {
            for (var h = 0; h < htmlMatches.length; h++) {
              var candidate = cleanUrl(htmlMatches[h]);
              if (candidate && candidate.indexOf('http') === 0 && candidate.indexOf('blob:') === -1) {
                report(candidate, '', 'VIDEO_FOUND');
                return;
              }
            }
          }
        }

        // 5. If no video found, scan for main post image (photo posts)
        var postImgs = document.querySelectorAll('article img[src*="cdninstagram"], [role="presentation"] img[src*="cdninstagram"], img[src*="fbcdn"]');
        for (var pi = 0; pi < postImgs.length; pi++) {
          var imgUrl = postImgs[pi].src || postImgs[pi].currentSrc;
          if (imgUrl && imgUrl.indexOf('http') === 0 && imgUrl.indexOf('blob:') === -1 && postImgs[pi].naturalWidth > 300) {
            report(imgUrl, imgUrl, 'IMAGE_FOUND');
            return;
          }
        }

        // 6. Force play HTML5 videos
        for (var vi = 0; vi < videos.length; vi++) {
          try {
            videos[vi].muted = true;
            videos[vi].setAttribute('playsinline', '');
            videos[vi].play().catch(function(){});
          } catch(e) {}
        }

        // 7. Auto-click play buttons
        var clickables = document.querySelectorAll('[aria-label="Play"], [aria-label="play"], button[type="button"], .EmbeddedMedia, [role="button"]');
        for (var j = 0; j < clickables.length; j++) {
          try { clickables[j].click(); } catch(e) {}
        }

        // 8. Auto-dismiss login popups or overlays if present
        var dialogs = document.querySelectorAll('div[role="dialog"]');
        for (var k = 0; k < dialogs.length; k++) {
          try { dialogs[k].remove(); } catch(e) {}
        }
      }

      document.addEventListener('play', scanForMedia, true);
      document.addEventListener('playing', scanForMedia, true);
      document.addEventListener('loadeddata', scanForMedia, true);
      document.addEventListener('timeupdate', scanForMedia, true);
      setInterval(scanForMedia, 400);
      scanForMedia();
    })();
    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if ((data.type === 'VIDEO_FOUND' || data.type === 'IMAGE_FOUND') && data.url) {
        const cleaned = cleanInstagramMediaUrl(data.url);
        if (cleaned && cleaned.startsWith('http')) {
          if (quickFetchTimeoutRef.current) {
            clearTimeout(quickFetchTimeoutRef.current);
            quickFetchTimeoutRef.current = null;
          }
          setCapturedVideoUrl(cleaned);
          if (data.poster) setCapturedPoster(data.poster);
          // Automatically deliver captured media to main screen and close modal
          setTimeout(() => {
            void attemptDeliverMedia(cleaned, 'Instagram Media', data.poster || undefined);
          }, 350);
        }
      }
    } catch {
      // Ignore non-json messages
    }
  };

  const handleDownload = () => {
    if (capturedVideoUrl) {
      if (quickFetchTimeoutRef.current) {
        clearTimeout(quickFetchTimeoutRef.current);
        quickFetchTimeoutRef.current = null;
      }
      void attemptDeliverMedia(capturedVideoUrl, 'Instagram Media', capturedPoster || undefined);
    }
  };

  const handleQuickDownload = async () => {
    const target = currentBrowserUrl || initialUrl;
    setIsQuickFetching(true);
    setStatusPrompt('Resolving Video...');

    if (quickFetchTimeoutRef.current) {
      clearTimeout(quickFetchTimeoutRef.current);
    }
    // 15-second fallback timeout to prevent infinite hang
    quickFetchTimeoutRef.current = setTimeout(() => {
      setIsQuickFetching(false);
      setStatusPrompt('Tap Play on Video to Capture');
    }, 15000);

    try {
      const snapPromise = extractInstagramViaSnapSave(target);
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 10000)
      );
      const media = await Promise.race([snapPromise, timeoutPromise]);
      if (media && media.videoUrl) {
        if (quickFetchTimeoutRef.current) {
          clearTimeout(quickFetchTimeoutRef.current);
          quickFetchTimeoutRef.current = null;
        }
        setIsQuickFetching(false);
        void attemptDeliverMedia(media.videoUrl, media.title, media.thumbnail);
        return;
      }
    } catch (err: any) {
      console.warn('Quick extract in browser failed:', err?.message);
    }

    // Reset cleanly if resolution did not yield within quick timeout
    if (quickFetchTimeoutRef.current) {
      clearTimeout(quickFetchTimeoutRef.current);
      quickFetchTimeoutRef.current = null;
    }
    setIsQuickFetching(false);
    setStatusPrompt('Tap Play on Video to Capture');
  };

  const cleanUrl = initialUrl.trim().startsWith('http')
    ? initialUrl.trim()
    : 'https://www.instagram.com';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.safeArea}>
        {/* Browser Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.titleColumn}>
            <View style={styles.titleRow}>
              <FontAwesome5 name="instagram" size={14} color={COLORS.instagram} />
              <Text style={styles.titleText}>Instagram Downloader</Text>
              <View style={[styles.limitBadge, pro.isPro && styles.limitBadgePro]}>
                <Text style={[styles.limitBadgeText, pro.isPro && styles.limitBadgeTextPro]}>
                  {pro.isPro ? 'VIP UNLIMITED' : `${Math.max(0, 2 - pro.dailyFreePrivateCaptures)}/2 FREE`}
                </Text>
              </View>
            </View>
            <Text style={styles.subText} numberOfLines={1}>
              {pro.isPro ? 'VIP access • Unlimited in-app captures' : 'Free users get 2 private captures per day'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => webViewRef.current?.reload()}
            style={styles.iconBtn}
          >
            <Feather name="refresh-cw" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {isLoadingPage && (
          <View style={styles.pageLoader}>
            <ActivityIndicator size="small" color={COLORS.accentPrimary} />
            <Text style={styles.loaderText}>Loading Instagram Page...</Text>
          </View>
        )}

        {/* Embedded WebView */}
        <View style={styles.webViewContainer}>
          {React.createElement(WebView as any, {
            ref: webViewRef,
            source: { uri: cleanUrl },
            injectedJavaScriptBeforeContentLoaded: injectedBeforeContent,
            injectedJavaScript: injectedJS,
            onMessage: handleMessage,
            onNavigationStateChange: (navState: any) => {
              if (navState && navState.url && navState.url.startsWith('http')) {
                setCurrentBrowserUrl(navState.url);
              }
            },
            onLoadStart: () => setIsLoadingPage(true),
            onLoadEnd: () => setIsLoadingPage(false),
            onShouldStartLoadWithRequest: (request: any) => {
              const reqUrl = request.url.toLowerCase();
              // Prevent redirecting away to native Instagram app
              if (
                reqUrl.startsWith('intent://') ||
                reqUrl.startsWith('instagram://') ||
                reqUrl.startsWith('market://')
              ) {
                return false;
              }
              return true;
            },
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
            javaScriptEnabled: true,
            domStorageEnabled: true,
            sharedCookiesEnabled: true,
            thirdPartyCookiesEnabled: true,
            userAgent: MOBILE_CHROME_USER_AGENT,
            style: styles.webView,
          })}
        </View>

        {/* Floating Capture Overlay Bar */}
        {capturedVideoUrl ? (
          <View style={styles.captureBar}>
            <View style={styles.captureInfo}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.accentPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.captureTitle}>Media Detected!</Text>
                <Text style={styles.captureSubtitle}>
                  Ready to download in HD to your Gallery
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.downloadCaptureBtn}
              onPress={handleDownload}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-down-circle" size={17} color="#FFFFFF" />
              <Text style={styles.downloadCaptureText}>Download HD</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bottomBarContainer}>
            <TouchableOpacity
              style={[
                styles.quickExtractBtn,
                statusPrompt === 'Tap Play on Video to Capture' && styles.quickExtractBtnHint,
              ]}
              onPress={handleQuickDownload}
              disabled={isQuickFetching}
              activeOpacity={0.85}
            >
              {isQuickFetching ? (
                <View style={styles.btnRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.quickExtractText}>Resolving Video...</Text>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <Ionicons
                    name={statusPrompt.includes('Play') ? 'play-circle' : 'flash'}
                    size={16}
                    color={statusPrompt.includes('Play') ? '#38BDF8' : '#FFD700'}
                  />
                  <Text style={styles.quickExtractText}>{statusPrompt}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.hintBar}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.hintText}>
                {statusPrompt === 'Tap Play on Video to Capture'
                  ? 'Video is loading. Tap on the video to start playback.'
                  : 'Or play the video once for in-browser capture.'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) : 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  titleColumn: {
    flex: 1,
    paddingHorizontal: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  limitBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  limitBadgePro: {
    backgroundColor: 'rgba(255, 94, 58, 0.15)',
    borderColor: 'rgba(255, 94, 58, 0.4)',
  },
  limitBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  limitBadgeTextPro: {
    color: COLORS.accentPrimary,
  },
  subText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  pageLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: COLORS.cardBgLight,
    gap: 8,
  },
  loaderText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  webView: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  captureBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: 12,
  },
  captureInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  captureTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  captureSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  downloadCaptureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentPrimary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  downloadCaptureText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: 6,
  },
  quickExtractBtn: {
    backgroundColor: '#202637',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickExtractBtnHint: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickExtractText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  hintText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});
