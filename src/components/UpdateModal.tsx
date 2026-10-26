import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { UpdateCheckResult } from '../services/update/updateChecker';

interface UpdateModalProps {
  visible: boolean;
  updateInfo: UpdateCheckResult | null;
  onClose: () => void;
  onDismissUpdate: (version: string) => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  updateInfo,
  onClose,
  onDismissUpdate,
}) => {
  if (!updateInfo) return null;

  const handleUpdatePress = async () => {
    if (!updateInfo.downloadUrl) {
      Alert.alert('Update Link', 'No download URL specified for this release.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(updateInfo.downloadUrl);
      if (supported) {
        await Linking.openURL(updateInfo.downloadUrl);
      } else {
        Alert.alert('Cannot Open URL', `Unable to open: ${updateInfo.downloadUrl}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not open update link.');
    }
  };

  const handleLaterPress = () => {
    if (updateInfo.latestVersion) {
      onDismissUpdate(updateInfo.latestVersion);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {
        if (!updateInfo.isMandatory) onClose();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Top Decorative Header */}
          <View style={styles.topBadgeContainer}>
            <View style={styles.rocketCircle}>
              <Ionicons name="rocket-sharp" size={28} color="#FFFFFF" />
            </View>
          </View>

          {/* Identity Tag */}
          <View style={styles.identityBadge}>
            <Ionicons name="shield-checkmark" size={13} color={COLORS.accentPrimary} />
            <Text style={styles.identityText}>Official Release • by Lakho's team</Text>
          </View>

          <Text style={styles.title}>New Update Available!</Text>
          <Text style={styles.subtitle}>
            A fresh new version of OmniSaver is ready for you.
          </Text>

          {/* Version Comparison Pill */}
          <View style={styles.versionRow}>
            <View style={styles.versionBox}>
              <Text style={styles.versionLabel}>Current</Text>
              <Text style={styles.versionValue}>v{updateInfo.currentVersion}</Text>
            </View>

            <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />

            <View style={[styles.versionBox, styles.newVersionBox]}>
              <Text style={styles.newVersionLabel}>New Release</Text>
              <Text style={styles.newVersionValue}>v{updateInfo.latestVersion}</Text>
            </View>
          </View>

          {/* Exact Package Size Badge */}
          {updateInfo.fileSize && (
            <View style={styles.sizeBadgeRow}>
              <Ionicons name="cube-outline" size={12} color={COLORS.accentPrimary} />
              <Text style={styles.sizeBadgeText}>Exact Package Size: {updateInfo.fileSize}</Text>
            </View>
          )}

          {/* Changelog Section */}
          <View style={styles.changelogHeader}>
            <Feather name="list" size={14} color={COLORS.accentPrimary} />
            <Text style={styles.changelogTitle}>What's New in This Version</Text>
          </View>

          <ScrollView style={styles.changelogScroll} showsVerticalScrollIndicator={false}>
            {updateInfo.changelog && updateInfo.changelog.length > 0 ? (
              updateInfo.changelog.map((log, idx) => (
                <View key={idx} style={styles.logItem}>
                  <View style={styles.logBullet} />
                  <Text style={styles.logText}>{log.replace(/^[•*-]\s*/, '')}</Text>
                </View>
              ))
            ) : (
              <View style={styles.logItem}>
                <View style={styles.logBullet} />
                <Text style={styles.logText}>General performance and stability improvements.</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionColumn}>
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={handleUpdatePress}
              activeOpacity={0.85}
            >
              <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" />
              <Text style={styles.downloadBtnText}>
                Update Now ({updateInfo.fileSize || '70.8 MB'})
              </Text>
            </TouchableOpacity>

            {!updateInfo.isMandatory && (
              <TouchableOpacity
                style={styles.laterBtn}
                onPress={handleLaterPress}
                activeOpacity={0.7}
              >
                <Text style={styles.laterBtnText}>Remind Me Later</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 7, 7, 0.80)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.cardBg,
    borderRadius: 26,
    paddingTop: 34,
    paddingHorizontal: 24,
    paddingBottom: 26,
    borderWidth: 1.5,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  topBadgeContainer: {
    position: 'absolute',
    top: -28,
    alignItems: 'center',
  },
  rocketCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.bg,
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  identityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 7,
    marginTop: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  identityText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentPrimary,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 18,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBgLight,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sizeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    marginBottom: 14,
  },
  sizeBadgeText: {
    fontSize: 11,
    color: COLORS.accentPrimary,
    fontWeight: '700',
  },
  versionBox: {
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  versionValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 2,
  },
  newVersionBox: {
    alignItems: 'center',
  },
  newVersionLabel: {
    fontSize: 10,
    color: COLORS.accentPrimary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  newVersionValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '800',
    marginTop: 2,
  },
  changelogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    marginBottom: 10,
  },
  changelogTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  changelogScroll: {
    maxHeight: 140,
    width: '100%',
    backgroundColor: COLORS.cardBgLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 20,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 9,
  },
  logBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentPrimary,
    marginTop: 6,
  },
  logText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actionColumn: {
    width: '100%',
    gap: 12,
  },
  downloadBtn: {
    backgroundColor: COLORS.accentPrimary,
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  laterBtn: {
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterBtnText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
