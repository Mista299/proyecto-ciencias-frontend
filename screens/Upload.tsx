import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { TopBar } from '../components/TopBar';
import { api } from '../services/api';
import { ETLResult, MappingReport } from '../services/types';
import { useToast } from '../context/ToastContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type FileStatus = 'idle' | 'previewing' | 'uploading' | 'done' | 'error';

type FileEntry = {
  id: string;
  file: File;
  name: string;
  size: number;
  status: FileStatus;
  report?: MappingReport;
  result?: ETLResult;
  error?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

let _id = 0;
function nextId() { return String(++_id); }

// ─── Sub-components ───────────────────────────────────────────────────────────

const STATUS_CFG: Record<FileStatus, { label: string; color: string; bg: string }> = {
  idle:       { label: 'Listo',        color: Colors.ink3,    bg: Colors.surface2 },
  previewing: { label: 'Analizando…',  color: Colors.warn,    bg: Colors.warnBg   },
  uploading:  { label: 'Cargando…',    color: Colors.greenDeep, bg: Colors.accentSoft },
  done:       { label: 'Completado',   color: Colors.ok,      bg: Colors.okBg     },
  error:      { label: 'Error',        color: Colors.error,   bg: Colors.errorBg  },
};

function StatusBadge({ status }: { status: FileStatus }) {
  const cfg = STATUS_CFG[status];
  const isLoading = status === 'previewing' || status === 'uploading';
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      {isLoading && <ActivityIndicator size="small" color={cfg.color} style={{ marginRight: 4 }} />}
      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function FileRow({
  entry,
  onRemove,
}: {
  entry: FileEntry;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const done = entry.status === 'done' && entry.result;
  const hasError = entry.status === 'error';

  return (
    <View style={styles.fileRow}>
      <View style={styles.fileRowMain}>
        <Text style={styles.fileIcon}>📄</Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.fileName} numberOfLines={1}>{entry.name}</Text>
          <Text style={styles.fileMeta}>{fmtSize(entry.size)}</Text>
        </View>

        {done && (
          <View style={styles.fileStats}>
            <Text style={styles.fileStat}>
              <Text style={{ color: Colors.ok, fontWeight: '700' }}>{entry.result!.insertados}</Text>
              {' ins  '}
              <Text style={{ color: Colors.warn, fontWeight: '700' }}>{entry.result!.actualizados}</Text>
              {' act'}
            </Text>
          </View>
        )}

        <StatusBadge status={entry.status} />

        {entry.status === 'idle' && (
          <Pressable onPress={onRemove} style={styles.removeBtn} hitSlop={8}>
            <Text style={styles.removeBtnText}>✕</Text>
          </Pressable>
        )}

        {(done || hasError) && (
          <Pressable onPress={() => setExpanded(e => !e)} style={styles.expandBtn} hitSlop={8}>
            <Text style={styles.expandBtnText}>{expanded ? '▲' : '▼'}</Text>
          </Pressable>
        )}
      </View>

      {expanded && done && entry.result && (
        <View style={styles.fileDetail}>
          {entry.result.errores.length > 0 && (
            <View style={styles.errList}>
              <Text style={styles.errListTitle}>
                {entry.result.errores.length} advertencia{entry.result.errores.length !== 1 ? 's' : ''}
              </Text>
              {entry.result.errores.slice(0, 5).map((e, i) => (
                <Text key={i} style={styles.errItem}>• {e}</Text>
              ))}
              {entry.result.errores.length > 5 && (
                <Text style={styles.errMore}>…y {entry.result.errores.length - 5} más</Text>
              )}
            </View>
          )}
          {entry.report && (
            <View style={styles.mappingRow}>
              <Text style={styles.mappingChip}>
                {entry.report.mapeadas}/{entry.report.total_columnas} columnas DwC
              </Text>
              <Text style={[styles.mappingChip, { color: Colors.ok }]}>
                {entry.report.cobertura_pct.toFixed(0)}% cobertura
              </Text>
            </View>
          )}
        </View>
      )}

      {expanded && hasError && (
        <View style={styles.fileDetail}>
          <Text style={styles.errItem}>{entry.error}</Text>
        </View>
      )}
    </View>
  );
}

function SummaryBar({ entries }: { entries: FileEntry[] }) {
  const total     = entries.length;
  const done      = entries.filter(e => e.status === 'done').length;
  const errors    = entries.filter(e => e.status === 'error').length;
  const insertados = entries.reduce((s, e) => s + (e.result?.insertados ?? 0), 0);
  const actualizados = entries.reduce((s, e) => s + (e.result?.actualizados ?? 0), 0);

  return (
    <View style={styles.summaryBar}>
      <View style={styles.summaryStat}>
        <Text style={styles.summaryNum}>{done}/{total}</Text>
        <Text style={styles.summaryLabel}>archivos</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryStat}>
        <Text style={[styles.summaryNum, { color: Colors.ok }]}>{insertados}</Text>
        <Text style={styles.summaryLabel}>insertados</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryStat}>
        <Text style={[styles.summaryNum, { color: Colors.warn }]}>{actualizados}</Text>
        <Text style={styles.summaryLabel}>actualizados</Text>
      </View>
      {errors > 0 && (
        <>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={[styles.summaryNum, { color: Colors.error }]}>{errors}</Text>
            <Text style={styles.summaryLabel}>con error</Text>
          </View>
        </>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function Upload() {
  const { show } = useToast();
  const [entries, setEntries]       = useState<FileEntry[]>([]);
  const [running, setRunning]       = useState(false);
  const [allDone, setAllDone]       = useState(false);
  const [serverLoading, setServerLoading] = useState(false);

  function updateEntry(id: string, patch: Partial<FileEntry>) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }

  async function pickFiles() {
    const res = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/vnd.ms-excel',
      ],
      multiple: true,
    });
    if (res.canceled || !res.assets?.length) return;

    const newEntries: FileEntry[] = res.assets
      .map(asset => {
        const f = (asset as any).file as File | undefined;
        if (!f) return null;
        return {
          id:     nextId(),
          file:   f,
          name:   asset.name,
          size:   f.size,
          status: 'idle' as FileStatus,
        };
      })
      .filter(Boolean) as FileEntry[];

    setEntries(prev => [...prev, ...newEntries]);
    setAllDone(false);
  }

  function removeEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  function reset() {
    setEntries([]);
    setAllDone(false);
  }

  async function runAll(withPreview: boolean) {
    const targets = entries.filter(e => e.status === 'idle');
    if (!targets.length) return;
    setRunning(true);

    for (const entry of targets) {
      // Step 1: preview (optional but fast, no LLM)
      if (withPreview) {
        updateEntry(entry.id, { status: 'previewing' });
        try {
          const report = await api.previsualizarMapeo(entry.file);
          updateEntry(entry.id, { report, status: 'idle' });
        } catch {
          // preview failure is non-fatal, continue to upload
          updateEntry(entry.id, { status: 'idle' });
        }
      }

      // Step 2: upload
      updateEntry(entry.id, { status: 'uploading' });
      try {
        const result = await api.cargarArchivo(entry.file);
        updateEntry(entry.id, { status: 'done', result });
      } catch (err: any) {
        const msg = err?.response?.data?.detail ?? 'Error al procesar el archivo.';
        updateEntry(entry.id, { status: 'error', error: typeof msg === 'string' ? msg : 'Error desconocido' });
      }
    }

    setRunning(false);
    setAllDone(true);

    // Toast summary
    setEntries(prev => {
      const done   = prev.filter(e => e.status === 'done');
      const errors = prev.filter(e => e.status === 'error');
      const ins    = done.reduce((s, e) => s + (e.result?.insertados ?? 0), 0);
      const act    = done.reduce((s, e) => s + (e.result?.actualizados ?? 0), 0);
      if (errors.length === 0) {
        show(`${done.length} archivo${done.length !== 1 ? 's' : ''} cargado${done.length !== 1 ? 's' : ''} — ${ins} insertados, ${act} actualizados`, 'success', 5000);
      } else {
        show(`${done.length} completado${done.length !== 1 ? 's' : ''}, ${errors.length} con error`, 'warning', 5000);
      }
      return prev;
    });
  }

  async function loadFromServer() {
    setServerLoading(true);
    try {
      const results = await api.cargarDirectorio();
      const ins  = results.reduce((s, r) => s + r.insertados, 0);
      const act  = results.reduce((s, r) => s + r.actualizados, 0);
      show(`Directorio procesado — ${results.length} archivos, ${ins} insertados, ${act} actualizados`, 'success', 6000);
    } catch {
      show('Error al procesar el directorio del servidor', 'error');
    } finally {
      setServerLoading(false);
    }
  }

  const idleCount     = entries.filter(e => e.status === 'idle').length;
  const hasEntries    = entries.length > 0;
  const allProcessed  = hasEntries && entries.every(e => e.status === 'done' || e.status === 'error');
  const subtitle      = hasEntries
    ? `${entries.length} archivo${entries.length !== 1 ? 's' : ''} seleccionado${entries.length !== 1 ? 's' : ''}`
    : 'Importar datos DwC desde Excel o CSV';

  return (
    <View style={styles.root}>
      <TopBar title="Cargar archivos" subtitle={subtitle} />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Drop zone */}
        <Pressable
          style={[styles.dropZone, hasEntries && styles.dropZoneActive]}
          onPress={pickFiles}
          disabled={running}
        >
          <Text style={styles.dropIcon}>⬆</Text>
          <Text style={styles.dropTitle}>
            {hasEntries ? 'Agregar más archivos' : 'Seleccionar archivos'}
          </Text>
          <Text style={styles.dropSub}>
            Excel (.xlsx) o CSV · puedes seleccionar varios a la vez
          </Text>
        </Pressable>

        {/* File list */}
        {hasEntries && (
          <View style={styles.fileList}>
            <View style={styles.fileListHeader}>
              <Text style={styles.fileListTitle}>
                Archivos ({entries.length})
              </Text>
              {!running && !allProcessed && (
                <Pressable onPress={reset} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>Limpiar todo</Text>
                </Pressable>
              )}
            </View>

            {entries.map(entry => (
              <FileRow
                key={entry.id}
                entry={entry}
                onRemove={() => removeEntry(entry.id)}
              />
            ))}
          </View>
        )}

        {/* Summary when done */}
        {allProcessed && (
          <SummaryBar entries={entries} />
        )}

        {/* Actions */}
        {hasEntries && !allProcessed && (
          <View style={styles.actions}>
            <Pressable
              style={[styles.btnSecondary, (running || idleCount === 0) && styles.btnDisabled]}
              onPress={() => runAll(false)}
              disabled={running || idleCount === 0}
            >
              <Text style={styles.btnSecondaryText}>
                Cargar sin previsualizar
              </Text>
            </Pressable>
            <Pressable
              style={[styles.btnPrimary, (running || idleCount === 0) && styles.btnDisabled]}
              onPress={() => runAll(true)}
              disabled={running || idleCount === 0}
            >
              {running
                ? <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                : null
              }
              <Text style={styles.btnPrimaryText}>
                {running
                  ? 'Procesando…'
                  : `Previsualizar y cargar${idleCount > 1 ? ` (${idleCount})` : ''}`
                }
              </Text>
            </Pressable>
          </View>
        )}

        {allProcessed && (
          <Pressable style={styles.btnPrimary} onPress={reset}>
            <Text style={styles.btnPrimaryText}>Cargar más archivos</Text>
          </Pressable>
        )}

        {/* Server directory section */}
        <View style={styles.serverSection}>
          <View style={styles.serverHeader}>
            <View>
              <Text style={styles.serverTitle}>Directorio del servidor</Text>
              <Text style={styles.serverSub}>
                Procesa todos los archivos guardados en la carpeta de muestras de la aplicación
              </Text>
            </View>
            <Pressable
              style={[styles.btnServer, serverLoading && styles.btnDisabled]}
              onPress={loadFromServer}
              disabled={serverLoading}
            >
              {serverLoading
                ? <ActivityIndicator size="small" color={Colors.greenDeep} />
                : <Text style={styles.btnServerText}>Procesar directorio</Text>
              }
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Space.xl, gap: Space.xl, maxWidth: 740, alignSelf: 'center', width: '100%' as any },

  dropZone: {
    borderWidth: 2, borderColor: Colors.line, borderStyle: 'dashed',
    borderRadius: Radius.xl, paddingVertical: Space.xxl, paddingHorizontal: Space.xl,
    alignItems: 'center', gap: Space.sm, backgroundColor: Colors.surface,
  },
  dropZoneActive: { borderColor: Colors.greenSoft, borderStyle: 'solid' },
  dropIcon: { fontSize: 28 },
  dropTitle: { fontSize: 15, fontFamily: Fonts.sans, fontWeight: '600', color: Colors.ink },
  dropSub: { fontSize: 12, color: Colors.ink3, fontFamily: Fonts.sans, textAlign: 'center' },

  fileList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: 'hidden',
  },
  fileListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Space.lg,
    paddingVertical: Space.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    backgroundColor: Colors.surface2,
  },
  fileListTitle: { fontSize: 12, fontFamily: Fonts.sans, fontWeight: '700', color: Colors.ink2, textTransform: 'uppercase', letterSpacing: 0.5 },
  clearBtn: { paddingVertical: 3, paddingHorizontal: Space.sm },
  clearBtnText: { fontSize: 12, color: Colors.error, fontFamily: Fonts.sans },

  fileRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  fileRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.lg,
    paddingVertical: 12,
    gap: Space.sm,
  },
  fileIcon: { fontSize: 18, flexShrink: 0 },
  fileName: { fontSize: 13, fontFamily: Fonts.sans, color: Colors.ink, fontWeight: '500' },
  fileMeta: { fontSize: 11, fontFamily: Fonts.mono, color: Colors.ink3 },
  fileStats: { marginRight: Space.sm },
  fileStat: { fontSize: 12, fontFamily: Fonts.mono, color: Colors.ink2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 3, paddingHorizontal: Space.sm,
    borderRadius: Radius.full,
  },
  statusText: { fontSize: 11, fontFamily: Fonts.sans, fontWeight: '600' },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 12, color: Colors.ink3 },
  expandBtn: { padding: 4 },
  expandBtnText: { fontSize: 10, color: Colors.ink3 },

  fileDetail: {
    paddingHorizontal: Space.xl,
    paddingBottom: Space.md,
    gap: Space.sm,
  },
  mappingRow: { flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap' },
  mappingChip: {
    fontSize: 11, fontFamily: Fonts.mono, color: Colors.ink2,
    backgroundColor: Colors.surface2, paddingVertical: 2, paddingHorizontal: Space.sm,
    borderRadius: Radius.full,
  },
  errList: { gap: 3 },
  errListTitle: { fontSize: 11, fontFamily: Fonts.sans, fontWeight: '600', color: Colors.warn, marginBottom: 2 },
  errItem: { fontSize: 11, color: Colors.error, fontFamily: Fonts.mono },
  errMore: { fontSize: 11, color: Colors.ink3 },

  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Space.xl,
    gap: Space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  summaryStat: { alignItems: 'center', gap: 2 },
  summaryNum: { fontSize: 28, fontFamily: Fonts.serif, fontWeight: '700', color: Colors.ink },
  summaryLabel: { fontSize: 11, fontFamily: Fonts.sans, color: Colors.ink3 },
  summaryDivider: { width: 1, height: 32, backgroundColor: Colors.line },

  actions: { flexDirection: 'row', gap: Space.md, justifyContent: 'flex-end', flexWrap: 'wrap' },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.greenDeep, borderRadius: Radius.lg,
    paddingVertical: 12, paddingHorizontal: Space.xl, alignSelf: 'flex-end',
  },
  btnPrimaryText: { color: '#fff', fontFamily: Fonts.sans, fontWeight: '600', fontSize: 14 },
  btnSecondary: {
    borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.lg,
    paddingVertical: 12, paddingHorizontal: Space.xl,
  },
  btnSecondaryText: { color: Colors.ink2, fontFamily: Fonts.sans, fontSize: 14 },
  btnDisabled: { opacity: 0.45 },

  serverSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Space.xl,
  },
  serverHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.lg, flexWrap: 'wrap' },
  serverTitle: { fontSize: 14, fontFamily: Fonts.sans, fontWeight: '700', color: Colors.ink, marginBottom: 2 },
  serverSub: { fontSize: 12, fontFamily: Fonts.sans, color: Colors.ink3 },
  serverCode: { fontFamily: Fonts.mono, color: Colors.ink2 },
  btnServer: {
    borderWidth: 1, borderColor: Colors.greenDeep, borderRadius: Radius.lg,
    paddingVertical: 9, paddingHorizontal: Space.lg,
  },
  btnServerText: { color: Colors.greenDeep, fontFamily: Fonts.sans, fontWeight: '600', fontSize: 13 },
});
