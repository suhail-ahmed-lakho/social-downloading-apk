import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');

interface OpeningSplashScreenProps {
  onAnimationFinish: () => void;
}

export const OpeningSplashScreen: React.FC<OpeningSplashScreenProps> = ({
  onAnimationFinish,
}) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(25)).current;
  const progressBarWidth = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Logo pop-in animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(ringOpacity, {
        toValue: 0.6,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(ringScale, {
        toValue: 1.15,
        friction: 5,
        tension: 30,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Text and badges slide up
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 500,
      delay: 300,
      useNativeDriver: true,
    }).start();

    Animated.spring(contentTranslateY, {
      toValue: 0,
      friction: 7,
      tension: 40,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // 3. Progress bar fill
    Animated.timing(progressBarWidth, {
      toValue: 1,
      duration: 1100,
      delay: 350,
      useNativeDriver: false,
    }).start();

    // 4. Smooth exit transition after 1.8 seconds
    const timer = setTimeout(() => {
      triggerExit();
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  const triggerExit = () => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(screenScale, {
        toValue: 1.05,
        duration: 400,
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
          <Animated.View
            style={[
              styles.neonRing,
              {
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.logoBox,
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
          </Animated.View>

          {/* Title & Tagline */}
          <Animated.View
            style={[
              styles.brandingBox,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>Omni</Text>
              <Text style={styles.brandTitleAccent}>Saver</Text>
            </View>

            {/* Team Identity Tag */}
            <View style={styles.identityBadge}>
              <FontAwesome5 name="shield-alt" size={10} color={COLORS.accentPrimary} />
              <Text style={styles.identityBadgeText}>by Lakho's team</Text>
            </View>

            <Text style={styles.brandSubtitle}>
              Universal HD Media & Song Downloader
            </Text>

            {/* Platform Badges */}
            <View style={styles.badgesRow}>
              <View style={styles.platformPill}>
                <FontAwesome5 name="tiktok" size={11} color={COLORS.accentPrimary} />
                <Text style={styles.pillText}>TikTok</Text>
              </View>

              <View style={styles.platformPill}>
                <FontAwesome5 name="instagram" size={11} color={COLORS.accentPrimary} />
                <Text style={styles.pillText}>Instagram</Text>
              </View>

              <View style={styles.platformPill}>
                <FontAwesome5 name="youtube" size={11} color={COLORS.accentPrimary} />
                <Text style={styles.pillText}>YT Videos</Text>
              </View>

              <View style={styles.platformPill}>
                <FontAwesome5 name="music" size={10} color={COLORS.accentPrimary} />
                <Text style={styles.pillText}>MP3 Songs</Text>
              </View>
            </View>

            {/* Loading / Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    { width: barWidthInterpolated },
                  ]}
                />
              </View>
              <Text style={styles.loadingText}>Initializing fast downloader...</Text>
            </View>
          </Animated.View>
        </View>

        {/* Footer info */}
        <Animated.View style={[styles.footerBox, { opacity: contentOpacity }]}>
          <Text style={styles.footerText}>Direct • No Login • High Quality MP3 & Video</Text>
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
    paddingVertical: 50,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  neonRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: COLORS.accentPrimary,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandingBox: {
    alignItems: 'center',
    marginTop: 28,
    width: '100%',
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  brandTitleAccent: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.accentPrimary,
    letterSpacing: 0.3,
  },
  identityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    marginTop: 8,
  },
  identityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentPrimary,
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 8,
    letterSpacing: 0.2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  progressContainer: {
    width: width * 0.5,
    marginTop: 32,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 3,
    backgroundColor: COLORS.cardBgLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accentPrimary,
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 8,
    fontWeight: '500',
  },
  footerBox: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
