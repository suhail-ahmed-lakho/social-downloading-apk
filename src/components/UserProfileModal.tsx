import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import {
  useProStore,
  calculateRemainingTime,
  getPlanDisplayMeta,
  getLiveSupportWhatsapp,
} from '../store/useProStore';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenUpgradeModal: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  onClose,
  onOpenUpgradeModal,
}) => {
  const pro = useProStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(pro.userName);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const remaining = calculateRemainingTime(pro.expiryTimestamp);
  const planMeta = getPlanDisplayMeta(pro.planType, pro.isPro, pro.expiryTimestamp);

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await Haptics.selectionAsync();
      await Clipboard.setStringAsync(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert('Empty Name', 'Please enter a valid display name or reset to your default Guest ID.');
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await pro.setUserName(trimmed);
      setIsEditingName(false);
      Alert.alert('Profile Updated', `Your display name has been updated to "${trimmed}". Admin can now identify your account easily.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not save profile name.');
    }
  };

  const handleResetToGuest = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await pro.resetToGuestName();
      setNameInput(pro.guestId);
      setIsEditingName(false);
      Alert.alert('Name Reset', `Display name reset to default "${pro.guestId}".`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not reset name.');
    }
  };

  const handleOpenWhatsAppSupport = async () => {
    const phone = getLiveSupportWhatsapp();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const text =
      `Hello OmniSaver Support Team,\n\n` +
      `• User Name: ${pro.userName}\n` +
      `• Guest ID: ${pro.guestId}\n` +
      `• Hardware ID: ${pro.deviceId}\n` +
      `• Current Plan: ${planMeta.title} (${pro.isPro ? remaining.shortLabel : 'Free'})\n` +
      (pro.expiryTimestamp ? `• Expiry Date: ${remaining.expiryDateFormatted}\n` : '') +
      `\nI need assistance with my account. Thanks!`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await handleCopy(url, 'supportText');
        Alert.alert(
          'WhatsApp Notice',
          'WhatsApp is not installed. Details copied to clipboard so you can reach us!'
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not open WhatsApp.');
    }
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Log Out License',
      'Are you sure you want to deactivate your PRO license on this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            await pro.deactivate();
            onClose();
          },
        },
      ]
    );
  };

  // Avatar initial
  const avatarChar = (pro.userName.charAt(0) || 'G').toUpperCase();

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.safeArea}>
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.topTitleCol}>
            <View style={styles.badgeRow}>
              <Text style={styles.topTitle}>My VIP Account</Text>
              <View style={[styles.planBadgeMini, { backgroundColor: planMeta.badgeColor }]}>
                <Text style={styles.planBadgeMiniText}>{planMeta.badge}</Text>
              </View>
            </View>
            <Text style={styles.topSubtitle}>Identity & Subscription Status</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* USER IDENTITY HERO CARD */}
          <View style={styles.userCard}>
            <View style={styles.userHeaderRow}>
              {/* Avatar */}
              <LinearGradient
                colors={pro.isPro ? ['#F59E0B', '#D97706', '#92400E'] : ['#3B82F6', '#1D4ED8']}
                style={styles.avatarWrap}
              >
                {pro.isPro ? (
                  <MaterialCommunityIcons name="crown" size={24} color="#FFFBEB" />
                ) : (
                  <Text style={styles.avatarText}>{avatarChar}</Text>
                )}
              </LinearGradient>

              {/* User Info Col */}
              <View style={styles.userTextCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.userNameText} numberOfLines={1}>
                    {pro.userName}
                  </Text>
                  {!isEditingName && (
                    <TouchableOpacity
                      style={styles.editPencilBtn}
                      onPress={() => {
                        setNameInput(pro.userName);
                        setIsEditingName(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Feather name="edit-2" size={13} color={COLORS.accentPrimary} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.userSubtext}>
                  {pro.isCustomName ? 'Verified Custom Profile Name' : 'Default Guest Profile'}
                </Text>
              </View>
            </View>

            {/* Inline Name Editor */}
            {isEditingName && (
              <View style={styles.editorBox}>
                <Text style={styles.editorLabel}>Edit Profile Name:</Text>
                <TextInput
                  style={styles.nameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="e.g. Suhail Lakho"
                  placeholderTextColor="#64748B"
                  autoFocus
                  maxLength={32}
                  autoCapitalize="words"
                />
                <Text style={styles.editorHint}>
                  Admin will see this name on the dashboard to verify your payment receipts.
                </Text>
                <View style={styles.editorBtnRow}>
                  <TouchableOpacity
                    style={styles.saveNameBtn}
                    onPress={() => void handleSaveName()}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    <Text style={styles.saveNameBtnText}>Save Name</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelNameBtn}
                    onPress={() => setIsEditingName(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelNameBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  {pro.isCustomName && (
                    <TouchableOpacity
                      style={styles.resetNameBtn}
                      onPress={() => void handleResetToGuest()}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.resetNameBtnText}>Reset to Guest</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Dual ID Cards */}
            <View style={styles.idCardsRow}>
              {/* Guest ID Box */}
              <View style={styles.idBox}>
                <Text style={styles.idBoxLabel}>GUEST ID</Text>
                <View style={styles.idBoxInner}>
                  <Text style={styles.idBoxValue}>{pro.guestId}</Text>
                  <TouchableOpacity
                    onPress={() => void handleCopy(pro.guestId, 'guestId')}
                    style={styles.copySmallBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={copiedField === 'guestId' ? 'checkmark' : 'copy-outline'}
                      size={13}
                      color={copiedField === 'guestId' ? '#10B981' : COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Hardware Device ID Box */}
              <View style={styles.idBox}>
                <Text style={styles.idBoxLabel}>HARDWARE DEVICE ID</Text>
                <View style={styles.idBoxInner}>
                  <Text style={styles.idBoxValue} numberOfLines={1}>
                    {pro.deviceId}
                  </Text>
                  <TouchableOpacity
                    onPress={() => void handleCopy(pro.deviceId, 'deviceId')}
                    style={styles.copySmallBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={copiedField === 'deviceId' ? 'checkmark' : 'copy-outline'}
                      size={13}
                      color={copiedField === 'deviceId' ? '#10B981' : COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* SUBSCRIPTION DETAILS & TIME LEFT CARD */}
          <Text style={styles.sectionTitle}>SUBSCRIPTION PACKAGE & TIME LEFT</Text>

          <View style={[styles.subCard, pro.isPro && styles.subCardPro]}>
            {/* Header in Sub Card */}
            <View style={styles.subCardHeader}>
              <View style={styles.subCardHeaderLeft}>
                <View
                  style={[
                    styles.subIconWrap,
                    { backgroundColor: pro.isPro ? 'rgba(245, 158, 11, 0.15)' : 'rgba(100, 116, 139, 0.15)' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={pro.isPro ? 'crown' : 'shield-outline'}
                    size={20}
                    color={pro.isPro ? '#F59E0B' : '#94A3B8'}
                  />
                </View>
                <View>
                  <Text style={styles.subPlanTitle}>{planMeta.title}</Text>
                  <Text style={styles.subPlanDesc}>{planMeta.description}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.statusBadgePill,
                  {
                    backgroundColor: pro.isPro
                      ? remaining.isGrace
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(100, 116, 139, 0.2)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: pro.isPro
                        ? remaining.isGrace
                          ? '#F59E0B'
                          : '#10B981'
                        : '#94A3B8',
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: pro.isPro
                        ? remaining.isGrace
                          ? '#FBBF24'
                          : '#34D399'
                        : '#94A3B8',
                    },
                  ]}
                >
                  {pro.isPro ? (remaining.isGrace ? '24h Grace' : 'Active') : 'Free Tier'}
                </Text>
              </View>
            </View>

            {/* COUNTDOWN HIGHLIGHT BOX */}
            <View
              style={[
                styles.countdownHighlightBox,
                pro.isPro && remaining.isGrace
                  ? styles.countdownGraceBox
                  : pro.isPro
                  ? styles.countdownProBox
                  : styles.countdownFreeBox,
              ]}
            >
              <View style={styles.countdownRow}>
                <Ionicons
                  name={pro.isPro ? 'timer-outline' : 'information-circle-outline'}
                  size={20}
                  color={
                    pro.isPro
                      ? remaining.isGrace
                        ? '#F59E0B'
                        : '#10B981'
                      : '#94A3B8'
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.countdownTitle}>
                    {pro.isPro ? 'Time Remaining on Subscription:' : 'Subscription Validity:'}
                  </Text>
                  <Text
                    style={[
                      styles.countdownLargeText,
                      {
                        color: pro.isPro
                          ? remaining.isGrace
                            ? '#FBBF24'
                            : '#34D399'
                          : '#E2E8F0',
                      },
                    ]}
                  >
                    {pro.isPro ? remaining.formatted : 'Unlimited Free Standard Downloads'}
                  </Text>
                </View>
              </View>

              {pro.isPro && pro.expiryTimestamp ? (
                <View style={styles.expiryDateRow}>
                  <Text style={styles.expiryDateLabel}>Expiry Date:</Text>
                  <Text style={styles.expiryDateValue}>{remaining.expiryDateFormatted}</Text>
                </View>
              ) : null}
            </View>

            {/* 24h Grace Notice if applicable */}
            {pro.isPro && remaining.isGrace && (
              <View style={styles.graceAlertBox}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#F59E0B" />
                <Text style={styles.graceAlertText}>
                  Your TID has been submitted! You have full PRO access during this 24-hour grace window while our admin verifies your receipt.
                </Text>
              </View>
            )}

            {/* Feature Perks List */}
            <View style={styles.perksList}>
              <View style={styles.perkRow}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.perkText}>
                  {pro.isPro ? '100% Ad-Free Experience (No banners or popups)' : 'Ad-supported download stream'}
                </Text>
              </View>
              <View style={styles.perkRow}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.perkText}>
                  {pro.isPro ? 'Unlimited Private Instagram In-App Browser Captures' : '2 Private IG captures per day'}
                </Text>
              </View>
              <View style={styles.perkRow}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.perkText}>
                  {pro.isPro ? '4K / 2K Ultra HD & 320kbps Studio MP3 Audio' : 'Standard 1080p/720p extraction'}
                </Text>
              </View>
              <View style={styles.perkRow}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.perkText}>
                  {pro.isPro ? 'Turbo Multi-Core Download Accelerator' : 'Standard download speed'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.subActionRow}>
              {pro.isPro ? (
                <>
                  <TouchableOpacity
                    style={styles.extendPlanBtn}
                    onPress={() => {
                      onClose();
                      onOpenUpgradeModal();
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.extendPlanGradient}
                    >
                      <MaterialCommunityIcons name="crown" size={15} color="#FFFBEB" />
                      <Text style={styles.extendPlanBtnText}>Extend / Renew Plan</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deactivateBtn}
                    onPress={handleDeactivate}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deactivateBtnText}>Log Out Key</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.upgradeBtnFull}
                  onPress={() => {
                    onClose();
                    onOpenUpgradeModal();
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706', '#92400E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.upgradeBtnGradient}
                  >
                    <MaterialCommunityIcons name="crown" size={16} color="#FFFBEB" />
                    <Text style={styles.upgradeBtnText}>Upgrade to VIP PRO (Rs. 150/mo)</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* DEDICATED WHATSAPP SUPPORT BUTTON */}
          <Text style={styles.sectionTitle}>DIRECT PRIORITY SUPPORT</Text>
          <TouchableOpacity
            style={styles.whatsappCard}
            onPress={() => void handleOpenWhatsAppSupport()}
            activeOpacity={0.8}
          >
            <View style={styles.whatsappIconWrap}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.whatsappTitle}>WhatsApp VIP Desk</Text>
              <Text style={styles.whatsappSub}>
                Pre-fills your Name, Guest ID, and Plan for instant resolution
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080B10',
    paddingTop: Platform.OS === 'android' ? ((StatusBar.currentHeight || 24) + 8) : 48,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitleCol: {
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  planBadgeMini: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  planBadgeMiniText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  topSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 76 : 64,
  },
  userCard: {
    backgroundColor: '#0E131F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 20,
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userTextCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  editPencilBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  editorBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  editorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  nameInput: {
    backgroundColor: '#080B10',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editorHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 5,
    marginBottom: 10,
  },
  editorBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveNameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveNameBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelNameBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelNameBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  resetNameBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 'auto',
  },
  resetNameBtnText: {
    fontSize: 11,
    color: '#EF4444',
  },
  idCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  idBox: {
    flex: 1,
    backgroundColor: '#080B10',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  idBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  idBoxInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  idBoxValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    fontVariant: ['tabular-nums'],
  },
  copySmallBtn: {
    padding: 3,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  subCard: {
    backgroundColor: '#0E131F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 20,
  },
  subCardPro: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  subIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subPlanTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subPlanDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  countdownHighlightBox: {
    marginTop: 14,
    borderRadius: 12,
    padding: 14,
  },
  countdownProBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  countdownGraceBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  countdownFreeBox: {
    backgroundColor: '#080B10',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countdownTitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  countdownLargeText: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  expiryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  expiryDateLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  expiryDateValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    fontVariant: ['tabular-nums'],
  },
  graceAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  graceAlertText: {
    fontSize: 11,
    color: '#FDE68A',
    flex: 1,
    lineHeight: 15,
  },
  perksList: {
    marginTop: 14,
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkText: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  subActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  extendPlanBtn: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  extendPlanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
  },
  extendPlanBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFBEB',
  },
  deactivateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  deactivateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  upgradeBtnFull: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  upgradeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  upgradeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFBEB',
  },
  whatsappCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0E131F',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.25)',
  },
  whatsappIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  whatsappSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
});
