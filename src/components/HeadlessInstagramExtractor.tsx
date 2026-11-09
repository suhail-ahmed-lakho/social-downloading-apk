import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { extractInstagramShortcode, cleanInstagramMediaUrl } from '../services/api/extractor';

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
  timeoutMs = 8000,
}) => {
  const webViewRef = useRef<any>(null);
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
    // Start with canonical post/reel URL with desktop UA for full media hydration
    if (shortcode) {
      setActiveUrl(`https://www.instagram.com/reel/${shortcode}/`);
    } else {
      setActiveUrl(targetUrl);
    }

    // Fallback to embed URL if full page doesn't resolve in 3.5 seconds
    const fallbackTimer = setTimeout(() => {
      if (!hasResolved && shortcode) {
        setFallbackAttempted(true);
        setActiveUrl(`https://www.instagram.com/reel/${shortcode}/embed/`);
      }
    }, 3500);

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
      function cleanUrl(raw) {
        if (!raw) return '';
        var u = raw;
        u = u.replace(/\\\\\\//g, '/').replace(/\\\\\//g, '/');
        u = u.replace(/\\\\u0026/g, '&').replace(/\\u0026/g, '&');
        u = u.replace(/&amp;/g, '&');
        u = u.replace(/["'\\\\]+$/, '');
        return u;
      }

      function report(url, poster, title) {
        if (!url || window.__ig_captured) return;
        if (url.indexOf('blob:') === 0 || url.indexOf('http') !== 0) return;
        var finalUrl = cleanUrl(url);
        window.__ig_captured = true;
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'VIDEO_FOUND',
            videoUrl: finalUrl,
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
            var matches = text.match(/https?:[\\\\/]+[^"'\\s]+?\\.mp4[^"'\\s]*/g);
            if (matches && matches.length > 0) {
              for (var m = 0; m < matches.length; m++) {
                var candidate = cleanUrl(matches[m]);
                if (candidate && candidate.indexOf('http') === 0) {
                  report(candidate, '', document.title);
                  break;
                }
              }
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
            var matches = text.match(/https?:[\\\\/]+[^"'\\s]+?\\.mp4[^"'\\s]*/g);
            if (matches && matches.length > 0) {
              for (var m = 0; m < matches.length; m++) {
                var candidate = cleanUrl(matches[m]);
                if (candidate && candidate.indexOf('http') === 0) {
                  report(candidate, '', document.title);
                  break;
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

  const injectedScript = `
    (function() {
      function cleanUrl(raw) {
        if (!raw) return '';
        var u = raw;
        u = u.replace(/\\\\\\//g, '/').replace(/\\\\\//g, '/');
        u = u.replace(/\\\\u0026/g, '&').replace(/\\u0026/g, '&');
        u = u.replace(/&amp;/g, '&');
        u = u.replace(/["'\\\\]+$/, '');
        return u;
      }

      function scan() {
        if (window.__ig_captured) return;

        // 1. Meta tag check
        var meta = document.querySelector('meta[property="og:video"]') ||
                   document.querySelector('meta[property="og:video:secure_url"]');
        if (meta && meta.content && meta.content.indexOf('http') === 0) {
          window.__ig_captured = true;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'VIDEO_FOUND',
            videoUrl: cleanUrl(meta.content),
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
              videoUrl: cleanUrl(src),
              poster: v.poster || '',
              title: document.title || 'Instagram Video'
            }));
            return;
          }
        }

        // 3. Scan document HTML for direct mp4 links in script/JSON tags
        var docHtml = document.documentElement ? document.documentElement.innerHTML : '';
        if (docHtml) {
          var htmlMatches = docHtml.match(/https?:[\\/]+[^"'\\s<>]+\.mp4[^"'\\s<>"]*/g);
          if (htmlMatches && htmlMatches.length > 0) {
            for (var h = 0; h < htmlMatches.length; h++) {
              var candidate = cleanUrl(htmlMatches[h]);
              if (candidate && candidate.indexOf('http') === 0 && candidate.indexOf('blob:') === -1) {
                window.__ig_captured = true;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'VIDEO_FOUND',
                  videoUrl: candidate,
                  poster: '',
                  title: document.title || 'Instagram Video'
                }));
                return;
              }
            }
          }
        }

        // 4. Force HTML5 video playback
        var vList = document.querySelectorAll('video');
        for (var vi = 0; vi < vList.length; vi++) {
          try {
            vList[vi].muted = true;
            vList[vi].play().catch(function(){});
          } catch(e) {}
        }

        // 5. Auto-click play buttons
        var clickables = document.querySelectorAll('[aria-label="Play"], [aria-label="play"], button[type="button"], .EmbeddedMedia, [role="button"]');
        for (var j = 0; j < clickables.length; j++) {
          try { clickables[j].click(); } catch(e) {}
        }

        // 6. Dismiss login overlays
        var dialogs = document.querySelectorAll('div[role="dialog"]');
        for (var k = 0; k < dialogs.length; k++) {
          try { dialogs[k].remove(); } catch(e) {}
        }
      }

      setInterval(scan, 500);
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
        const cleaned = cleanInstagramMediaUrl(data.videoUrl);
        if (cleaned && cleaned.startsWith('http')) {
          setHasResolved(true);
          onSuccess(cleaned, data.title, data.poster);
        }
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
      {React.createElement(WebView as any, {
        ref: webViewRef,
        source: { uri: activeUrl },
        injectedJavaScriptBeforeContentLoaded: injectedBeforeContent,
        injectedJavaScript: injectedScript,
        onMessage: handleMessage,
        javaScriptEnabled: true,
        domStorageEnabled: true,
        sharedCookiesEnabled: true,
        thirdPartyCookiesEnabled: true,
        mediaPlaybackRequiresUserAction: false,
        allowsInlineMediaPlayback: true,
        mixedContentMode: 'always',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        onShouldStartLoadWithRequest: (request: any) => {
          const reqUrl = request.url.toLowerCase();
          if (
            reqUrl.startsWith('intent://') ||
            reqUrl.startsWith('instagram://') ||
            reqUrl.startsWith('market://')
          ) {
            return false;
          }
          return true;
        },
        style: styles.hiddenWebView,
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenContainer: {
    width: 360,
    height: 480,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -999,
    opacity: 0.01,
  },
  hiddenWebView: {
    width: 360,
    height: 480,
  },
});
