import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { Occurrence } from '../services/types';
import { api } from '../services/api';
import { Badge } from './Badge';
import { useToast } from '../context/ToastContext';

const TABS = ['Registro', 'Taxón', 'Evento', 'Ubicación', 'Identificación'] as const;
type Tab = typeof TABS[number];

interface Props {
  occurrence: Occurrence | null;
  onClose: () => void;
  onSaved?: (updated: Occurrence) => void;
  onDeleted?: (id: string) => void;
}

function Row({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

function EditRow({
  label, value, onChange, numeric,
}: {
  label: string; value?: string | number; onChange: (v: string) => void; numeric?: boolean;
}) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={styles.editField}>
      <Text style={styles.editFieldLabel}>{label}</Text>
      <TextInput
        style={[styles.editFieldInput, focused && styles.editFieldInputFocused]}
        value={value != null ? String(value) : ''}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType={numeric ? 'numeric' : 'default'}
        placeholderTextColor={Colors.ink3}
        placeholder="Vacío"
      />
    </View>
  );
}

type DraftOcc = {
  occurrenceStatus?: string; disposition?: string; sex?: string; recordedBy?: string;
  scientificName?: string; taxonRank?: string; family?: string; genus?: string;
  eventDate?: string; habitat?: string;
  country?: string; stateProvince?: string; county?: string; locality?: string;
  decimalLatitude?: string; decimalLongitude?: string;
  identifiedBy?: string; dateIdentified?: string; verificationStatus?: string;
};

export function SpecimenModal({ occurrence, onClose, onSaved, onDeleted }: Props) {
  const { show } = useToast();
  const [tab, setTab]           = useState<Tab>('Registro');
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState<DraftOcc>({});
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setEditing(false);
    setDraft({});
    setSaveError('');
    setConfirmDelete(false);
    setTab('Registro');
  }, [occurrence?.occurrenceID]);

  if (!occurrence) return null;

  function initDraft() {
    setDraft({
      occurrenceStatus: occurrence!.occurrenceStatus,
      disposition:   occurrence!.disposition ?? '',
      sex:           occurrence!.sex ?? '',
      recordedBy:    occurrence!.recordedBy ?? '',
      scientificName: occurrence!.taxon?.scientificName ?? '',
      taxonRank:     occurrence!.taxon?.taxonRank ?? '',
      family:        occurrence!.taxon?.family ?? '',
      genus:         occurrence!.taxon?.genus ?? '',
      eventDate:     occurrence!.event?.eventDate ?? '',
      habitat:       occurrence!.event?.habitat ?? '',
      country:       occurrence!.location?.country ?? '',
      stateProvince: occurrence!.location?.stateProvince ?? '',
      county:        occurrence!.location?.county ?? '',
      locality:      occurrence!.location?.locality ?? '',
      decimalLatitude:  occurrence!.location?.decimalLatitude != null ? String(occurrence!.location.decimalLatitude) : '',
      decimalLongitude: occurrence!.location?.decimalLongitude != null ? String(occurrence!.location.decimalLongitude) : '',
      identifiedBy:       occurrence!.identification?.identifiedBy ?? '',
      dateIdentified:     occurrence!.identification?.dateIdentified ?? '',
      verificationStatus: occurrence!.identification?.verificationStatus ?? '',
    });
    setEditing(true);
    setSaveError('');
    setConfirmDelete(false);
  }

  function set(key: keyof DraftOcc) {
    return (v: string) => setDraft(d => ({ ...d, [key]: v }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      const id = occurrence!.occurrenceID;
      let updated: Occurrence | undefined;
      if (tab === 'Registro') {
        updated = await api.updateOccurrence(id, {
          occurrenceStatus: draft.occurrenceStatus || undefined,
          disposition:      draft.disposition      || undefined,
          sex:              draft.sex              || undefined,
          recordedBy:       draft.recordedBy       || undefined,
        });
      } else if (tab === 'Taxón') {
        updated = await api.updateTaxon(id, {
          scientificName: draft.scientificName || undefined,
          taxonRank:      draft.taxonRank      || undefined,
          family:         draft.family         || undefined,
          genus:          draft.genus          || undefined,
        });
      } else if (tab === 'Evento') {
        updated = await api.updateEvent(id, {
          eventDate: draft.eventDate || undefined,
          habitat:   draft.habitat   || undefined,
        });
      } else if (tab === 'Ubicación') {
        updated = await api.updateLocation(id, {
          country:          draft.country       || undefined,
          stateProvince:    draft.stateProvince || undefined,
          county:           draft.county        || undefined,
          locality:         draft.locality      || undefined,
          decimalLatitude:  draft.decimalLatitude  ? parseFloat(draft.decimalLatitude)  : undefined,
          decimalLongitude: draft.decimalLongitude ? parseFloat(draft.decimalLongitude) : undefined,
        });
      } else if (tab === 'Identificación') {
        updated = await api.updateIdentification(id, {
          identifiedBy:       draft.identifiedBy       || undefined,
          dateIdentified:     draft.dateIdentified      || undefined,
          verificationStatus: draft.verificationStatus  || undefined,
        });
      }
      if (updated) {
        onSaved?.(updated);
        show('Cambios guardados correctamente', 'success');
        setEditing(false);
      }
    } catch {
      setSaveError('No se pudo guardar. Intenta de nuevo.');
      show('Error al guardar los cambios', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const name = occurrence!.taxon?.scientificName ?? occurrence!.catalogNumber;
    try {
      await api.deleteOccurrence(occurrence!.occurrenceID);
      show(`Registro eliminado: ${name}`, 'success');
      onDeleted?.(occurrence!.occurrenceID);
      onClose();
    } catch {
      show('No se pudo eliminar el registro', 'error');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: Space.md }}>
              <Text style={styles.sciName} numberOfLines={2}>
                {occurrence.taxon?.scientificName ?? '—'}
              </Text>
              <Text style={styles.catalogNum}>{occurrence.catalogNumber}</Text>
            </View>
            <View style={styles.headerRight}>
              <Badge
                label={occurrence.occurrenceStatus}
                variant={occurrence.occurrenceStatus === 'PRESENT' ? 'ok' : 'neutral'}
              />
              {occurrence.disposition && (
                <Badge
                  label={occurrence.disposition}
                  variant={occurrence.disposition === 'Extraviado' ? 'error' : 'neutral'}
                />
              )}
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeX}>✕</Text>
              </Pressable>
            </View>
          </View>

          {/* Tabs + actions */}
          <View style={styles.tabsBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {TABS.map(t => (
                <Pressable
                  key={t}
                  style={[styles.tab, tab === t && styles.tabActive]}
                  onPress={() => setTab(t)}
                >
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.tabActions}>
              {!editing ? (
                <Pressable onPress={initDraft} style={styles.actionBtn}>
                  <Text style={styles.actionBtnEdit}>✎ Editar</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => setEditing(false)} style={styles.actionBtn}>
                  <Text style={styles.actionBtnCancel}>Cancelar</Text>
                </Pressable>
              )}
              <View style={styles.divider} />
              {!confirmDelete ? (
                <Pressable onPress={() => { setConfirmDelete(true); setEditing(false); }} style={styles.actionBtn}>
                  <Text style={styles.actionBtnDelete}>✕ Eliminar</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleDelete}
                  disabled={deleting}
                  style={[styles.actionBtn, styles.confirmDeleteBtn]}
                >
                  {deleting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.confirmDeleteText}>¿Confirmar?</Text>
                  }
                </Pressable>
              )}
            </View>
          </View>

          {/* Delete warning */}
          {confirmDelete && !deleting && (
            <View style={styles.deleteWarn}>
              <Text style={styles.deleteWarnText}>
                Esta acción eliminará permanentemente el registro. No se puede deshacer.
              </Text>
              <Pressable onPress={() => setConfirmDelete(false)}>
                <Text style={styles.deleteWarnCancel}>Cancelar</Text>
              </Pressable>
            </View>
          )}

          {/* Content */}
          <ScrollView
            style={[styles.body, editing && styles.bodyEditing]}
            contentContainerStyle={{ padding: Space.xl, gap: editing ? Space.sm : 0 }}
          >
            {tab === 'Registro' && (editing ? (
              <>
                <Row label="occurrenceID"   value={occurrence.occurrenceID} />
                <Row label="catalogNumber"  value={occurrence.catalogNumber} />
                <Row label="collectionCode" value={occurrence.collectionCode} />
                <Row label="basisOfRecord"  value={occurrence.basisOfRecord} />
                <EditRow label="occurrenceStatus" value={draft.occurrenceStatus} onChange={set('occurrenceStatus')} />
                <EditRow label="disposition"      value={draft.disposition}      onChange={set('disposition')} />
                <EditRow label="sex"              value={draft.sex}              onChange={set('sex')} />
                <EditRow label="recordedBy"       value={draft.recordedBy}       onChange={set('recordedBy')} />
              </>
            ) : (
              <>
                <Row label="occurrenceID"     value={occurrence.occurrenceID} />
                <Row label="catalogNumber"    value={occurrence.catalogNumber} />
                <Row label="collectionCode"   value={occurrence.collectionCode} />
                <Row label="basisOfRecord"    value={occurrence.basisOfRecord} />
                <Row label="occurrenceStatus" value={occurrence.occurrenceStatus} />
                <Row label="disposition"      value={occurrence.disposition} />
                <Row label="sex"              value={occurrence.sex} />
                <Row label="recordedBy"       value={occurrence.recordedBy} />
              </>
            ))}
            {tab === 'Taxón' && (editing ? (
              <>
                <EditRow label="scientificName" value={draft.scientificName} onChange={set('scientificName')} />
                <EditRow label="taxonRank"       value={draft.taxonRank}      onChange={set('taxonRank')} />
                <EditRow label="family"          value={draft.family}         onChange={set('family')} />
                <EditRow label="genus"           value={draft.genus}          onChange={set('genus')} />
              </>
            ) : (
              <>
                <Row label="scientificName" value={occurrence.taxon?.scientificName} />
                <Row label="taxonRank"      value={occurrence.taxon?.taxonRank} />
                <Row label="family"         value={occurrence.taxon?.family} />
                <Row label="genus"          value={occurrence.taxon?.genus} />
              </>
            ))}
            {tab === 'Evento' && (editing ? (
              <>
                <EditRow label="eventDate" value={draft.eventDate} onChange={set('eventDate')} />
                <EditRow label="habitat"   value={draft.habitat}   onChange={set('habitat')} />
              </>
            ) : (
              <>
                <Row label="eventDate" value={occurrence.event?.eventDate} />
                <Row label="habitat"   value={occurrence.event?.habitat} />
              </>
            ))}
            {tab === 'Ubicación' && (editing ? (
              <>
                <EditRow label="country"          value={draft.country}          onChange={set('country')} />
                <EditRow label="stateProvince"    value={draft.stateProvince}    onChange={set('stateProvince')} />
                <EditRow label="county"           value={draft.county}           onChange={set('county')} />
                <EditRow label="locality"         value={draft.locality}         onChange={set('locality')} />
                <EditRow label="decimalLatitude"  value={draft.decimalLatitude}  onChange={set('decimalLatitude')}  numeric />
                <EditRow label="decimalLongitude" value={draft.decimalLongitude} onChange={set('decimalLongitude')} numeric />
              </>
            ) : (
              <>
                <Row label="country"          value={occurrence.location?.country} />
                <Row label="stateProvince"    value={occurrence.location?.stateProvince} />
                <Row label="county"           value={occurrence.location?.county} />
                <Row label="locality"         value={occurrence.location?.locality} />
                <Row label="decimalLatitude"  value={occurrence.location?.decimalLatitude} />
                <Row label="decimalLongitude" value={occurrence.location?.decimalLongitude} />
              </>
            ))}
            {tab === 'Identificación' && (editing ? (
              <>
                <EditRow label="identifiedBy"       value={draft.identifiedBy}       onChange={set('identifiedBy')} />
                <EditRow label="dateIdentified"     value={draft.dateIdentified}      onChange={set('dateIdentified')} />
                <EditRow label="verificationStatus" value={draft.verificationStatus}  onChange={set('verificationStatus')} />
              </>
            ) : (
              occurrence.identification ? (
                <>
                  <Row label="identifiedBy"       value={occurrence.identification.identifiedBy} />
                  <Row label="dateIdentified"      value={occurrence.identification.dateIdentified} />
                  <Row label="verificationStatus"  value={occurrence.identification.verificationStatus} />
                </>
              ) : (
                <Text style={styles.placeholder}>Sin datos de identificación.</Text>
              )
            ))}
          </ScrollView>

          {/* Save bar */}
          {editing && (
            <View style={styles.saveBar}>
              {saveError
                ? <Text style={styles.saveError}>{saveError}</Text>
                : <View style={{ flex: 1 }} />
              }
              <Pressable
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.saveBtnText}>Guardar</Text>
                }
              </Pressable>
            </View>
          )}
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
    maxWidth: 680,
    maxHeight: '88%' as any,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Space.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  sciName: {
    fontSize: 18,
    fontFamily: Fonts.serif,
    fontStyle: 'italic',
    color: Colors.ink,
    fontWeight: '700',
  },
  catalogNum: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    color: Colors.ink3,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    flexShrink: 0,
  },
  closeBtn: {
    marginLeft: Space.sm,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: { fontSize: 12, color: Colors.ink3 },
  tabsBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  tabsScroll: {
    paddingHorizontal: Space.lg,
    alignItems: 'stretch',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: Space.md,
    marginRight: 2,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.greenDeep,
  },
  tabText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.ink3,
  },
  tabTextActive: {
    color: Colors.greenDeep,
    fontWeight: '600',
  },
  tabActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.sm,
    borderLeftWidth: 1,
    borderLeftColor: Colors.line,
    gap: 2,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: Space.sm,
    borderRadius: Radius.sm,
  },
  actionBtnEdit: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: Colors.greenDeep,
    fontWeight: '600',
  },
  actionBtnCancel: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: Colors.ink3,
  },
  actionBtnDelete: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: Colors.error,
  },
  confirmDeleteBtn: {
    backgroundColor: Colors.error,
    paddingHorizontal: Space.md,
  },
  confirmDeleteText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: '#fff',
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.line,
    marginHorizontal: 2,
  },
  deleteWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.errorBg,
    paddingHorizontal: Space.xl,
    paddingVertical: Space.sm,
    gap: Space.md,
  },
  deleteWarnText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: Colors.error,
  },
  deleteWarnCancel: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: Colors.ink2,
    textDecorationLine: 'underline',
  },
  body: { flex: 1 },
  bodyEditing: { backgroundColor: '#f2f7f3' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  rowLabel: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    color: Colors.ink3,
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.ink,
    flex: 2,
    textAlign: 'right',
  },
  editField: {
    gap: 5,
  },
  editFieldLabel: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    color: Colors.ink3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  editFieldInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.lineStrong,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.ink,
    outlineStyle: 'none',
  } as any,
  editFieldInputFocused: {
    borderColor: Colors.greenDeep,
    backgroundColor: Colors.surface,
    shadowColor: Colors.greenDeep,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  placeholder: {
    fontSize: 13,
    color: Colors.ink3,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Space.xl,
  },
  saveBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Space.xl,
    paddingVertical: Space.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  saveError: {
    flex: 1,
    fontSize: 12,
    color: Colors.error,
    fontFamily: Fonts.sans,
    marginRight: Space.md,
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: Space.xl,
    backgroundColor: Colors.greenDeep,
    borderRadius: Radius.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontSize: 13,
    color: '#fff',
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
});
