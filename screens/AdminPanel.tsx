import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { TopBar } from '../components/TopBar';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { UserRecord } from '../services/types';

export function AdminPanel() {
  const { show } = useToast();
  const { user: currentUser } = useAuth();

  const [users, setUsers]           = useState<UserRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail]     = useState('');
  const [newRole, setNewRole]       = useState<'admin' | 'user'>('user');
  const [creating, setCreating]     = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listUsers();
      setUsers(data);
    } catch {
      show('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleCreate() {
    if (!newUsername.trim() || !newEmail.trim()) {
      show('Completa usuario y correo electrónico', 'warning');
      return;
    }
    setCreating(true);
    try {
      await api.createUser({ username: newUsername.trim(), email: newEmail.trim(), role: newRole });
      show(`Invitación enviada a ${newEmail.trim()}`, 'success');
      setNewUsername('');
      setNewEmail('');
      setNewRole('user');
      fetchUsers();
    } catch (e: any) {
      show(e?.response?.data?.detail || 'Error al crear usuario', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(u: UserRecord) {
    try {
      await api.deleteUser(u.id);
      show(`Usuario '${u.username}' eliminado`, 'success');
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (e: any) {
      show(e?.response?.data?.detail || 'Error al eliminar', 'error');
    }
  }

  return (
    <View style={styles.root}>
      <TopBar title="Administración" subtitle="Gestión de usuarios del sistema" />

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>

        {/* Create user form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crear usuario</Text>
          <View style={styles.formRow}>
            <View style={styles.field}>
              <Text style={styles.label}>Usuario</Text>
              <TextInput
                style={styles.input}
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder="nombre_usuario"
                placeholderTextColor={Colors.ink3}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="usuario@correo.com"
                placeholderTextColor={Colors.ink3}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.fieldNarrow}>
              <Text style={styles.label}>Rol</Text>
              <View style={styles.pillRow}>
                <Pressable
                  style={[styles.pill, newRole === 'user' && styles.pillActive]}
                  onPress={() => setNewRole('user')}
                >
                  <Text style={[styles.pillText, newRole === 'user' && styles.pillTextActive]}>
                    Usuario
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.pill, newRole === 'admin' && styles.pillActive]}
                  onPress={() => setNewRole('admin')}
                >
                  <Text style={[styles.pillText, newRole === 'admin' && styles.pillTextActive]}>
                    Admin
                  </Text>
                </Pressable>
              </View>
            </View>
            <Pressable
              style={[styles.createBtn, creating && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={creating}
            >
              {creating
                ? <ActivityIndicator size="small" color={Colors.greenDeeper} />
                : <Text style={styles.createBtnText}>+ Crear</Text>
              }
            </Pressable>
          </View>
        </View>

        {/* Users list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usuarios activos</Text>

          {loading ? (
            <ActivityIndicator color={Colors.greenDeep} style={{ marginTop: Space.xl }} />
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colUsername, styles.headerCell]}>Usuario</Text>
                <Text style={[styles.colEmail,    styles.headerCell]}>Correo</Text>
                <Text style={[styles.colRole,     styles.headerCell]}>Rol</Text>
                <Text style={[styles.colStatus,   styles.headerCell]}>Estado</Text>
                <Text style={[styles.colAction,   styles.headerCell]} />
              </View>

              {users.map(u => {
                const isSelf = u.id === (currentUser as any)?.id;
                return (
                  <View key={u.id} style={styles.tableRow}>
                    <Text style={[styles.colUsername, styles.cell]}>{u.username}</Text>
                    <Text style={[styles.colEmail, styles.cellMono]} numberOfLines={1}>{u.email ?? '—'}</Text>
                    <View style={styles.colRole}>
                      <View style={[styles.roleBadge, u.role === 'admin' && styles.roleBadgeAdmin]}>
                        <Text style={[styles.roleBadgeText, u.role === 'admin' && styles.roleBadgeTextAdmin]}>
                          {u.role}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.colStatus}>
                      <View style={[styles.statusDot, !u.is_active && styles.statusDotOff]} />
                      <Text style={styles.cell}>{u.is_active ? 'Activo' : 'Pendiente'}</Text>
                    </View>
                    <View style={styles.colAction}>
                      {!isSelf && (
                        <Pressable style={styles.deleteBtn} onPress={() => handleDelete(u)}>
                          <Text style={styles.deleteBtnText}>Eliminar</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}

              {users.length === 0 && (
                <Text style={styles.empty}>No hay usuarios registrados.</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  body: { flex: 1 },
  bodyContent: { padding: Space.xl, gap: Space.xl },

  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Space.xl,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: Space.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Space.md,
    flexWrap: 'wrap',
  },
  field: { flex: 1, minWidth: 160 },
  fieldNarrow: { minWidth: 120 },
  label: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    color: Colors.ink3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.ink,
    backgroundColor: Colors.bg,
    outlineStyle: 'none',
  } as any,
  pillRow: { flexDirection: 'row', gap: 4 },
  pill: {
    paddingHorizontal: Space.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.bg,
  },
  pillActive: {
    backgroundColor: Colors.greenDeep,
    borderColor: Colors.greenDeep,
  },
  pillText: { fontSize: 12, fontFamily: Fonts.sans, color: Colors.ink2 },
  pillTextActive: { color: Colors.cream, fontWeight: '600' },

  createBtn: {
    backgroundColor: Colors.lime,
    borderRadius: Radius.md,
    paddingHorizontal: Space.lg,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    alignSelf: 'flex-end',
  },
  btnDisabled: { opacity: 0.55 },
  createBtnText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.greenDeeper,
  },

  table: { gap: 0 },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: Space.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface2,
  },
  headerCell: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    color: Colors.ink3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cell: { fontSize: 13, fontFamily: Fonts.sans, color: Colors.ink },
  colUsername: { flex: 2 },
  colEmail:    { flex: 3 },
  colRole:     { flex: 1, flexDirection: 'row', alignItems: 'center' },
  colStatus:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  colAction:   { width: 80, alignItems: 'flex-end' },
  cellMono:    { fontSize: 12, fontFamily: 'monospace', color: Colors.ink3 },

  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentSoft,
  },
  roleBadgeAdmin: { backgroundColor: Colors.lime },
  roleBadgeText: { fontSize: 11, fontFamily: Fonts.sans, color: Colors.ink2, fontWeight: '600' },
  roleBadgeTextAdmin: { color: Colors.greenDeeper },

  statusDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.ok,
  },
  statusDotOff: { backgroundColor: Colors.ink3 },

  deleteBtn: {
    paddingHorizontal: Space.sm,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteBtnText: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    color: Colors.error,
    fontWeight: '600',
  },

  empty: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink3,
    paddingVertical: Space.lg,
    textAlign: 'center',
  },
});
