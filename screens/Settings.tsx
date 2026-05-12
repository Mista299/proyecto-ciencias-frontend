import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Switch, Pressable,
  TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

const DARK_KEY = 'mua_dark_mode';

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

export function Settings() {
  const { user, logout, updateUser } = useAuth();
  const { show } = useToast();

  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem(DARK_KEY) === 'true'; } catch { return false; }
  });

  // Email form
  const [email, setEmail] = useState(user?.email ?? '');
  const [savingEmail, setSavingEmail] = useState(false);

  // Password form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  // API status
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  useEffect(() => {
    api.getCalidad()
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));
  }, []);

  useEffect(() => {
    try { localStorage.setItem(DARK_KEY, String(darkMode)); } catch {}
  }, [darkMode]);

  async function handleSaveEmail() {
    const trimmed = email.trim();
    setSavingEmail(true);
    try {
      const res = await api.updateProfile({ email: trimmed || null });
      updateUser({ email: res.email ?? undefined });
      show('Correo actualizado', 'success');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      show(detail ?? 'Error al guardar el correo', 'error');
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleChangePassword() {
    if (newPw !== confirmPw) {
      show('Las contraseñas nuevas no coinciden', 'error');
      return;
    }
    if (newPw.length < 8) {
      show('La nueva contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }
    setSavingPw(true);
    try {
      await api.updateProfile({ current_password: currentPw, new_password: newPw });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      show('Contraseña actualizada', 'success');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      show(detail ?? 'Error al cambiar la contraseña', 'error');
    } finally {
      setSavingPw(false);
    }
  }

  const emailDirty = email.trim() !== (user?.email ?? '');

  return (
    <View style={styles.root}>
      <TopBar title="Configuración" subtitle="Cuenta y preferencias" />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Mi cuenta ──────────────────────────────────────────────── */}
        <SectionTitle>Mi cuenta</SectionTitle>

        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(user?.username ?? '?')}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileUsername}>{user?.username}</Text>
            <View style={[styles.roleBadge, user?.role === 'admin' ? styles.roleAdmin : styles.roleUser]}>
              <Text style={[styles.roleBadgeText, user?.role === 'admin' ? styles.roleAdminText : styles.roleUserText]}>
                {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
              </Text>
            </View>
          </View>
        </View>

        {/* Email */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Correo electrónico</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              placeholderTextColor={Colors.ink3}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={[styles.saveBtn, !emailDirty && styles.saveBtnDisabled]}
              onPress={handleSaveEmail}
              disabled={!emailDirty || savingEmail}
            >
              {savingEmail
                ? <ActivityIndicator size="small" color={Colors.greenDeep} />
                : <Text style={[styles.saveBtnText, !emailDirty && styles.saveBtnTextDisabled]}>Guardar</Text>
              }
            </Pressable>
          </View>
        </View>

        {/* ── Cambiar contraseña ─────────────────────────────────────── */}
        <SectionTitle>Cambiar contraseña</SectionTitle>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Contraseña actual</Text>
          <TextInput
            style={[styles.input, styles.inputBlock]}
            value={currentPw}
            onChangeText={setCurrentPw}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={Colors.ink3}
          />
          <Text style={[styles.fieldLabel, { marginTop: Space.md }]}>Nueva contraseña</Text>
          <TextInput
            style={[styles.input, styles.inputBlock]}
            value={newPw}
            onChangeText={setNewPw}
            secureTextEntry
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor={Colors.ink3}
          />
          <Text style={[styles.fieldLabel, { marginTop: Space.md }]}>Confirmar nueva contraseña</Text>
          <TextInput
            style={[styles.input, styles.inputBlock]}
            value={confirmPw}
            onChangeText={setConfirmPw}
            secureTextEntry
            placeholder="Repetir contraseña"
            placeholderTextColor={Colors.ink3}
          />
          <Pressable
            style={[styles.primaryBtn, { marginTop: Space.lg }]}
            onPress={handleChangePassword}
            disabled={savingPw || !currentPw || !newPw || !confirmPw}
          >
            {savingPw
              ? <ActivityIndicator size="small" color={Colors.greenDeep} />
              : <Text style={styles.primaryBtnText}>Actualizar contraseña</Text>
            }
          </Pressable>
        </View>

        {/* ── Apariencia ─────────────────────────────────────────────── */}
        <SectionTitle>Apariencia</SectionTitle>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Modo oscuro</Text>
              <Text style={styles.switchSub}>Tema de museo nocturno</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ true: Colors.greenDeep, false: Colors.line }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ── Sistema ────────────────────────────────────────────────── */}
        <SectionTitle>Sistema</SectionTitle>

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={[styles.dot, {
              backgroundColor: apiOk === null ? Colors.ink3 : apiOk ? Colors.ok : Colors.error,
            }]} />
            <Text style={styles.statusText}>
              {apiOk === null ? 'Verificando conexión…' : apiOk ? 'API conectada · localhost:8000' : 'API no disponible'}
            </Text>
          </View>
          <Text style={styles.infoMono}>Base de datos: PostgreSQL</Text>
          <Text style={styles.infoMono}>Estándar: Darwin Core (DwC-A)</Text>
          <Text style={styles.infoMono}>Publicado en GBIF · SiB Colombia</Text>
        </View>

        {/* ── Sesión ─────────────────────────────────────────────────── */}
        <SectionTitle>Sesión</SectionTitle>

        <View style={styles.card}>
          <Pressable style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </Pressable>
        </View>

        <View style={{ height: Space.xxl }} />
      </ScrollView>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={sectionTitleStyle}>{children}</Text>;
}

const sectionTitleStyle: import('react-native').TextStyle = {
  fontSize: 11,
  fontFamily: Fonts.sans,
  fontWeight: '700',
  color: Colors.ink3,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  marginBottom: 2,
  marginTop: Space.xl,
};

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bg },
  scroll:  { paddingHorizontal: Space.xl, paddingBottom: Space.xl, maxWidth: 560 },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Space.lg,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.greenDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 20,
    color: Colors.cream,
  },
  profileMeta: { gap: Space.xs },
  profileUsername: {
    fontSize: 17,
    fontFamily: Fonts.sans,
    fontWeight: '700',
    color: Colors.ink,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Space.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  roleAdmin:     { backgroundColor: Colors.lime },
  roleUser:      { backgroundColor: Colors.accentSoft },
  roleBadgeText: { fontSize: 11, fontFamily: Fonts.sans, fontWeight: '700' },
  roleAdminText: { color: Colors.greenDeeper },
  roleUserText:  { color: Colors.greenDeep },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Space.lg,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    color: Colors.ink3,
    marginBottom: Space.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
    backgroundColor: Colors.bg,
  },
  inputBlock: {
    flex: undefined,
    width: '100%',
  },
  saveBtn: {
    height: 40,
    paddingHorizontal: Space.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.greenDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    borderColor: Colors.line,
  },
  saveBtnText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    color: Colors.greenDeep,
  },
  saveBtnTextDisabled: {
    color: Colors.ink3,
  },
  primaryBtn: {
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.greenDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    fontWeight: '700',
    color: Colors.cream,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    color: Colors.ink,
  },
  switchSub: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: Colors.ink3,
    marginTop: 2,
  },

  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: Space.sm, marginBottom: Space.sm },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontFamily: Fonts.sans, color: Colors.ink2 },
  infoMono:   { fontSize: 12, fontFamily: Fonts.mono, color: Colors.ink3, marginTop: 2 },

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
