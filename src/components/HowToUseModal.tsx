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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    marginBottom: 16,
  },
  guideCard: {
    backgroundColor: COLORS.cardBgLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  guideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  guideIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
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
    gap: 8,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.cardBg,
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
    lineHeight: 18,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.accentSoft,
    padding: 12,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    fontWeight: '500',
  },
  teamBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
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
    gap: 8,
    backgroundColor: COLORS.cardBgLight,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    marginVertical: 8,
  },
  checkUpdateBtnText: {
    fontSize: 13,
    color: COLORS.accentPrimary,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: COLORS.accentPrimary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
