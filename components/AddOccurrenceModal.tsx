import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { Occurrence } from '../services/types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

const COLLECTIONS = ['MUA-MAM', 'MUA-ANF', 'MUA-AVE', 'MUA-REP'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: (occ: Occurrence) => void;
}

type FormData = {
  catalogNumber: string;
  collectionCode: string;
  occurrenceStatus: string;
  disposition: string;
  sex: string;
  recordedBy: string;
  scientificName: string;
  family: string;
  genus: string;
  eventDate: string;
  habitat: string;
  country: string;
  stateProvince: string;
  locality: string;
  decimalLatitude: string;
  decimalLongitude: string;
};

const EMPTY: FormData = {
  catalogNumber: '', collectionCode: 'MUA-MAM', occurrenceStatus: 'PRESENT',
  disposition: 'En colección', sex: '', recordedBy: '',
  scientificName: '', family: '', genus: '',
  eventDate: '', habitat: '',
  country: 'Colombia', stateProvince: '', locality: '',
  decimalLatitude: '', decimalLongitude: '',
};

function Field({
  label, value, onChange, placeholder, numeric, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; numeric?: boolean; required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}{required && <Text style={{ color: Colors.error }}> *</Text>}
      </Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? ''}
        placeholderTextColor={Colors.ink3}
        keyboardType={numeric ? 'numeric' : 'default'}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function AddOccurrenceModal({ visible, onClose, onCreated }: Props) {
  const { show } = useToast();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(key: keyof FormData) {
    return (v: string) => setForm(f => ({ ...f, [key]: v }));
  }

  function reset() {
    setForm(EMPTY);
    setError('');
  }

  async function handleCreate() {
    if (!form.catalogNumber.trim()) {
      setError('El número de catálogo es obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        catalogNumber:    form.catalogNumber.trim(),
        collectionCode:   form.collectionCode,
        occurrenceStatus: form.occurrenceStatus,
        basisOfRecord:    'PreservedSpecimen',
        disposition:      form.disposition   || undefined,
        sex:              form.sex           || undefined,
        recordedBy:       form.recordedBy    || undefined,
        scientificName:   form.scientificName || undefined,
        family:           form.family        || undefined,
        genus:            form.genus         || undefined,
        eventDate:        form.eventDate      || undefined,
        habitat:          form.habitat        || undefined,
        country:          form.country        || undefined,
        stateProvince:    form.stateProvince  || undefined,
        locality:         form.locality       || undefined,
        decimalLatitude:  form.decimalLatitude  ? parseFloat(form.decimalLatitude)  : undefined,
        decimalLongitude: form.decimalLongitude ? parseFloat(form.decimalLongitude) : undefined,
      };
      const created = await api.createOccurrence(payload);
      show(`Registro creado: ${form.scientificName || form.catalogNumber}`, 'success');
      onCreated(created);
      reset();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.detail;
      const errorMsg = typeof msg === 'string' ? msg : 'No se pudo crear el registro.';
      setError(errorMsg);
      show(errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Nuevo espécimen</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeX}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Section title="Identificación del registro">
              {/* Collection pills */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  Colección<Text style={{ color: Colors.error }}> *</Text>
                </Text>
                <View style={styles.pillRow}>
                  {COLLECTIONS.map(c => (
                    <Pressable
                      key={c}
                      style={[styles.pill, form.collectionCode === c && styles.pillActive]}
                      onPress={() => setForm(f => ({ ...f, collectionCode: c }))}
                    >
                      <Text style={[styles.pillText, form.collectionCode === c && styles.pillTextActive]}>
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Field label="Número de catálogo" value={form.catalogNumber} onChange={set('catalogNumber')}
                placeholder={`Ej: 12345`} required />
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Field label="Estado" value={form.occurrenceStatus} onChange={set('occurrenceStatus')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Disposición" value={form.disposition} onChange={set('disposition')} />
                </View>
              </View>
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Field label="Sexo" value={form.sex} onChange={set('sex')} placeholder="M / F / Indeterminado" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Colectado por" value={form.recordedBy} onChange={set('recordedBy')} />
                </View>
              </View>
            </Section>

            <Section title="Taxón">
              <Field label="Nombre científico" value={form.scientificName} onChange={set('scientificName')}
                placeholder="Ej: Brycon henni" />
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Field label="Familia" value={form.family} onChange={set('family')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Género" value={form.genus} onChange={set('genus')} />
                </View>
              </View>
            </Section>

            <Section title="Evento de colecta">
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Field label="Fecha (YYYY-MM-DD)" value={form.eventDate} onChange={set('eventDate')}
                    placeholder="2024-03-15" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Hábitat" value={form.habitat} onChange={set('habitat')} />
                </View>
              </View>
            </Section>

            <Section title="Ubicación">
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Field label="País" value={form.country} onChange={set('country')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Departamento" value={form.stateProvince} onChange={set('stateProvince')} />
                </View>
              </View>
              <Field label="Localidad" value={form.locality} onChange={set('locality')} />
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Field label="Latitud decimal" value={form.decimalLatitude} onChange={set('decimalLatitude')} numeric />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Longitud decimal" value={form.decimalLongitude} onChange={set('decimalLongitude')} numeric />
                </View>
              </View>
            </Section>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {error
              ? <Text style={styles.errorText}>{error}</Text>
              : <View style={{ flex: 1 }} />
            }
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleCreate}
              disabled={saving}
              style={[styles.createBtn, saving && styles.createBtnDisabled]}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.createBtnText}>Crear registro</Text>
              }
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28,38,32,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '90%' as any,
    maxWidth: 640,
    maxHeight: '90%' as any,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Space.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  title: {
    fontSize: 17,
    fontFamily: Fonts.sans,
    fontWeight: '700',
    color: Colors.ink,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: { fontSize: 12, color: Colors.ink3 },
  body: { flex: 1 },
  bodyContent: { padding: Space.xl, gap: Space.xl },
  section: { gap: Space.sm },
  sectionTitle: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    fontWeight: '700',
    color: Colors.greenDeep,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Space.xs,
    paddingBottom: Space.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  field: { gap: 4 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    color: Colors.ink3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.ink,
    backgroundColor: Colors.surface2,
    outlineStyle: 'none',
  } as any,
  row2: { flexDirection: 'row', gap: Space.md },
  pillRow: { flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap' },
  pill: {
    paddingVertical: 5, paddingHorizontal: Space.md,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.line,
    backgroundColor: Colors.surface2,
  },
  pillActive: { backgroundColor: Colors.greenDeep, borderColor: Colors.greenDeep },
  pillText: { fontSize: 12, fontFamily: Fonts.sans, color: Colors.ink2 },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Space.lg,
    gap: Space.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: Colors.surface,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: Colors.error,
    fontFamily: Fonts.sans,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: Space.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  cancelBtnText: {
    fontSize: 13,
    color: Colors.ink2,
    fontFamily: Fonts.sans,
  },
  createBtn: {
    paddingVertical: 8,
    paddingHorizontal: Space.xl,
    backgroundColor: Colors.greenDeep,
    borderRadius: Radius.md,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: {
    fontSize: 13,
    color: '#fff',
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
});
