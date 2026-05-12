import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { NavIcon, NavIconName } from './NavIcon';

export type Screen =
  | 'dashboard' | 'upload' | 'records' | 'admin'
  | 'taxonomia' | 'cartografia' | 'settings';

interface NavItem {
  id: Screen;
  icon: NavIconName;
  label: string;
  adminOnly?: boolean;
}

const NAV_MAIN: NavItem[] = [
  { id: 'dashboard', icon: 'grid',         label: 'Panorama' },
  { id: 'upload',    icon: 'upload-cloud', label: 'Cargar archivo' },
  { id: 'records',   icon: 'list',         label: 'Explorador' },
  { id: 'admin',     icon: 'users',        label: 'Administración', adminOnly: true },
];

const NAV_CATALOGOS: NavItem[] = [
  { id: 'taxonomia',   icon: 'layers',  label: 'Taxonomía' },
  { id: 'cartografia', icon: 'map-pin', label: 'Cartografía' },
];

function getInitials(username: string): string {
  const parts = username.split(/[\s._-]+/).filter(Boolean);
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?';
}

interface SidebarProps {
  active: Screen;
  onChange: (s: Screen) => void;
}

export function Sidebar({ active, onChange }: SidebarProps) {
  const [hovered, setHovered] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const width = hovered ? 232 : 64;

  const visibleMain = NAV_MAIN.filter(item => !item.adminOnly || isAdmin);

  function NavBtn({ item }: { item: NavItem }) {
    const isActive  = active === item.id;
    const iconColor = isActive ? Colors.lime : 'rgba(255,255,255,0.45)';
    return (
      <Pressable
        style={[styles.navItem, isActive && styles.navItemActive]}
        onPress={() => onChange(item.id)}
      >
        <View style={styles.iconWrap}>
          <NavIcon name={item.icon} size={18} color={iconColor} />
        </View>
        {hovered && (
          <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
            {item.label}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <View
      style={[styles.sidebar, { width }]}
      // @ts-ignore
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoGlyph}>✦</Text>
        </View>
        {hovered && <Text style={styles.logoText}>MUA Bio</Text>}
      </View>

      <View style={styles.divider} />

      {/* Nav items scrollables */}
      <ScrollView
        style={{ flex: 1, minHeight: 0 } as any}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Space.sm }}
      >
        {visibleMain.map(item => <NavBtn key={item.id} item={item} />)}
        <View style={[styles.divider, { marginTop: Space.sm }]} />
        {hovered && <Text style={styles.sectionLabel}>Catálogos</Text>}
        {NAV_CATALOGOS.map(item => <NavBtn key={item.id} item={item} />)}
      </ScrollView>

      {/* Footer fijo */}
      <View>
        <NavBtn item={{ id: 'settings', icon: 'sliders', label: 'Configuración' }} />
        <View style={styles.divider} />
        <View style={styles.footer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.username ?? '')}</Text>
          </View>
          {hovered && (
            <View style={styles.footerRight}>
              <Text style={styles.footerUser}>{user?.username ?? ''}</Text>
              <Text style={styles.footerRole}>{user?.role}</Text>
            </View>
          )}
        </View>
        <Pressable style={styles.navItem} onPress={logout}>
          <View style={styles.iconWrap}>
            <NavIcon name="log-out" size={18} color="rgba(255,255,255,0.35)" />
          </View>
          {hovered && <Text style={styles.logoutText}>Cerrar sesión</Text>}
        </Pressable>
        <View style={{ height: Space.sm }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    height: '100%' as any,
    flexDirection: 'column',
    backgroundColor: Colors.greenDeeper,
    paddingTop: Space.lg,
    overflow: 'hidden',
    transition: 'width 0.2s ease',
  } as any,
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: Space.md,
    gap: Space.sm,
  },
  logoIcon: {
    width: 32, height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlyph: { fontSize: 16, color: Colors.greenDeeper, fontWeight: '700' },
  logoText: {
    color: Colors.cream,
    fontFamily: Fonts.serif,
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 12,
    marginBottom: Space.sm,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: Fonts.sans,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.28)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 24,
    paddingBottom: 4,
    paddingTop: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: Radius.md,
    marginBottom: 2,
  },
  navItemActive: { backgroundColor: 'rgba(197,216,109,0.15)' },
  iconWrap: {
    width: 24, height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: 'rgba(255,255,255,0.6)',
  },
  navLabelActive: { color: Colors.cream, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: Space.sm,
    paddingTop: Space.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    marginBottom: 4,
  },
  avatar: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11, fontWeight: '700',
    color: Colors.greenDeeper,
    fontFamily: Fonts.sans,
  },
  footerRight: { gap: 1 },
  footerUser: {
    fontSize: 12, color: Colors.cream,
    fontFamily: Fonts.sans, fontWeight: '600',
  },
  footerRole: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    fontFamily: Fonts.mono,
  },
  logoutText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: 'rgba(255,255,255,0.4)',
  },
});
