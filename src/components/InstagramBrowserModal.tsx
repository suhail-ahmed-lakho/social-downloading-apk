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
  const webViewRef = useRef<WebView>(null);
  const [capturedVideoUrl, setCapturedVideoUrl] = useState<string | null>(null);
  const [capturedPoster, setCapturedPoster] = useState<string | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const injectedBeforeContent = `
    (function() {
      window.__captured_url = null;
      function report(url, poster) {
        if (!url || window.__captured_url === url) return;
        if (url.indexOf('blob:') === 0 || url.indexOf('http') !== 0) return;
        window.__captured_url = url;
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'VIDEO_FOUND',
            url: url,
            poster: poster || ''
          }));
        } catch(e) {}
      }

      var origFetch = window.fetch;
      if (origFetch) {
        window.fetch = async function() {
          var res = await origFetch.apply(this, arguments);
          try {
            var clone = res.clone();
            var text = await clone.text();
            var matches = text.match(/https:\\/\\/[^"'\\s\\\\]+?\\.mp4[^"'\\s\\\\]*/g);
            if (matches && matches.length > 0) {
              report(matches[0].replace(/\\\\u0026/g, '&'), '');
            }
          } catch(e) {}
          return res;
        };
      }

      var origOpen = XMLHttpRequest.prototype.open;
      var origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function() {
        return origOpen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function() {
        this.addEventListener('load', function() {
          try {
            var text = this.responseText;
            var matches = text.match(/https:\\/\\/[^"'\\s\\\\]+?\\.mp4[^"'\\s\\\\]*/g);
            if (matches && matches.length > 0) {
              report(matches[0].replace(/\\\\u0026/g, '&'), '');
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
      function scanForVideos() {
        // Meta og:video
        var meta = document.querySelector('meta[property="og:video"]') ||
                   document.querySelector('meta[property="og:video:secure_url"]');
        if (meta && meta.content && meta.content.indexOf('http') === 0) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'VIDEO_FOUND',
            url: meta.content,
            poster: ''
          }));
          return;
        }

        // HTML5 <video> elements
        var videos = document.querySelectorAll('video');
        for (var i = 0; i < videos.length; i++) {
          var v = videos[i];
          var src = v.currentSrc || v.src;
          if (!src && v.querySelector('source')) {
            src = v.querySelector('source').src;
          }
          if (src && src.indexOf('http') === 0 && src.indexOf('blob:') === -1) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'VIDEO_FOUND',
              url: src,
              poster: v.poster || ''
            }));
            return;
          }
        }

        // Auto-dismiss login popups or overlays if present
        var dialogs = document.querySelectorAll('div[role="dialog"]');
        for (var j = 0; j < dialogs.length; j++) {
          try { dialogs[j].remove(); } catch(e) {}
        }
      }

      document.addEventListener('play', scanForVideos, true);
      document.addEventListener('loadeddata', scanForVideos, true);
      setInterval(scanForVideos, 1000);
      scanForVideos();
    })();
    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'VIDEO_FOUND' && data.url) {
        setCapturedVideoUrl(data.url);
        if (data.poster) setCapturedPoster(data.poster);
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
          <WebView
            ref={webViewRef}
            source={{ uri: cleanUrl }}
            injectedJavaScriptBeforeContentLoaded={injectedBeforeContent}
            injectedJavaScript={injectedJS}
            onMessage={handleMessage}
            onLoadStart={() => setIsLoadingPage(true)}
            onLoadEnd={() => setIsLoadingPage(false)}
            onShouldStartLoadWithRequest={(request) => {
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
            }}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            style={styles.webView}
          />
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
