import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

type LoginView = 'login' | 'forgot' | 'reset';

function getURLParam(key: string): string {
  try {
    return new URLSearchParams(window.location.search).get(key) ?? '';
  } catch { return ''; }
}

export function Login() {
  const { login } = useAuth();

  const initialResetToken = getURLParam('reset_token');
  const [view, setView]   = useState<LoginView>(initialResetToken ? 'reset' : 'login');
  const resetToken        = initialResetToken;

  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Forgot fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent,  setForgotSent]  = useState(false);

  // Reset fields
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [resetDone, setResetDone] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function clearError() { setError(''); }

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setError('Ingresa usuario y contraseña');
      return;
    }
    setLoading(true);
    clearError();
    try {
      const data = await api.login(username.trim(), password);
      login({ access_token: data.access_token, role: data.role as 'admin' | 'user', username: data.username });
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot() {
    if (!forgotEmail.trim()) {
      setError('Ingresa tu correo electrónico');
      return;
    }
    setLoading(true);
    clearError();
    try {
      await api.forgotPassword(forgotEmail.trim());
      setForgotSent(true);
    } catch {
      setError('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (newPw !== confirmPw) { setError('Las contraseñas no coinciden'); return; }
    if (newPw.length < 8)    { setError('Mínimo 8 caracteres'); return; }
    setLoading(true);
    clearError();
    try {
      await api.resetPassword(resetToken, newPw);
      setResetDone(true);
      try { window.history.replaceState({}, '', window.location.pathname); } catch {}
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    setView('login');
    setError('');
    setForgotSent(false);
  }

  return (
    <View style={styles.root}>
      <View style={styles.card}>

        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoGlyph}>✦</Text>
          </View>
          <Text style={styles.title}>MUA Biodiversidad</Text>
        </View>
        <Text style={styles.subtitle}>Sistema de gestión de colecciones</Text>
        <View style={styles.divider} />

        {/* ── Login ──────────────────────────────────────────────────── */}
        {view === 'login' && (
          <>
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="admin"
              placeholderTextColor={Colors.ink3}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleLogin}
            />
            <Text style={[styles.label, { marginTop: Space.md }]}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.ink3}
              secureTextEntry
              onSubmitEditing={handleLogin}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.greenDeeper} size="small" />
                : <Text style={styles.btnText}>Iniciar sesión</Text>
              }
            </Pressable>
            <Pressable onPress={() => { setView('forgot'); clearError(); }}>
              <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          </>
        )}

        {/* ── Recuperar contraseña ───────────────────────────────────── */}
        {view === 'forgot' && !forgotSent && (
          <>
            <Text style={styles.viewTitle}>Recuperar contraseña</Text>
            <Text style={styles.viewDesc}>
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </Text>
            <Text style={[styles.label, { marginTop: Space.md }]}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={forgotEmail}
              onChangeText={setForgotEmail}
              placeholder="tu@correo.com"
              placeholderTextColor={Colors.ink3}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleForgot}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleForgot}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.greenDeeper} size="small" />
                : <Text style={styles.btnText}>Enviar enlace</Text>
              }
            </Pressable>
            <Pressable onPress={goToLogin}>
              <Text style={styles.link}>← Volver al inicio de sesión</Text>
            </Pressable>
          </>
        )}

        {view === 'forgot' && forgotSent && (
          <>
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✉</Text>
              <Text style={styles.successTitle}>Correo enviado</Text>
              <Text style={styles.successDesc}>
                Si ese correo está registrado, recibirás un enlace para restablecer tu contraseña en breve.
              </Text>
            </View>
            <Pressable onPress={goToLogin}>
              <Text style={styles.link}>← Volver al inicio de sesión</Text>
            </Pressable>
          </>
        )}

        {/* ── Restablecer contraseña ─────────────────────────────────── */}
        {view === 'reset' && !resetDone && (
          <>
            <Text style={styles.viewTitle}>Nueva contraseña</Text>
            <Text style={styles.viewDesc}>
              Elige una contraseña segura con al menos 8 caracteres.
            </Text>
            <Text style={[styles.label, { marginTop: Space.md }]}>Nueva contraseña</Text>
            <TextInput
              style={styles.input}
              value={newPw}
              onChangeText={setNewPw}
              secureTextEntry
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor={Colors.ink3}
            />
            <Text style={[styles.label, { marginTop: Space.md }]}>Confirmar contraseña</Text>
            <TextInput
              style={styles.input}
              value={confirmPw}
              onChangeText={setConfirmPw}
              secureTextEntry
              placeholder="Repetir contraseña"
              placeholderTextColor={Colors.ink3}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={[styles.btn, (loading || !newPw || !confirmPw) && styles.btnDisabled]}
              onPress={handleReset}
              disabled={loading || !newPw || !confirmPw}
            >
              {loading
                ? <ActivityIndicator color={Colors.greenDeeper} size="small" />
                : <Text style={styles.btnText}>Restablecer contraseña</Text>
              }
            </Pressable>
          </>
        )}

        {view === 'reset' && resetDone && (
          <>
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successTitle}>Contraseña actualizada</Text>
              <Text style={styles.successDesc}>
                Tu contraseña ha sido restablecida. Ya puedes iniciar sesión.
              </Text>
            </View>
            <Pressable style={styles.btn} onPress={goToLogin}>
              <Text style={styles.btnText}>Ir al inicio de sesión</Text>
            </Pressable>
          </>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.greenDeeper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Space.xxl,
    width: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    marginBottom: Space.xs,
  },
  logoIcon: {
    width: 36, height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlyph: { fontSize: 18, color: Colors.greenDeeper, fontWeight: '700' },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.ink,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.ink3,
    marginBottom: Space.lg,
  },
  divider: { height: 1, backgroundColor: Colors.line, marginBottom: Space.lg },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ink2,
    marginBottom: Space.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Fonts.sans,
    color: Colors.ink,
    backgroundColor: Colors.bg,
    outlineStyle: 'none',
  } as any,
  error: {
    marginTop: Space.md,
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.error,
    backgroundColor: Colors.errorBg,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderRadius: Radius.md,
  },
  btn: {
    marginTop: Space.lg,
    backgroundColor: Colors.lime,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.greenDeeper,
  },
  link: {
    marginTop: Space.md,
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.greenDeep,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  viewTitle: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: Space.xs,
  },
  viewDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink3,
    lineHeight: 19,
    marginBottom: Space.sm,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: Space.lg,
  },
  successIcon: {
    fontSize: 36,
    color: Colors.ok,
    marginBottom: Space.sm,
  },
  successTitle: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: Space.xs,
  },
  successDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink3,
    textAlign: 'center',
    lineHeight: 19,
  },
});
