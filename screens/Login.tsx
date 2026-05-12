import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setError('Ingresa usuario y contraseña');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.login(username.trim(), password);
      login({ access_token: data.access_token, role: data.role as 'admin' | 'user', username: data.username });
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setError(detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
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

        {/* Form */}
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
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlyph: {
    fontSize: 18,
    color: Colors.greenDeeper,
    fontWeight: '700',
  },
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
  divider: {
    height: 1,
    backgroundColor: Colors.line,
    marginBottom: Space.lg,
  },
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
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.greenDeeper,
  },
});
