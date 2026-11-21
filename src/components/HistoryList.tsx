import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import { DownloadHistoryItem } from '../types';
import { AdBannerSlot } from './AdBannerSlot';

type MediaFilterType = 'all' | 'videos' | 'audio' | 'images';

interface HistoryListProps {
  items: DownloadHistoryItem[];
  onShare: (uri: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const HistoryItemThumbnail: React.FC<{
  item: DownloadHistoryItem;
  isAudio: boolean;
  isImage: boolean;
}> = ({ item, isAudio, isImage }) => {
  const [hasError, setHasError] = useState(false);

  if (item.thumbnail && !hasError) {
    return (
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.thumb}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <View style={[styles.thumb, styles.thumbFallback]}>
      <Ionicons
        name={isAudio ? 'musical-notes' : isImage ? 'image' : 'film'}
        size={18}
        color={COLORS.accentPrimary}
      />
    </View>
  );
};

export const HistoryList: React.FC<HistoryListProps> = ({
  items,
  onShare,
  onDelete,
  onClearAll,
}) => {
  const [activeFilter, setActiveFilter] = useState<MediaFilterType>('all');

  const confirmClearAll = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to remove all items from download history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: onClearAll },
      ]
    );
  };

  const isItemAudio = (item: DownloadHistoryItem): boolean => {
    const uri = (item.localUri || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    return (
      uri.endsWith('.mp3') ||
      uri.endsWith('.m4a') ||
      item.platform === 'youtube_music' ||
      title.includes('song') ||
      title.includes('audio') ||
      title.includes('mp3')
    );
  };

  const isItemImage = (item: DownloadHistoryItem): boolean => {
    const uri = (item.localUri || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    return (
      uri.endsWith('.jpg') ||
      uri.endsWith('.jpeg') ||
      uri.endsWith('.png') ||
      uri.endsWith('.webp') ||
      title.includes('photo') ||
      title.includes('image') ||
      title.includes('pin')
    );
  };

  const isItemVideo = (item: DownloadHistoryItem): boolean => !isItemAudio(item) && !isItemImage(item);

  const videoCount = items.filter(isItemVideo).length;
  const audioCount = items.filter(isItemAudio).length;
  const imageCount = items.filter(isItemImage).length;

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'videos') return isItemVideo(item);
    if (activeFilter === 'audio') return isItemAudio(item);
    if (activeFilter === 'images') return isItemImage(item);
    return true;
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        return <FontAwesome5 name="tiktok" size={10} color={COLORS.accentPrimary} />;
      case 'instagram':
        return <FontAwesome5 name="instagram" size={10} color={COLORS.accentPrimary} />;
      case 'youtube':
      case 'youtube_music':
        return <FontAwesome5 name="youtube" size={10} color={COLORS.accentPrimary} />;
      case 'pinterest':
        return <FontAwesome5 name="pinterest" size={10} color={COLORS.pinterest || '#E60023'} />;
      default:
        return <Feather name="video" size={10} color={COLORS.textMuted} />;
    }
  };

  const renderItem = ({ item }: { item: DownloadHistoryItem }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const isAudio = isItemAudio(item);
    const isImage = isItemImage(item);

    const sizeMb = item.fileSize
      ? `${(item.fileSize / 1024 / 1024).toFixed(1)} MB`
      : 'Saved in Gallery';

    return (
      <View style={styles.itemCard}>
        <View style={styles.thumbWrapper}>
          <HistoryItemThumbnail item={item} isAudio={isAudio} isImage={isImage} />
          <View style={styles.platformBadge}>{getPlatformIcon(item.platform)}</View>
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.itemMeta} numberOfLines={1}>
            {item.author ? `${item.author} • ` : ''}
            {isAudio ? 'Audio • ' : isImage ? 'Image • ' : 'Video • '}
            {sizeMb}
          </Text>
          <Text style={styles.itemDate}>{formattedDate}</Text>
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onShare(item.localUri)}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={15} color={COLORS.accentPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onDelete(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="screen-history">
        <View style={styles.emptyIconCircle}>
          <Ionicons name="folder-open-outline" size={36} color={COLORS.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No Downloaded Media Yet</Text>
        <Text style={styles.emptyText}>
          Paste a TikTok, Instagram Reel, YouTube, or Pinterest link to save high quality media straight to your gallery!
        </Text>
        <AdBannerSlot placement="saved" style={{ marginTop: 24 }} />
      </View>
    );
  }

  const filterChips: { id: MediaFilterType; label: string; count: number; icon: any }[] = [
    { id: 'all', label: 'All', count: items.length, icon: 'layers-outline' },
    { id: 'videos', label: 'Videos', count: videoCount, icon: 'film-outline' },
    { id: 'audio', label: 'Audio', count: audioCount, icon: 'musical-notes-outline' },
    { id: 'images', label: 'Images', count: imageCount, icon: 'images-outline' },
  ];

  return (
    <View style={styles.container} testID="screen-history">
      {/* Top Header with Action */}
      <View style={styles.listHeader}>
        <Text style={styles.headerTitle}>Saved Media ({items.length})</Text>
        <TouchableOpacity onPress={confirmClearAll} activeOpacity={0.7}>
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filtersBar}>
        {filterChips.map((chip) => {
          const isSelected = activeFilter === chip.id;
          return (
            <TouchableOpacity
              key={chip.id}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveFilter(chip.id);
              }}
              activeOpacity={0.75}
            >
              <Ionicons
                name={chip.icon}
                size={12}
                color={isSelected ? '#FFFFFF' : COLORS.textMuted}
              />
              <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                {chip.label} ({chip.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Ad Placement Hook */}
      <AdBannerSlot placement="saved" style={{ marginBottom: 12 }} />

      {filteredItems.length === 0 ? (
        <View style={styles.filterEmptyBox}>
          <Ionicons name="funnel-outline" size={26} color={COLORS.textMuted} />
          <Text style={styles.filterEmptyText}>
            No {activeFilter} found in your downloaded media.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  clearAllText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },
  filtersBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterChipActive: {
    backgroundColor: COLORS.accentPrimary,
    borderColor: COLORS.accentPrimary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterEmptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  filterEmptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  listContent: {
    gap: 12,
    paddingBottom: 36,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 14,
  },
  thumbWrapper: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0E121B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    backgroundColor: '#131826',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(17, 16, 16, 0.82)',
    padding: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  itemDate: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.cardBgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
