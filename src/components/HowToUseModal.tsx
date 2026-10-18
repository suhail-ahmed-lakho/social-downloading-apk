import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface HowToUseModalProps {
  visible: boolean;
  onClose: () => void;
  onCheckUpdates?: () => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({
  visible,
  onClose,
  onCheckUpdates,
}) => {
  const steps = [
    {
      platform: 'YouTube',
      icon: <FontAwesome5 name="youtube" size={15} color={COLORS.accentPrimary} />,
      title: 'YouTube Videos & MP3 Songs',
      instructions: [
        'Open YouTube or YouTube Music and find any Video, Short or Song.',
        'Tap the "Share" button beneath the video/track.',
        'Tap "Copy link".',
        'Paste inside OmniSaver and tap "Get Download Link".',
        'Select "Songs / MP3" tab for high quality audio or "HD Video" for crystal clear MP4!',
      ],
    },
    {
      platform: 'TikTok',
      icon: <FontAwesome5 name="tiktok" size={15} color={COLORS.accentPrimary} />,
      title: 'TikTok (No Watermark)',
      instructions: [
        'Open the TikTok app and find the video you want.',
        'Tap the "Share" icon (arrow on the right).',
        'Tap "Copy Link".',
        'Open OmniSaver, paste the link and tap "Get Download Link".',
        'Select "HD (No Watermark)" to save directly to Gallery!',
      ],
    },
    {
      platform: 'Instagram',
      icon: <FontAwesome5 name="instagram" size={15} color={COLORS.accentPrimary} />,
      title: 'Instagram Reels & Posts',
      instructions: [
        'Open Instagram and go to the Reel or Video.',
        'Tap the Share/Airplane icon or the three dots (•••).',
        'Tap "Copy link".',
        'Paste the URL into OmniSaver and tap "Download & Save to Gallery".',
      ],
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.headerTitleRow}>
                <Feather name="help-circle" size={18} color={COLORS.accentPrimary} />
                <Text style={styles.headerTitle}>How to Download</Text>
              </View>
              <View style={styles.teamBadgeRow}>
                <Ionicons name="shield-checkmark" size={11} color={COLORS.accentPrimary} />
                <Text style={styles.teamBadgeText}>by Lakho's team</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {steps.map((s, index) => (
              <View key={index} style={styles.guideCard}>
                <View style={styles.guideCardHeader}>
                  <View style={styles.guideIconCircle}>
                    {s.icon}
                  </View>
                  <Text style={styles.guideTitle}>{s.title}</Text>
                </View>

                <View style={styles.instructionsList}>
                  {s.instructions.map((inst, i) => (
                    <View key={i} style={styles.instructionRow}>
                      <View style={styles.stepNum}>
                        <Text style={styles.stepNumText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.instructionText}>{inst}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <View style={styles.tipBox}>
              <Ionicons name="images-outline" size={18} color={COLORS.accentPrimary} />
              <Text style={styles.tipText}>
                Downloaded media is saved to your device's Camera Roll / Photos under the "OmniSaver" album, and songs in "OmniSaver Songs".
              </Text>
            </View>

            {/* Check for updates button */}
            {onCheckUpdates && (
              <TouchableOpacity
                style={styles.checkUpdateBtn}
                onPress={() => {
                  onClose();
                  onCheckUpdates();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="sync-outline" size={16} color={COLORS.accentPrimary} />
                <Text style={styles.checkUpdateBtnText}>Check for App Updates</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.doneBtnText}>Got It!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: 36,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  content: {
    marginBottom: 18,
  },
  guideCard: {
    backgroundColor: COLORS.cardBgLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  guideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  guideIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  instructionsList: {
    gap: 10,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 10,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.accentSoft,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    marginBottom: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  teamBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  teamBadgeText: {
    fontSize: 11,
    color: COLORS.accentPrimary,
    fontWeight: '700',
  },
  checkUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: COLORS.cardBgLight,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    marginVertical: 10,
  },
  checkUpdateBtnText: {
    fontSize: 13,
    color: COLORS.accentPrimary,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: COLORS.accentPrimary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
