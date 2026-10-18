import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import { PlatformType } from '../types';
import { detectPlatform } from '../services/api/extractor';

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
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const text = await Clipboard.getStringAsync();
      if (text) {
        onChangeUrl(text.trim());
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
      return <Ionicons name="musical-notes" size={17} color={COLORS.accentPrimary} />;
    }
    switch (detected) {
      case 'tiktok':
        return <FontAwesome5 name="tiktok" size={15} color={COLORS.accentPrimary} />;
      case 'instagram':
        return <FontAwesome5 name="instagram" size={15} color={COLORS.accentPrimary} />;
      case 'youtube':
      case 'youtube_music':
        return <FontAwesome5 name="youtube" size={15} color={COLORS.accentPrimary} />;
      default:
        return <Feather name="link-2" size={15} color={COLORS.textMuted} />;
    }
  };

  const isSubmitActive = !!url.trim() && !isLoading;

  return (
    <View style={styles.container}>
      {/* Input Field */}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          detected !== 'unknown' && styles.inputWrapperDetected,
        ]}
      >
        <View style={styles.iconContainer}>{getPlatformIcon()}</View>

        <TextInput
          style={styles.input}
          placeholder="Paste YouTube Song, Video, TikTok, or IG link..."
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
            style={styles.actionBtn}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.pasteBadge}
            onPress={handlePaste}
            activeOpacity={0.7}
          >
            <Ionicons name="clipboard-outline" size={13} color={COLORS.accentPrimary} />
            <Text style={styles.pasteText}>Paste</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Solid Action Button */}
      <TouchableOpacity
        style={[
          styles.fetchButton,
          isSubmitActive ? styles.fetchButtonActive : styles.fetchButtonDisabled,
        ]}
        onPress={onSubmit}
        disabled={!isSubmitActive}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <View style={styles.btnRow}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.fetchText}>Analyzing Video...</Text>
          </View>
        ) : (
          <View style={styles.btnRow}>
            <Ionicons
              name="flash"
              size={16}
              color={isSubmitActive ? '#FFFFFF' : COLORS.textMuted}
            />
            <Text
              style={[
                styles.fetchText,
                !isSubmitActive && styles.fetchTextDisabled,
              ]}
            >
              Get Download Link
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    marginBottom: 24,
    gap: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  inputWrapperFocused: {
    borderColor: COLORS.accentPrimary,
    backgroundColor: COLORS.cardBgLight,
  },
  inputWrapperDetected: {
    borderColor: COLORS.accentBorder,
  },
  iconContainer: {
    marginRight: 12,
    width: 22,
    alignItems: 'center',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  pasteText: {
    color: COLORS.accentPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  fetchButton: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fetchButtonActive: {
    backgroundColor: COLORS.accentPrimary,
    borderColor: COLORS.accentPrimary,
  },
  fetchButtonDisabled: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.cardBorder,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  fetchText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  fetchTextDisabled: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
