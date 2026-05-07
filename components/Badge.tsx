import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';

type Variant = 'ok' | 'warn' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: Variant;
}

const variantStyles: Record<Variant, { bg: string; color: string }> = {
  ok:      { bg: Colors.okBg,    color: Colors.ok },
  warn:    { bg: Colors.warnBg,  color: Colors.warn },
  error:   { bg: Colors.errorBg, color: Colors.error },
  neutral: { bg: Colors.surface2, color: Colors.ink2 },
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const { bg, color } = variantStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Space.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
