import React from 'react';
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
import { COLORS } from '../theme/colors';
import { DownloadHistoryItem } from '../types';

interface HistoryListProps {
  items: DownloadHistoryItem[];
  onShare: (uri: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  items,
  onShare,
  onDelete,
  onClearAll,
}) => {
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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        return <FontAwesome5 name="tiktok" size={11} color={COLORS.accentPrimary} />;
      case 'instagram':
        return <FontAwesome5 name="instagram" size={11} color={COLORS.accentPrimary} />;
      case 'youtube':
        return <FontAwesome5 name="youtube" size={11} color={COLORS.accentPrimary} />;
      default:
        return <Feather name="video" size={11} color={COLORS.textMuted} />;
    }
  };

  const renderItem = ({ item }: { item: DownloadHistoryItem }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const sizeMb = item.fileSize
      ? `${(item.fileSize / 1024 / 1024).toFixed(1)} MB`
      : 'Saved in Gallery';

    return (
      <View style={styles.itemCard}>
        <View style={styles.thumbWrapper}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]}>
              <Ionicons name="film" size={18} color={COLORS.textMuted} />
            </View>
          )}
          <View style={styles.platformBadge}>{getPlatformIcon(item.platform)}</View>
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.itemMeta} numberOfLines={1}>
            {item.author} • {sizeMb}
          </Text>
          <Text style={styles.itemDate}>{formattedDate}</Text>
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onShare(item.localUri)}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={16} color={COLORS.accentPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onDelete(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="folder-open-outline" size={36} color={COLORS.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No Downloaded Media Yet</Text>
        <Text style={styles.emptyText}>
          Paste a TikTok, Instagram Reel, or YouTube link to save high quality videos straight to your gallery!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.listHeader}>
        <Text style={styles.headerTitle}>Saved Media ({items.length})</Text>
        <TouchableOpacity onPress={confirmClearAll} activeOpacity={0.7}>
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  clearAllText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },
  listContent: {
    gap: 10,
    paddingBottom: 30,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 12,
  },
  thumbWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.cardBgLight,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(11, 14, 20, 0.85)',
    padding: 3,
    borderRadius: 4,
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
    lineHeight: 17,
    marginBottom: 3,
  },
  itemMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  itemActions: {
    flexDirection: 'column',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.cardBgLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
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
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
