import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppLogo } from './AppLogo';
import { COLORS } from '../theme/colors';
import { CURRENT_APP_VERSION } from '../config/updateConfig';

interface OpeningSplashScreenProps {
  onAnimationFinish: () => void;
}

export const OpeningSplashScreen: React.FC<OpeningSplashScreenProps> = ({
  onAnimationFinish,
}) => {
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(10)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Snappy logo entrance
    const useNative = Platform.OS !== 'web';
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: useNative,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      }),
    ]).start();

    // 2. Text fade-in
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 300,
        delay: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: useNative,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 300,
        delay: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: useNative,
      }),
    ]).start();

    // 3. Fast, clean exit (750ms dwell + 220ms fade = ~970ms total)
    const exitTimer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: useNative,
      }).start(() => {
        onAnimationFinish();
      });
    }, 750);

    return () => clearTimeout(exitTimer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar style="light" />

      <View style={styles.contentWrap}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <AppLogo size={76} />
        </Animated.View>

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
          </View>
          <Text style={styles.tagline}>Universal Media Downloader</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: textOpacity }]}>
        <Text style={styles.versionText}>v{CURRENT_APP_VERSION} • PRO</Text>
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
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: 18,
  },
  textWrapper: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titlePrefix: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  titleAccent: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.accentPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  footer: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
});
