import * as Clipboard from 'expo-clipboard';
import { detectPlatform } from './api/extractor';

export async function getClipboardUrl(): Promise<{ text: string; isValidMedia: boolean; platform: string } | null> {
  try {
    const hasString = await Clipboard.hasStringAsync();
    if (!hasString) return null;

    const text = await Clipboard.getStringAsync();
    if (!text) return null;

    const trimmed = text.trim();
    const platform = detectPlatform(trimmed);
    const isValidMedia = platform !== 'unknown';

    return {
      text: trimmed,
      isValidMedia,
      platform,
    };
  } catch (err) {
    console.warn('Clipboard check failed:', err);
    return null;
  }
}
