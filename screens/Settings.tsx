import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../context/AuthContext';

const DARK_KEY = 'mua_dark_mode';

export function Settings() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem(DARK_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(DARK_KEY, String(darkMode)); } catch {}
  }, [darkMode]);

  return (
    <View style={styles.root}>
      <TopBar title="Configuración" subtitle="Preferencias y estado del sistema" />
      <View style={styles.content}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apariencia</Text>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Modo oscuro</Text>
              <Text style={styles.rowSub}>Activa el tema de museo nocturno</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ true: Colors.greenDeep, false: Colors.line }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conexión API</Text>
          <View style={styles.infoCard}>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: Colors.ok }]} />
              <Text style={styles.infoLabel}>Conectado · localhost:8000</Text>
            </View>
            <Text style={styles.infoMono}>Base de datos: PostgreSQL</Text>
            <Text style={styles.infoMono}>Estándar: Darwin Core (DwC-A)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sesión</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Usuario: <Text style={styles.infoBold}>{user?.username}</Text></Text>
            <Text style={styles.infoLabel}>Rol: <Text style={styles.infoBold}>{user?.role}</Text></Text>
          </View>
          <Pressable style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>MUA Biodiversidad — Sistema de gestión de colecciones</Text>
            <Text style={styles.infoMono}>Universidad de Antioquia · Facultad de Ciencias Exactas</Text>
            <Text style={[styles.infoMono, { marginTop: Space.sm }]}>Publicado en GBIF · SiB Colombia</Text>
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Space.xl, gap: Space.xl, maxWidth: 600 },
  section: { gap: Space.sm },
  sectionTitle: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    fontWeight: '700',
    color: Colors.ink3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Space.lg,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    color: Colors.ink,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: Colors.ink3,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Space.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    gap: Space.sm,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  infoLabel: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.ink2,
  },
  infoBold: {
    fontWeight: '700',
    color: Colors.ink,
  },
  infoMono: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    color: Colors.ink3,
  },
  logoutBtn: {
    paddingVertical: Space.md,
    paddingHorizontal: Space.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.error,
    alignSelf: 'flex-start',
  },
  logoutText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    color: Colors.error,
  },
});
