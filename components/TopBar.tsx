import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';

interface TopBarProps {
  title: string;
  subtitle?: string;
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  right?: React.ReactNode;
}

export function TopBar({ title, subtitle, search, right }: TopBarProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.titles}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.right}>
        {search && (
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              style={styles.searchInput}
              value={search.value}
              onChangeText={search.onChange}
              placeholder={search.placeholder ?? 'Buscar…'}
              placeholderTextColor={Colors.ink3}
            />
          </View>
        )}
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.xl,
    paddingVertical: Space.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    backgroundColor: Colors.surface,
  },
  titles: {
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.serif,
    fontWeight: '700',
    color: Colors.ink,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: Colors.ink3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: Radius.full,
    paddingHorizontal: Space.md,
    paddingVertical: Space.xs,
    borderWidth: 1,
    borderColor: Colors.line,
    gap: Space.xs,
    minWidth: 220,
  },
  searchIcon: {
    fontSize: 14,
    color: Colors.ink3,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.ink,
    outlineStyle: 'none' as any,
  },
});
