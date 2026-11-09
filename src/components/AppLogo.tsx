import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface AppLogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  showBorder?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 40,
  style,
  showBorder = true,
}) => {
  const borderRadius = Math.round(size * 0.28);
  const iconSize = Math.round(size * 0.52);

  return (
    <View
      style={[
        styles.outerFrame,
        {
          width: size,
          height: size,
          borderRadius: borderRadius,
        },
        showBorder && styles.withBorder,
        style,
      ]}
    >
      <LinearGradient
        colors={COLORS.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            borderRadius: borderRadius - 1,
          },
        ]}
      >
        <Ionicons name="arrow-down" size={iconSize} color="#FFFFFF" />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  outerFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
  },
  withBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#FF5E3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

