import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import { PlatformType } from '../types';
import { detectPlatform, cleanInputUrl } from '../services/api/extractor';

interface UrlInputBarProps {
  url: string;
  onChangeUrl: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  url,
  onChangeUrl,
  onSubmit,
  isLoading,
}) => {
  const [detected, setDetected] = useState<PlatformType>('unknown');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setDetected(detectPlatform(url));
  }, [url]);

  const handlePaste = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const text = await Clipboard.getStringAsync();
      if (text) {
        const cleaned = cleanInputUrl(text);
        onChangeUrl(cleaned);
      }
    } catch (e) {
      console.warn('Paste failed', e);
    }
  };

  const handleClear = () => {
    onChangeUrl('');
  };

  const getPlatformIcon = () => {
    if (url.includes('music.youtube.com')) {
      return (
        <View style={[styles.platformIconFrame, { backgroundColor: 'rgba(255, 0, 0, 0.12)' }]}>
          <Ionicons name="musical-notes" size={14} color="#FF0000" />
        </View>
      );
    }
    switch (detected) {
      case 'tiktok':
        return (
          <View style={[styles.platformIconFrame, { backgroundColor: 'rgba(0, 242, 254, 0.12)' }]}>
            <FontAwesome5 name="tiktok" size={13} color="#00F2FE" />
          </View>
        );
      case 'instagram':
        return (
          <View style={[styles.platformIconFrame, { backgroundColor: 'rgba(225, 48, 108, 0.12)' }]}>
            <FontAwesome5 name="instagram" size={13} color="#E1306C" />
          </View>
        );
      case 'youtube':
      case 'youtube_music':
        return (
          <View style={[styles.platformIconFrame, { backgroundColor: 'rgba(255, 0, 0, 0.12)' }]}>
            <FontAwesome5 name="youtube" size={13} color="#FF0000" />
          </View>
        );
      default:
        return (
          <View style={[styles.platformIconFrame, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <Feather name="link-2" size={14} color={COLORS.textMuted} />
          </View>
        );
    }
  };

  const hasUrl = !!url.trim();

  return (
    <View style={styles.container}>
      {/* Search / Input Box */}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          detected !== 'unknown' && styles.inputWrapperDetected,
        ]}
      >
        <View style={styles.iconContainer}>{getPlatformIcon()}</View>

        <TextInput
          testID="url-input"
          style={styles.input}
          placeholder="Paste YouTube, TikTok, or Instagram link..."
          placeholderTextColor={COLORS.textMuted}
          value={url}
          onChangeText={onChangeUrl}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={onSubmit}
          returnKeyType="go"
        />

        {url.length > 0 ? (
          <TouchableOpacity
            testID="url-clear-btn"
            style={styles.actionBtn}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            testID="url-paste-btn"
            style={styles.pasteBadge}
            onPress={handlePaste}
            activeOpacity={0.7}
          >
            <Ionicons name="clipboard-outline" size={12} color={COLORS.accentPrimary} />
            <Text style={styles.pasteText}>Paste</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Primary Action Button (Gradient on Active / Loading) */}
      <TouchableOpacity
        testID="get-download-link-btn"
        onPress={async () => {
          if (isLoading || !hasUrl) return;
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (_) {}
          onSubmit();
        }}
        disabled={!hasUrl || isLoading}
        activeOpacity={0.85}
        style={styles.touchableBtn}
      >
        {hasUrl || isLoading ? (
          <LinearGradient
            colors={COLORS.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
          >
            {isLoading ? (
              <View style={styles.btnRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.fetchText}>Fetching Media...</Text>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="arrow-down-circle" size={18} color="#FFFFFF" />
                <Text style={styles.fetchText}>Get Download Link</Text>
              </View>
            )}
          </LinearGradient>
        ) : (
          <View style={styles.disabledBtn}>
            <View style={styles.btnRow}>
              <Ionicons name="arrow-down-circle" size={18} color={COLORS.textMuted} />
              <Text style={styles.disabledBtnText}>Paste a Link to Download</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  inputWrapperFocused: {
    borderColor: 'rgba(255, 94, 58, 0.6)',
    backgroundColor: COLORS.cardBgLight,
  },
  inputWrapperDetected: {
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  iconContainer: {
    marginRight: 10,
  },
  platformIconFrame: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  actionBtn: {
    padding: 6,
  },
  pasteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9,
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  pasteText: {
    color: COLORS.accentPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  touchableBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  disabledBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fetchText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  disabledBtnText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
