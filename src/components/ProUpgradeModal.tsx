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
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import {
  useProStore,
  PRO_PRICING,
  PAYMENT_CHANNELS,
  getLivePaymentChannels,
  buildPaymentProofWhatsAppUrl,
  activateLicenseKey,
  ProPlanType,
} from '../store/useProStore';

interface ProUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'pricing' | 'activate' | 'payment';
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  visible,
  onClose,
  initialTab = 'pricing',
}) => {
  const pro = useProStore();
  const [activeTab, setActiveTab] = useState<'pricing' | 'activate' | 'payment'>(initialTab);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'yearly'>('quarterly');
  const [selectedChannel, setSelectedChannel] = useState<string>('easypaisa');
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [tidInput, setTidInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await Haptics.selectionAsync();
      await Clipboard.setStringAsync(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  const handleActivateKey = async () => {
    if (!licenseKeyInput.trim()) {
      Alert.alert('Empty License', 'Please paste or enter your OmniSaver PRO license key.');
      return;
    }

    setIsActivating(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await activateLicenseKey(licenseKeyInput.trim(), pro.deviceId);
      if (res.success) {
        Alert.alert('PRO Activated! 🎉', res.message, [
          {
            text: 'Enjoy PRO',
            onPress: () => {
              setLicenseKeyInput('');
              onClose();
            },
          },
        ]);
      } else {
        Alert.alert('Activation Failed', res.message);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not verify license key.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleInstantTidActivation = async () => {
    if (!tidInput.trim()) {
      Alert.alert(
        'Transaction ID Required',
        'Please enter your 6-12 digit EasyPaisa, JazzCash, or NayaPay Transaction ID (TID) to activate PRO instantly.'
      );
      return;
    }

    setIsActivating(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await activateLicenseKey(tidInput.trim(), pro.deviceId, selectedPlan);
      if (res.success) {
        Alert.alert('PRO Activated! 🎉', res.message, [
          {
            text: 'Start Using PRO',
            onPress: () => {
              setTidInput('');
              onClose();
            },
          },
        ]);
      } else {
        Alert.alert('Activation Failed', res.message);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not verify transaction.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleOpenWhatsAppSupport = async () => {
    const liveChannels = getLivePaymentChannels();
    const channelObj = liveChannels.find((c) => c.id === selectedChannel);
    const channelName = channelObj ? channelObj.name : selectedChannel;

    const url = buildPaymentProofWhatsAppUrl({
      planId: selectedPlan,
      tid: tidInput.trim(),
      paymentMethod: channelName,
    });

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await handleCopy(url, 'proofLink');
        Alert.alert(
          'WhatsApp Notice',
          'WhatsApp is not installed. Details copied to clipboard so you can message us directly!'
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not open WhatsApp.');
    }
  };

  const renderComparisonRow = (feature: string, freeText: string, proText: string, isAccent = false) => (
    <View style={styles.compRow}>
      <Text style={[styles.compFeature, isAccent && styles.compFeatureAccent]}>{feature}</Text>
      <Text style={styles.compFree}>{freeText}</Text>
      <View style={styles.compProWrap}>
        <Ionicons name="checkmark-circle" size={14} color={COLORS.accentPrimary} />
        <Text style={styles.compPro}>{proText}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.safeArea}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.topTitleCol}>
            <View style={styles.badgeRow}>
              <Text style={styles.topTitle}>OmniSaver</Text>
              <LinearGradient
                colors={COLORS.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.proPill}
              >
                <Text style={styles.proPillText}>PRO VIP</Text>
              </LinearGradient>
            </View>
            <Text style={styles.topSubtitle}>No Ads • 4K Streams • Unlimited Capture</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'pricing' && styles.tabBtnActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('pricing');
            }}
          >
            <Ionicons
              name="sparkles"
              size={13}
              color={activeTab === 'pricing' ? COLORS.accentPrimary : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'pricing' && styles.tabTextActive]}>
              Plans & Features
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'activate' && styles.tabBtnActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('activate');
            }}
          >
            <Ionicons
              name="key-outline"
              size={13}
              color={activeTab === 'activate' ? COLORS.accentPrimary : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'activate' && styles.tabTextActive]}>
              Activate License
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'payment' && styles.tabBtnActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('payment');
            }}
          >
            <Ionicons
              name="card-outline"
              size={13}
              color={activeTab === 'payment' ? COLORS.accentPrimary : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'payment' && styles.tabTextActive]}>
              Local Payment
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* TAB 1: PRICING & FEATURE COMPARISON */}
          {activeTab === 'pricing' && (
            <View style={styles.tabContent}>
              {/* Feature Comparison Box */}
              <View style={styles.comparisonCard}>
                <View style={styles.compHeader}>
                  <Text style={styles.compHeaderTitle}>Feature</Text>
                  <Text style={styles.compHeaderFree}>Free</Text>
                  <Text style={styles.compHeaderPro}>PRO VIP</Text>
                </View>
                {renderComparisonRow('Advertisements', 'Banners & Interstitials', '100% Ad-Free', true)}
                {renderComparisonRow('4K & 2K Ultra HD', 'Rewarded Ad Wait', 'Instant 1-Tap', true)}
                {renderComparisonRow('320k Lossless MP3', 'Standard Quality', 'Studio Master', true)}
                {renderComparisonRow('Private IG Browser', '2 Captures / Day', 'Unlimited', true)}
                {renderComparisonRow('Download Threads', 'Standard Speed', 'Turbo Multi-Core')}
              </View>

              {/* Pricing Cards */}
              <Text style={styles.sectionHeader}>SELECT YOUR VIP PLAN</Text>

              {/* Monthly Plan */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'monthly' && styles.planCardSelected,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedPlan('monthly');
                }}
                activeOpacity={0.88}
              >
                <View style={styles.planRadioCol}>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedPlan === 'monthly' && styles.radioCircleSelected,
                    ]}
                  >
                    {selectedPlan === 'monthly' && <View style={styles.radioDot} />}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>{PRO_PRICING.monthly.title}</Text>
                  <Text style={styles.planSub}>Flexible month-to-month access</Text>
                </View>
                <View style={styles.planPriceCol}>
                  <Text style={styles.planPrice}>{PRO_PRICING.monthly.price}</Text>
                  <Text style={styles.planPeriod}>/ month</Text>
                </View>
              </TouchableOpacity>

              {/* 3 Months Saver (Most Popular) */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'quarterly' && styles.planCardSelected,
                  styles.popularCardHighlight,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedPlan('quarterly');
                }}
                activeOpacity={0.88}
              >
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR • SAVE 20%</Text>
                </View>
                <View style={styles.planRadioCol}>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedPlan === 'quarterly' && styles.radioCircleSelected,
                    ]}
                  >
                    {selectedPlan === 'quarterly' && <View style={styles.radioDot} />}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>{PRO_PRICING.quarterly.title}</Text>
                  <Text style={styles.planSub}>
                    Just <Text style={{ color: COLORS.accentPrimary, fontWeight: '700' }}>Rs. 600/month</Text>
                  </Text>
                </View>
                <View style={styles.planPriceCol}>
                  <Text style={styles.planPrice}>{PRO_PRICING.quarterly.price}</Text>
                  <Text style={styles.planPeriod}>for 3 months</Text>
                </View>
              </TouchableOpacity>

              {/* Yearly VIP (Best Value) */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'yearly' && styles.planCardSelected,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedPlan('yearly');
                }}
                activeOpacity={0.88}
              >
                <View style={[styles.popularBadge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.popularBadgeText}>BEST VALUE • SAVE 50%</Text>
                </View>
                <View style={styles.planRadioCol}>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedPlan === 'yearly' && styles.radioCircleSelected,
                    ]}
                  >
                    {selectedPlan === 'yearly' && <View style={styles.radioDot} />}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>{PRO_PRICING.yearly.title}</Text>
                  <Text style={styles.planSub}>
                    Just <Text style={{ color: '#10B981', fontWeight: '700' }}>Rs. 375/month</Text>
                  </Text>
                </View>
                <View style={styles.planPriceCol}>
                  <Text style={styles.planPrice}>{PRO_PRICING.yearly.price}</Text>
                  <Text style={styles.planPeriod}>/ full year</Text>
                </View>
              </TouchableOpacity>

              {/* Bottom Next Step Call to Action */}
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={styles.ctaBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab('payment');
                  }}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={COLORS.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                  >
                    <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.ctaText}>
                      Pay via EasyPaisa / Bank ({PRO_PRICING[selectedPlan].price})
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryTextBtn}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveTab('activate');
                  }}
                >
                  <Text style={styles.secondaryText}>Already have a License Key? Enter Key ›</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 2: INSTANT LICENSE KEY ACTIVATION */}
          {activeTab === 'activate' && (
            <View style={styles.tabContent}>
              {/* User Device Identifier Box */}
              <View style={styles.deviceIdCard}>
                <View style={styles.deviceIdHeader}>
                  <Ionicons name="hardware-chip-outline" size={16} color={COLORS.accentPrimary} />
                  <Text style={styles.deviceIdTitle}>Your Bound Device ID</Text>
                </View>
                <Text style={styles.deviceIdSub}>
                  Each PRO license binds directly to your unique device identifier.
                </Text>
                <View style={styles.deviceCodeRow}>
                  <Text style={styles.deviceCodeText}>{pro.deviceId}</Text>
                  <TouchableOpacity
                    style={styles.deviceCopyBtn}
                    onPress={() => handleCopy(pro.deviceId, 'deviceId')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={copiedField === 'deviceId' ? 'checkmark' : 'copy-outline'}
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.deviceCopyText}>
                      {copiedField === 'deviceId' ? 'Copied' : 'Copy ID'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* License Input */}
              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>ENTER ACTIVATION LICENSE KEY</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. OMNI-PRO-XXXX-XXXX"
                  placeholderTextColor={COLORS.textMuted}
                  value={licenseKeyInput}
                  onChangeText={setLicenseKeyInput}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />

                {__DEV__ && (
                  <View style={styles.devKeyBox}>
                    <Ionicons name="construct-outline" size={13} color="#F59E0B" />
                    <Text style={styles.devKeyLabel}>DEV TEST KEY:</Text>
                    <TouchableOpacity
                      onPress={() => setLicenseKeyInput('OMNI-TEST-2026')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.devKeyValue}>OMNI-TEST-2026 (Tap to Fill)</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.ctaBtn, { marginTop: 16 }]}
                  onPress={handleActivateKey}
                  disabled={isActivating}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={COLORS.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                  >
                    {isActivating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="key" size={17} color="#FFFFFF" />
                    )}
                    <Text style={styles.ctaText}>
                      {isActivating ? 'Verifying Key...' : 'Verify & Activate PRO'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Status info */}
              {pro.isPro && (
                <View style={styles.activeStatusBox}>
                  <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activeStatusTitle}>PRO VIP Is Currently Active</Text>
                    <Text style={styles.activeStatusSub}>
                      Plan: {pro.planType.toUpperCase()} • Expires:{' '}
                      {pro.expiryTimestamp
                        ? new Date(pro.expiryTimestamp).toLocaleDateString()
                        : 'Never'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deactivateBtn}
                    onPress={() => {
                      Alert.alert('Deactivate License', 'Are you sure you want to log out of PRO?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Deactivate', style: 'destructive', onPress: () => void pro.deactivate() },
                      ]);
                    }}
                  >
                    <Text style={styles.deactivateText}>Log Out</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* TAB 3: LOCAL PAYMENT & PROOF SUBMISSION */}
          {activeTab === 'payment' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionHeader}>1. SELECT LOCAL PAYMENT METHOD</Text>

              {/* Payment Methods */}
              {getLivePaymentChannels().map((ch) => {
                const isSelected = selectedChannel === ch.id;
                return (
                  <TouchableOpacity
                    key={ch.id}
                    style={[styles.channelCard, isSelected && styles.channelCardSelected]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedChannel(ch.id);
                    }}
                    activeOpacity={0.88}
                  >
                    <View style={styles.channelHeader}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <FontAwesome5
                          name={ch.id === 'bank' ? 'university' : 'wallet'}
                          size={15}
                          color={ch.color}
                        />
                        <Text style={styles.channelName}>{ch.name}</Text>
                        <View style={[styles.channelBadge, { backgroundColor: `${ch.color}22` }]}>
                          <Text style={[styles.channelBadgeText, { color: ch.color }]}>{ch.badge}</Text>
                        </View>
                      </View>

                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </View>

                    <View style={styles.accountBox}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.accountNumberLabel}>Account / IBAN Number:</Text>
                        <Text style={styles.accountNumberValue} selectable>
                          {ch.accountNumber}
                        </Text>
                        <Text style={styles.accountTitleValue}>Title: {ch.accountTitle}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.copyPill}
                        onPress={() => handleCopy(ch.accountNumber, ch.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={copiedField === ch.id ? 'checkmark' : 'copy-outline'}
                          size={12}
                          color="#FFFFFF"
                        />
                        <Text style={styles.copyPillText}>
                          {copiedField === ch.id ? 'Copied' : 'Copy'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.sectionHeader, { marginTop: 16 }]}>2. SUBMIT TRANSACTION ID (TID)</Text>

              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>TRANSACTION ID (FROM RECEIPT)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. TID-9823487192"
                  placeholderTextColor={COLORS.textMuted}
                  value={tidInput}
                  onChangeText={setTidInput}
                  autoCapitalize="characters"
                />

                <View style={styles.proofSummary}>
                  <Text style={styles.proofSummaryTitle}>Ready to Submit:</Text>
                  <Text style={styles.proofSummaryLine}>
                    • Plan: <Text style={{ color: '#FFFFFF' }}>{PRO_PRICING[selectedPlan].title} ({PRO_PRICING[selectedPlan].price})</Text>
                  </Text>
                  <Text style={styles.proofSummaryLine}>
                    • Device ID: <Text style={{ color: '#FFFFFF' }}>{pro.deviceId}</Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.ctaBtn, { marginTop: 16 }]}
                  onPress={handleInstantTidActivation}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={COLORS.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                  >
                    {isActivating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="flash" size={18} color="#FFFFFF" />
                    )}
                    <Text style={styles.ctaText}>
                      {isActivating ? 'Verifying Transaction...' : '⚡ Verify & Activate PRO Instantly'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ marginTop: 14, alignItems: 'center' }}
                  onPress={handleOpenWhatsAppSupport}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#25D366', fontSize: 13, fontWeight: '600' }}>
                    Need help with payment? Chat with WhatsApp Support ›
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) : 44,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    backgroundColor: COLORS.cardBg,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBgLight,
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
    color: COLORS.textPrimary,
  },
  proPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  topSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#101420',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255, 94, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 94, 58, 0.35)',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.accentPrimary,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  tabContent: {
    gap: 16,
  },
  comparisonCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 14,
    gap: 10,
  },
  compHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingBottom: 8,
  },
  compHeaderTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  compHeaderFree: {
    width: 90,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  compHeaderPro: {
    width: 90,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentPrimary,
    textAlign: 'center',
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  compFeature: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  compFeatureAccent: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  compFree: {
    width: 90,
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  compProWrap: {
    width: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  compPro: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: COLORS.accentPrimary,
    backgroundColor: '#1E2333',
  },
  popularCardHighlight: {
    borderColor: 'rgba(255, 94, 58, 0.45)',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.accentPrimary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planRadioCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: COLORS.accentPrimary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accentPrimary,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  planSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  planPriceCol: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  planPeriod: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  actionSection: {
    marginTop: 10,
    gap: 12,
  },
  ctaBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryTextBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  secondaryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  deviceIdCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    gap: 8,
  },
  deviceIdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceIdTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  deviceIdSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  deviceCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F131E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  deviceCodeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.accentPrimary,
    letterSpacing: 1.2,
  },
  deviceCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBgLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 5,
  },
  deviceCopyText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#0F131E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  devKeyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
  },
  devKeyLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
  },
  devKeyValue: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  activeStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    padding: 14,
    gap: 12,
  },
  activeStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  activeStatusSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  deactivateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deactivateText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '700',
  },
  channelCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 14,
    gap: 12,
    marginBottom: 8,
  },
  channelCardSelected: {
    borderColor: COLORS.accentPrimary,
    backgroundColor: '#1E2333',
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  channelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  channelBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  accountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F131E',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  accountNumberLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  accountNumberValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.accentPrimary,
    letterSpacing: 0.8,
  },
  accountTitleValue: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBgLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  copyPillText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  proofSummary: {
    backgroundColor: '#0F131E',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 4,
  },
  proofSummaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  proofSummaryLine: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});

