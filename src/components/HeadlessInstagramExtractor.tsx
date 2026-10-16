import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { extractInstagramShortcode } from '../services/api/extractor';

interface HeadlessInstagramExtractorProps {
  targetUrl: string | null;
  onSuccess: (videoUrl: string, title?: string, poster?: string) => void;
  onError: (errorMsg: string) => void;
  timeoutMs?: number;
}

export const HeadlessInstagramExtractor: React.FC<HeadlessInstagramExtractorProps> = ({
  targetUrl,
  onSuccess,
  onError,
  timeoutMs = 9500,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [hasResolved, setHasResolved] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  useEffect(() => {
    if (!targetUrl) {
      setActiveUrl(null);
      setHasResolved(false);
      setFallbackAttempted(false);
      return;
    }

    setHasResolved(false);
    setFallbackAttempted(false);

    const shortcode = extractInstagramShortcode(targetUrl);
    // Prefer lightweight embed URL first because it has zero login wall
    if (shortcode) {
      setActiveUrl(`https://www.instagram.com/reel/${shortcode}/embed/captioned/`);
    } else {
      setActiveUrl(targetUrl);
    }

    // If embed doesn't resolve in 4.5 seconds, fallback to canonical post URL
    const fallbackTimer = setTimeout(() => {
      if (!hasResolved && shortcode) {
        setFallbackAttempted(true);
        setActiveUrl(`https://www.instagram.com/reel/${shortcode}/`);
      }
    }, 4500);

    // Total timeout safety timer
    const totalTimer = setTimeout(() => {
      if (!hasResolved) {
        onError('Instagram video could not be resolved automatically (it may be age-restricted or private).');
      }
    }, timeoutMs);

    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(totalTimer);
    };
  }, [targetUrl]);

  const injectedBeforeContent = `
    (function() {
      window.__ig_captured = false;
      function report(url, poster, title) {
        if (!url || window.__ig_captured) return;
        if (url.indexOf('blob:') === 0 || url.indexOf('http') !== 0) return;
        window.__ig_captured = true;
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'VIDEO_FOUND',
            videoUrl: url,
            poster: poster || '',
            title: title || document.title || 'Instagram Video'
          }));
        } catch(e) {}
      }

      // Intercept fetch
      var origFetch = window.fetch;
      if (origFetch) {
        window.fetch = async function() {
          var res = await origFetch.apply(this, arguments);
          try {
            var clone = res.clone();
            var text = await clone.text();
            var matches = text.match(/https:\\/\\/[^"'\\s\\\\]+?\\.mp4[^"'\\s\\\\]*/g);
            if (matches && matches.length > 0) {
              report(matches[0].replace(/\\\\u0026/g, '&'), '', document.title);
            }
          } catch(e) {}
          return res;
        };
      }

      // Intercept XMLHttpRequest
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
              report(matches[0].replace(/\\\\u0026/g, '&'), '', document.title);
            }
          } catch(e) {}
        });
        return origSend.apply(this, arguments);
      };
    })();
    true;
  `;

  const injectedScript = `
    (function() {
      function scan() {
        if (window.__ig_captured) return;

        // 1. Meta tag check
        var meta = document.querySelector('meta[property="og:video"]') ||
                   document.querySelector('meta[property="og:video:secure_url"]');
        if (meta && meta.content && meta.content.indexOf('http') === 0) {
          window.__ig_captured = true;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'VIDEO_FOUND',
            videoUrl: meta.content,
            poster: '',
            title: document.title || 'Instagram Video'
          }));
          return;
        }

        // 2. Video elements
        var videos = document.querySelectorAll('video');
        for (var i = 0; i < videos.length; i++) {
          var v = videos[i];
          var src = v.currentSrc || v.src;
          if (!src && v.querySelector('source')) {
            src = v.querySelector('source').src;
          }
          if (src && src.indexOf('http') === 0 && src.indexOf('blob:') === -1) {
            window.__ig_captured = true;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'VIDEO_FOUND',
              videoUrl: src,
              poster: v.poster || '',
              title: document.title || 'Instagram Video'
            }));
            return;
          }
        }

        // 3. Auto-click play buttons
        var clickables = document.querySelectorAll('[aria-label="Play"], button[type="button"], .EmbeddedMedia, [role="button"]');
        for (var j = 0; j < clickables.length; j++) {
          try { clickables[j].click(); } catch(e) {}
        }

        // 4. Dismiss login overlays
        var dialogs = document.querySelectorAll('div[role="dialog"]');
        for (var k = 0; k < dialogs.length; k++) {
          try { dialogs[k].remove(); } catch(e) {}
        }
      }

      setInterval(scan, 600);
      scan();
      document.addEventListener('loadeddata', scan, true);
      document.addEventListener('play', scan, true);
    })();
    true;
  `;

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'VIDEO_FOUND' && data.videoUrl) {
        setHasResolved(true);
        onSuccess(data.videoUrl, data.title, data.poster);
      }
    } catch {
      // Ignore
    }
  };

  if (!activeUrl) {
    return null;
  }

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <WebView
        ref={webViewRef}
        source={{ uri: activeUrl }}
        injectedJavaScriptBeforeContentLoaded={injectedBeforeContent}
        injectedJavaScript={injectedScript}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        mixedContentMode="always"
        userAgent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
        onShouldStartLoadWithRequest={(request) => {
          const reqUrl = request.url.toLowerCase();
          if (reqUrl.startsWith('intent://') || reqUrl.startsWith('instagram://') || reqUrl.startsWith('market://')) {
            return false;
          }
          return true;
        }}
        style={styles.hiddenWebView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenContainer: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute',
    top: -500,
    left: -500,
  },
  hiddenWebView: {
    width: 1,
    height: 1,
  },
});
