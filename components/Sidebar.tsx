import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export type Screen = 'dashboard' | 'upload' | 'records' | 'admin';

interface NavItem {
  id: Screen;
  icon: string;
  label: string;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { id: 'dashboard', icon: '◈', label: 'Panorama' },
  { id: 'upload',    icon: '⬆', label: 'Cargar archivo' },
  { id: 'records',   icon: '⊞', label: 'Explorador' },
  { id: 'admin',     icon: '⚙', label: 'Administración', adminOnly: true },
];

interface SidebarProps {
  active: Screen;
  onChange: (s: Screen) => void;
}

export function Sidebar({ active, onChange }: SidebarProps) {
  const [hovered, setHovered] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const width = hovered ? 232 : 64;

  const visibleNav = NAV.filter(item => !item.adminOnly || isAdmin);

  return (
    <View
      style={[styles.sidebar, { width }]}
      // @ts-ignore — web-only props
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

      {/* Nav items */}
      {visibleNav.map(item => {
        const isActive = active === item.id;
        return (
          <Pressable
            key={item.id}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => onChange(item.id)}
          >
            <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
              {item.icon}
            </Text>
            {hovered && (
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            )}
          </Pressable>
        );
      })}

      <View style={{ flex: 1 }} />

      {/* Footer: user + logout */}
      <View style={styles.footer}>
        <View style={styles.avatarDot} />
        {hovered && (
          <View style={styles.footerRight}>
            <Text style={styles.footerUser}>{user?.username ?? ''}</Text>
            <Text style={styles.footerRole}>{user?.role}</Text>
          </View>
        )}
      </View>

      <Pressable
        style={styles.logoutBtn}
        onPress={logout}
        // @ts-ignore
        title="Cerrar sesión"
      >
        <Text style={styles.logoutIcon}>⏻</Text>
        {hovered && <Text style={styles.logoutText}>Cerrar sesión</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: Colors.greenDeeper,
    height: '100%' as any,
    paddingVertical: Space.lg,
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
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlyph: {
    fontSize: 16,
    color: Colors.greenDeeper,
    fontWeight: '700',
  },
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
  navItemActive: {
    backgroundColor: 'rgba(197,216,109,0.15)',
  },
  navIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.45)',
  },
  navIconActive: {
    color: Colors.lime,
  },
  navLabel: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: 'rgba(255,255,255,0.6)',
  },
  navLabelActive: {
    color: Colors.cream,
    fontWeight: '600',
  },
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
  avatarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.greenSoft,
  },
  footerRight: { gap: 1 },
  footerUser: {
    fontSize: 12,
    color: Colors.cream,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  footerRole: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    fontFamily: Fonts.mono,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: Radius.md,
    marginBottom: 2,
  },
  logoutIcon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.35)',
  },
  logoutText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: 'rgba(255,255,255,0.4)',
  },
});
