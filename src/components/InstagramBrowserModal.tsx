import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { cleanInstagramMediaUrl } from '../services/api/extractor';

interface InstagramBrowserModalProps {
  visible: boolean;
  initialUrl: string;
  onClose: () => void;
  onVideoCaptured: (videoUrl: string, title?: string, poster?: string) => void;
}

export const InstagramBrowserModal: React.FC<InstagramBrowserModalProps> = ({
  visible,
  initialUrl,
  onClose,
  onVideoCaptured,
}) => {
  const webViewRef = useRef<any>(null);
  const [capturedVideoUrl, setCapturedVideoUrl] = useState<string | null>(null);
  const [capturedPoster, setCapturedPoster] = useState<string | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

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

      function report(url, poster) {
        if (!url) return;
        var finalUrl = cleanUrl(url);
        if (!finalUrl || window.__captured_url === finalUrl) return;
        if (finalUrl.indexOf('blob:') === 0 || finalUrl.indexOf('http') !== 0) return;
        if (finalUrl.indexOf('.mp4') === -1) return;
        window.__captured_url = finalUrl;
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'VIDEO_FOUND',
            url: finalUrl,
            poster: poster || ''
          }));
        } catch(e) {}
      }

      // 1. Intercept fetch (both request URLs for direct media chunks & JSON responses)
      var origFetch = window.fetch;
      if (origFetch) {
        window.fetch = async function(input, init) {
          try {
            var reqUrl = (typeof input === 'string') ? input : (input && input.url ? input.url : '');
            if (reqUrl && reqUrl.indexOf('.mp4') !== -1 && (reqUrl.indexOf('cdninstagram.com') !== -1 || reqUrl.indexOf('fbcdn.net') !== -1 || reqUrl.indexOf('instagram') !== -1)) {
              report(reqUrl, '');
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
                    report(candidate, '');
                    break;
                  }
                }
              }
            }
          } catch(e) {}
          return res;
        };
      }

      // 2. Intercept XMLHttpRequest (both open URL & text responses)
      var origOpen = XMLHttpRequest.prototype.open;
      var origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(method, url) {
        try {
          if (url && typeof url === 'string' && url.indexOf('.mp4') !== -1 && (url.indexOf('cdninstagram.com') !== -1 || url.indexOf('fbcdn.net') !== -1 || url.indexOf('instagram') !== -1)) {
            report(url, '');
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
                      report(candidate, '');
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

  // Injected JavaScript that detects HTML5 video playback & auto-dismisses login prompts
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

      function report(url, poster) {
        if (!url) return;
        var finalUrl = cleanUrl(url);
        if (!finalUrl || finalUrl.indexOf('.mp4') === -1) return;
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'VIDEO_FOUND',
            url: finalUrl,
            poster: poster || ''
          }));
        } catch(e) {}
      }

      function scanForVideos() {
        // 1. Performance Resource Timing API (Captures all video requests made by browser/MSE)
        try {
          if (window.performance && typeof window.performance.getEntriesByType === 'function') {
            var entries = window.performance.getEntriesByType('resource');
            for (var p = entries.length - 1; p >= 0; p--) {
              var entryName = entries[p].name;
              if (entryName && entryName.indexOf('.mp4') !== -1 && (entryName.indexOf('cdninstagram.com') !== -1 || entryName.indexOf('fbcdn.net') !== -1 || entryName.indexOf('instagram') !== -1)) {
                report(entryName, '');
                return;
              }
            }
          }
        } catch(e) {}

        // 2. Meta og:video
        var meta = document.querySelector('meta[property="og:video"]') ||
                   document.querySelector('meta[property="og:video:secure_url"]');
        if (meta && meta.content && meta.content.indexOf('http') === 0) {
          report(meta.content, '');
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
            report(src, v.poster || '');
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
                report(candidate, '');
                return;
              }
            }
          }
        }

        // 5. Force play HTML5 videos
        for (var vi = 0; vi < videos.length; vi++) {
          try {
            videos[vi].muted = true;
            videos[vi].play().catch(function(){});
          } catch(e) {}
        }

        // 6. Auto-click play buttons
        var clickables = document.querySelectorAll('[aria-label="Play"], [aria-label="play"], button[type="button"], .EmbeddedMedia, [role="button"]');
        for (var j = 0; j < clickables.length; j++) {
          try { clickables[j].click(); } catch(e) {}
        }

        // 7. Auto-dismiss login popups or overlays if present
        var dialogs = document.querySelectorAll('div[role="dialog"]');
        for (var k = 0; k < dialogs.length; k++) {
          try { dialogs[k].remove(); } catch(e) {}
        }
      }

      document.addEventListener('play', scanForVideos, true);
      document.addEventListener('loadeddata', scanForVideos, true);
      setInterval(scanForVideos, 350);
      scanForVideos();
    })();
    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'VIDEO_FOUND' && data.url) {
        const cleaned = cleanInstagramMediaUrl(data.url);
        if (cleaned && cleaned.startsWith('http')) {
          setCapturedVideoUrl(cleaned);
          if (data.poster) setCapturedPoster(data.poster);
          // Automatically deliver captured video to main screen and close modal
          setTimeout(() => {
            onVideoCaptured(cleaned, 'Instagram Video', data.poster || undefined);
            onClose();
          }, 350);
        }
      }
    } catch {
      // Ignore non-json messages
    }
  };

  const handleDownload = () => {
    if (capturedVideoUrl) {
      onVideoCaptured(capturedVideoUrl, 'Instagram Video', capturedPoster || undefined);
      onClose();
    }
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
              <Text style={styles.titleText}>Instagram Downloader Browser</Text>
            </View>
            <Text style={styles.subText} numberOfLines={1}>
              Works for all public & private videos (log in if private)
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
            userAgent:
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            style: styles.webView,
          })}
        </View>

        {/* Floating Capture Overlay Bar */}
        {capturedVideoUrl ? (
          <View style={styles.captureBar}>
            <View style={styles.captureInfo}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.accentPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.captureTitle}>Video Detected!</Text>
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
          <View style={styles.hintBar}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.hintText}>
              Play the video once. The download button will pop up automatically.
            </Text>
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
    marginHorizontal: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  pageLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#1A1423',
    gap: 8,
  },
  loaderText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  captureBar: {
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  captureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34D399',
  },
  captureSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  downloadCaptureBtn: {
    backgroundColor: COLORS.accentPrimary,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  downloadCaptureText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
