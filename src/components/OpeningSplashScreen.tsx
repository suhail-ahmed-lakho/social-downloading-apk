import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  StatusBar,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');

interface OpeningSplashScreenProps {
  onAnimationFinish: () => void;
}

export const OpeningSplashScreen: React.FC<OpeningSplashScreenProps> = ({
  onAnimationFinish,
}) => {
  // Animation drivers
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const pulseGlow = useRef(new Animated.Value(0.3)).current;
  const shockwaveScale = useRef(new Animated.Value(0.7)).current;
  const shockwaveOpacity = useRef(new Animated.Value(0.9)).current;

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(20)).current;
  const progressBarWidth = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

  const [statusText, setStatusText] = useState('Initializing Ultra Engine...');

  useEffect(() => {
    // 1. Continuous shockwave pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(shockwaveScale, {
            toValue: 1.5,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(shockwaveOpacity, {
            toValue: 0,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(pulseGlow, {
            toValue: 0.8,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(shockwaveScale, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(shockwaveOpacity, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(pulseGlow, {
            toValue: 0.3,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // 2. Logo entrance physics spring
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Staggered typography & pill elements
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 450,
        delay: 250,
        useNativeDriver: true,
      }),
      Animated.spring(contentTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 40,
        delay: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // 4. Progress bar fill
    Animated.timing(progressBarWidth, {
      toValue: 1,
      duration: 1100,
      delay: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // Text status update cycle
    const statusTimer1 = setTimeout(() => {
      setStatusText('Connecting Stream CDN...');
    }, 600);

    const statusTimer2 = setTimeout(() => {
      setStatusText('Ready');
    }, 1200);

    // 5. Smooth exit transition after 1.8s
    const exitTimer = setTimeout(() => {
      triggerExit();
    }, 1800);

    return () => {
      clearTimeout(statusTimer1);
      clearTimeout(statusTimer2);
      clearTimeout(exitTimer);
    };
  }, []);

  const triggerExit = () => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 380,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(screenScale, {
        toValue: 1.05,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onAnimationFinish();
    });
  };

  const barWidthInterpolated = progressBarWidth.interpolate({
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <TouchableOpacity
        style={styles.touchableOverlay}
        activeOpacity={1}
        onPress={triggerExit}
      >
        <View style={styles.centerSection}>
          {/* Radial Ambient Orange Glow */}
          <Animated.View
            style={[
              styles.radialGlow,
              {
                opacity: pulseGlow,
              },
            ]}
          />

          {/* Holographic Shockwave Ring */}
          <Animated.View
            style={[
              styles.shockwaveRing,
              {
                opacity: shockwaveOpacity,
                transform: [{ scale: shockwaveScale }],
              },
            ]}
          />

          {/* Central Logo Card */}
          <Animated.View
            style={[
              styles.logoCard,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
            {/* Corner Sparkle Badge */}
            <View style={styles.sparkleBadge}>
              <Ionicons name="sparkles" size={13} color="#FFFFFF" />
            </View>
          </Animated.View>

          {/* Typography & Brand Suite */}
          <Animated.View
            style={[
              styles.brandingBox,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            {/* LookNow Brand Title */}
            <View style={styles.titleRow}>
              <Text style={styles.brandTitlePrefix}>Look</Text>
              <Text style={styles.brandTitleAccent}>Now</Text>
              <View style={styles.dotIndicator} />
              <Text style={styles.brandTitleSuffix}>OmniSaver</Text>
            </View>

            {/* Team Identity Tag */}
            <View style={styles.identityBadge}>
              <Ionicons name="shield-checkmark" size={12} color={COLORS.accentPrimary} />
              <Text style={styles.identityBadgeText}>Official Build • Lakho's Team</Text>
            </View>

            <Text style={styles.brandSubtitle}>
              Universal 4K Media & 320kbps MP3 Audio Engine
            </Text>

            {/* Platform Feature Pills */}
            <View style={styles.badgesRow}>
              <View style={styles.platformPill}>
                <FontAwesome5 name="tiktok" size={11} color="#00F2FE" />
                <Text style={styles.pillText}>TikTok</Text>
              </View>

              <View style={styles.platformPill}>
                <FontAwesome5 name="instagram" size={11} color="#E1306C" />
                <Text style={styles.pillText}>Instagram</Text>
              </View>

              <View style={styles.platformPill}>
                <FontAwesome5 name="youtube" size={11} color="#FF0000" />
                <Text style={styles.pillText}>YouTube 4K</Text>
              </View>

              <View style={styles.platformPill}>
                <Ionicons name="musical-notes" size={11} color={COLORS.accentPrimary} />
                <Text style={styles.pillText}>320k MP3</Text>
              </View>
            </View>

            {/* High-Tech Progress Capsule */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    { width: barWidthInterpolated },
                  ]}
                />
              </View>
              <View style={styles.loadingRow}>
                <Text style={styles.loadingText}>{statusText}</Text>
                <Text style={styles.skipHintText}>Tap anywhere to skip</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Footer info */}
        <Animated.View style={[styles.footerBox, { opacity: contentOpacity }]}>
          <Text style={styles.footerText}>Zero Watermarks • Direct CDN • 100% Free</Text>
        </Animated.View>
      </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchableOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 56,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  radialGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 107, 0, 0.22)',
  },
  shockwaveRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 0, 0.45)',
  },
  logoCard: {
    width: 104,
    height: 104,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 0, 0.4)',
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  sparkleBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: COLORS.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  brandingBox: {
    alignItems: 'center',
    marginTop: 28,
    width: '100%',
    paddingHorizontal: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitlePrefix: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  brandTitleAccent: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.accentPrimary,
    letterSpacing: -0.5,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentPrimary,
    marginHorizontal: 8,
  },
  brandTitleSuffix: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  identityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    marginTop: 10,
  },
  identityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentPrimary,
    letterSpacing: 0.2,
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  progressContainer: {
    width: width * 0.6,
    marginTop: 32,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accentPrimary,
    borderRadius: 4,
  },
  loadingRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  loadingText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  skipHintText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '500',
  },
  footerBox: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
