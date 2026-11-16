import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppLogo } from './AppLogo';
import { COLORS } from '../theme/colors';
import { CURRENT_APP_VERSION } from '../config/updateConfig';

interface OpeningSplashScreenProps {
  onAnimationFinish: () => void;
}

export const OpeningSplashScreen: React.FC<OpeningSplashScreenProps> = ({
  onAnimationFinish,
}) => {
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  const glowScale = useRef(new Animated.Value(0.6)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(14)).current;

  const chipsOpacity = useRef(new Animated.Value(0)).current;
  const chipsTranslateY = useRef(new Animated.Value(12)).current;

  const loaderWidth = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

  const [statusText, setStatusText] = useState('BOOTING ENGINES...');

  useEffect(() => {
    const useNative = Platform.OS !== 'web';

    // Initial tactile feedback
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}

    // 1. Glowing ambient pulse behind logo
    Animated.parallel([
      Animated.timing(glowOpacity, {
        toValue: 0.5,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: useNative,
      }),
      Animated.spring(glowScale, {
        toValue: 1.15,
        friction: 5,
        tension: 40,
        useNativeDriver: useNative,
      }),
    ]).start();

    // 2. Logo entrance with spring bounce & subtle rotation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 70,
        useNativeDriver: useNative,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: useNative,
      }),
    ]).start();

    // 3. Title & Tagline entrance
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 350,
        delay: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: useNative,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 350,
        delay: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: useNative,
      }),
    ]).start();

    // 4. Platform floating chips entrance
    Animated.parallel([
      Animated.timing(chipsOpacity, {
        toValue: 1,
        duration: 380,
        delay: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      }),
      Animated.timing(chipsTranslateY, {
        toValue: 0,
        duration: 380,
        delay: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      }),
    ]).start();

    // 5. High-speed progress bar
    Animated.timing(loaderWidth, {
      toValue: 1,
      duration: 850,
      delay: 200,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false, // width needs layout
    }).start();

    const textSwitchTimer = setTimeout(() => {
      setStatusText('ULTRA SPEED READY');
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_) {}
    }, 600);

    // 6. Cinematic zoom & fade transition to main app
    const exitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: useNative,
        }),
        Animated.timing(screenScale, {
          toValue: 1.05,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: useNative,
        }),
      ]).start(() => {
        onAnimationFinish();
      });
    }, 1150);

    return () => {
      clearTimeout(textSwitchTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-12deg', '0deg'],
  });

  const progressInterpolate = loaderWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: screenOpacity,
          transform: [{ scale: screenScale }],
        },
      ]}
    >
      <StatusBar style="light" />

      {/* Ambient background glow orb */}
      <View style={styles.ambientOrbContainer} pointerEvents="none">
        <Animated.View
          style={[
            styles.ambientGlowOrb,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 94, 58, 0.4)', 'rgba(255, 42, 109, 0.1)', 'transparent']}
            style={styles.ambientGlowGradient}
          />
        </Animated.View>
      </View>

      <View style={styles.contentWrap}>
        {/* Animated Center Logo */}
        <View style={styles.logoOuter}>
          <Animated.View
            style={[
              styles.logoWrapper,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }, { rotate: spin }],
              },
            ]}
          >
            <AppLogo size={84} />
          </Animated.View>
        </View>

        {/* Title & Tagline */}
        <Animated.View
          style={[
            styles.textWrapper,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={styles.titlePrefix}>Omni</Text>
            <Text style={styles.titleAccent}>Saver</Text>
            <View style={styles.proPill}>
              <Text style={styles.proPillText}>ULTRA</Text>
            </View>
          </View>
          <Text style={styles.tagline}>Universal 4K & Social Media Downloader</Text>
        </Animated.View>

        {/* Animated Platform Highlights */}
        <Animated.View
          style={[
            styles.platformsRow,
            {
              opacity: chipsOpacity,
              transform: [{ translateY: chipsTranslateY }],
            },
          ]}
        >
          <View style={[styles.platformPill, { borderColor: 'rgba(255, 0, 0, 0.35)' }]}>
            <FontAwesome5 name="youtube" size={11} color="#FF0000" />
            <Text style={styles.platformPillText}>4K/MP3</Text>
          </View>

          <View style={[styles.platformPill, { borderColor: 'rgba(0, 242, 254, 0.35)' }]}>
            <FontAwesome5 name="tiktok" size={10} color="#00F2FE" />
            <Text style={styles.platformPillText}>TikTok</Text>
          </View>

          <View style={[styles.platformPill, { borderColor: 'rgba(225, 48, 108, 0.35)' }]}>
            <FontAwesome5 name="instagram" size={10} color="#E1306C" />
            <Text style={styles.platformPillText}>Reels</Text>
          </View>

          <View style={[styles.platformPill, { borderColor: 'rgba(230, 0, 35, 0.35)' }]}>
            <FontAwesome5 name="pinterest" size={10} color="#E60023" />
            <Text style={styles.platformPillText}>Pinterest</Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Loading Bar & Status */}
      <Animated.View style={[styles.footer, { opacity: textOpacity }]}>
        <View style={styles.loaderContainer}>
          <View style={styles.loaderTrack}>
            <Animated.View style={[styles.loaderBar, { width: progressInterpolate }]}>
              <LinearGradient
                colors={COLORS.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.livePulseDot} />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        <Text style={styles.versionText}>v{CURRENT_APP_VERSION} • PRO EDITION</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.bg,
    zIndex: 9999,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  ambientOrbContainer: {
    position: 'absolute',
    top: '28%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlowOrb: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
  },
  ambientGlowGradient: {
    width: '100%',
    height: '100%',
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  logoOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    marginBottom: 20,
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  textWrapper: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  titlePrefix: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  titleAccent: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.accentPrimary,
    letterSpacing: -0.6,
  },
  proPill: {
    backgroundColor: 'rgba(255, 94, 58, 0.16)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 94, 58, 0.4)',
    marginLeft: 6,
  },
  proPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.accentPrimary,
    letterSpacing: 0.8,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  platformsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  platformPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 2,
  },
  loaderContainer: {
    width: '100%',
    maxWidth: 240,
    marginBottom: 16,
    alignItems: 'center',
  },
  loaderTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  loaderBar: {
    height: '100%',
    borderRadius: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulseDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: 1.2,
  },
});
