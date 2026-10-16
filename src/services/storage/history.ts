import AsyncStorage from '@react-native-async-storage/async-storage';
import { DownloadHistoryItem } from '../../types';

const STORAGE_KEY = '@omnisaver_download_history';

export async function getDownloadHistory(): Promise<DownloadHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load history:', err);
    return [];
  }
}

export async function addDownloadToHistory(item: DownloadHistoryItem): Promise<DownloadHistoryItem[]> {
  try {
    const current = await getDownloadHistory();
    // Prepend new item, remove duplicates by id or localUri
    const filtered = current.filter((h) => h.id !== item.id && h.localUri !== item.localUri);
    const updated = [item, ...filtered];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to add to history:', err);
    return [];
  }
}

export async function deleteHistoryItem(id: string): Promise<DownloadHistoryItem[]> {
  try {
    const current = await getDownloadHistory();
    const updated = current.filter((h) => h.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to remove history item:', err);
    return [];
  }
}

export async function clearAllHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}
