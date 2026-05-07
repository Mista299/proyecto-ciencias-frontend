import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, TextInput, Switch } from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { TopBar } from '../components/TopBar';
import { Badge } from '../components/Badge';
import { SpecimenModal } from '../components/SpecimenModal';
import { AddOccurrenceModal } from '../components/AddOccurrenceModal';
import { api, OccurrenceFilter } from '../services/api';
import { Occurrence } from '../services/types';

const COLLECTIONS = ['Todos', 'MUA-MAM', 'MUA-ANF', 'MUA-AVE', 'MUA-REP'];
const DISPOSITIONS = ['', 'En colección', 'Extraviado'];
const PAGE_SIZE = 50;

type AdvancedFilters = {
  state_province?: string;
  disposition?: string;
  identified_by?: string;
  verification_status?: string;
  con_coordenadas?: boolean;
  year_from?: string;
  year_to?: string;
};

function OccurrenceRow({ occ, onPress }: { occ: Occurrence; onPress: () => void }) {
  const isLost = occ.disposition === 'Extraviado';
  return (
    <Pressable style={[styles.row, isLost && styles.rowLost]} onPress={onPress}>
      <Text style={styles.rowCatalog}>{occ.catalogNumber}</Text>
      <Text style={styles.rowSci} numberOfLines={1}>
        {occ.taxon?.scientificName ?? '—'}
      </Text>
      <Text style={styles.rowFamily} numberOfLines={1}>
        {occ.taxon?.family ?? '—'}
      </Text>
      <Text style={styles.rowDate} numberOfLines={1}>
        {occ.event?.eventDate ?? '—'}
      </Text>
      <Text style={styles.rowLocality} numberOfLines={1}>
        {occ.location?.stateProvince ?? occ.location?.country ?? '—'}
      </Text>
      <View style={styles.rowBadges}>
        {occ.disposition === 'Extraviado' && <Badge label="Extraviado" variant="error" />}
        <Badge label={occ.collectionCode} variant="neutral" />
      </View>
    </Pressable>
  );
}

function FilterPill({
  label,
  values,
  current,
  onSelect,
}: {
  label: string;
  values: string[];
  current: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={styles.filterPillGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.filterPillRow}>
        {values.map(v => (
          <Pressable
            key={v || '__empty__'}
            style={[styles.pill, current === v && styles.pillActive]}
            onPress={() => onSelect(v)}
          >
            <Text style={[styles.pillText, current === v && styles.pillTextActive]}>
              {v || 'Todos'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function Records() {
  const [data, setData]             = useState<Occurrence[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [collection, setColl]       = useState('Todos');
  const [selected, setSelected]     = useState<Occurrence | null>(null);
  const [offset, setOffset]         = useState(0);
  const [hasMore, setHasMore]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [adv, setAdv]               = useState<AdvancedFilters>({});
  const [showAdd, setShowAdd]       = useState(false);

  const activeCount = Object.values(adv).filter(v => v !== undefined && v !== '' && v !== false).length;

  const load = useCallback(async (reset = false) => {
    const skip = reset ? 0 : offset;
    if (!reset) setLoadingMore(true); else setLoading(true);

    try {
      const params: OccurrenceFilter = {
        skip,
        limit: PAGE_SIZE,
        ...(collection !== 'Todos' && { collection_code: collection }),
        ...(search.trim() && { taxon: search.trim() }),
        ...(adv.state_province?.trim()   && { state_province: adv.state_province.trim() }),
        ...(adv.disposition              && { disposition: adv.disposition }),
        ...(adv.identified_by?.trim()    && { identified_by: adv.identified_by.trim() }),
        ...(adv.verification_status      && { verification_status: adv.verification_status }),
        ...(adv.con_coordenadas          && { con_coordenadas: true }),
        ...(adv.year_from && !isNaN(Number(adv.year_from)) && { year_from: Number(adv.year_from) }),
        ...(adv.year_to   && !isNaN(Number(adv.year_to))   && { year_to:   Number(adv.year_to) }),
      };
      const rows = await api.getOccurrences(params);
      if (reset) {
        setData(rows);
        setOffset(rows.length);
      } else {
        setData(prev => [...prev, ...rows]);
        setOffset(o => o + rows.length);
      }
      setHasMore(rows.length === PAGE_SIZE);
    } catch {
      setError('No se pudo cargar los registros.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [collection, search, offset, adv]);

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    load(true);
  }, [collection, search, adv]);

  function handleSaved(updated: Occurrence) {
    setData(prev => prev.map(o => o.occurrenceID === updated.occurrenceID ? updated : o));
    setSelected(updated);
  }

  function handleDeleted(id: string) {
    setData(prev => prev.filter(o => o.occurrenceID !== id));
    setSelected(null);
  }

  function handleCreated(occ: Occurrence) {
    setData(prev => [occ, ...prev]);
  }

  function clearFilters() {
    setAdv({});
  }

  const subtitle = `${data.length}${hasMore ? '+' : ''} registros${collection !== 'Todos' ? ` · ${collection}` : ''}`;

  return (
    <View style={styles.root}>
      <TopBar
        title="Explorador"
        subtitle={subtitle}
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar taxón…' }}
      />

      {/* Collection filter + filter toggle */}
      <View style={styles.filterRow}>
        <View style={styles.chips}>
          {COLLECTIONS.map(c => (
            <Pressable
              key={c}
              style={[styles.chip, collection === c && styles.chipActive]}
              onPress={() => setColl(c)}
            >
              <Text style={[styles.chipText, collection === c && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.rightActions}>
          <Pressable onPress={() => setShowAdd(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Nuevo</Text>
          </Pressable>
          <Pressable
            style={[styles.filterToggle, (showFilters || activeCount > 0) && styles.filterToggleActive]}
            onPress={() => setShowFilters(f => !f)}
          >
            <Text style={[styles.filterToggleText, (showFilters || activeCount > 0) && styles.filterToggleTextActive]}>
              {activeCount > 0 ? `Filtros (${activeCount})` : 'Filtros'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Advanced filter panel */}
      {showFilters && (
        <View style={styles.advPanel}>
          <View style={styles.advRow}>
            <View style={styles.advField}>
              <Text style={styles.filterLabel}>Departamento / Estado</Text>
              <TextInput
                style={styles.advInput}
                value={adv.state_province ?? ''}
                onChangeText={v => setAdv(a => ({ ...a, state_province: v }))}
                placeholder="Ej: Antioquia"
                placeholderTextColor={Colors.ink3}
              />
            </View>
            <View style={styles.advField}>
              <Text style={styles.filterLabel}>Identificado por</Text>
              <TextInput
                style={styles.advInput}
                value={adv.identified_by ?? ''}
                onChangeText={v => setAdv(a => ({ ...a, identified_by: v }))}
                placeholder="Nombre del identificador"
                placeholderTextColor={Colors.ink3}
              />
            </View>
          </View>

          <View style={styles.advRow}>
            <FilterPill
              label="Disposición"
              values={DISPOSITIONS}
              current={adv.disposition ?? ''}
              onSelect={v => setAdv(a => ({ ...a, disposition: v }))}
            />
            <FilterPill
              label="Verificación"
              values={['', 'Verificado', 'No verificado']}
              current={adv.verification_status ?? ''}
              onSelect={v => setAdv(a => ({ ...a, verification_status: v }))}
            />
          </View>

          <View style={styles.advRow}>
            <View style={styles.advField}>
              <Text style={styles.filterLabel}>Año desde</Text>
              <TextInput
                style={styles.advInput}
                value={adv.year_from ?? ''}
                onChangeText={v => setAdv(a => ({ ...a, year_from: v }))}
                placeholder="Ej: 2000"
                placeholderTextColor={Colors.ink3}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.advField}>
              <Text style={styles.filterLabel}>Año hasta</Text>
              <TextInput
                style={styles.advInput}
                value={adv.year_to ?? ''}
                onChangeText={v => setAdv(a => ({ ...a, year_to: v }))}
                placeholder="Ej: 2024"
                placeholderTextColor={Colors.ink3}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.advFooter}>
            <View style={styles.coordToggle}>
              <Text style={styles.filterLabel}>Solo con coordenadas</Text>
              <Switch
                value={adv.con_coordenadas ?? false}
                onValueChange={v => setAdv(a => ({ ...a, con_coordenadas: v }))}
                trackColor={{ true: Colors.greenDeep, false: Colors.line }}
                thumbColor="#fff"
              />
            </View>
            {activeCount > 0 && (
              <Pressable onPress={clearFilters} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Limpiar filtros</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.colHead, { width: 130 }]}>Catálogo</Text>
        <Text style={[styles.colHead, { flex: 2 }]}>Nombre científico</Text>
        <Text style={[styles.colHead, { flex: 1 }]}>Familia</Text>
        <Text style={[styles.colHead, { width: 100 }]}>Fecha</Text>
        <Text style={[styles.colHead, { flex: 1 }]}>Dpto / País</Text>
        <Text style={[styles.colHead, { width: 120 }]}>Estado</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.greenDeep} />
          <Text style={styles.loadText}>Cargando registros…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.occurrenceID}
          renderItem={({ item }) => (
            <OccurrenceRow occ={item} onPress={() => setSelected(item)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          onEndReached={() => { if (hasMore && !loadingMore) load(false); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? (
            <View style={styles.footerLoad}>
              <ActivityIndicator size="small" color={Colors.greenDeep} />
            </View>
          ) : null}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Sin resultados para esta búsqueda.</Text>
            </View>
          }
        />
      )}

      <SpecimenModal
        occurrence={selected}
        onClose={() => setSelected(null)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
      <AddOccurrenceModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={handleCreated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.sm, paddingVertical: Space.xl },
  loadText: { fontSize: 13, color: Colors.ink3, fontFamily: Fonts.sans },
  errorText: { fontSize: 13, color: Colors.error, fontFamily: Fonts.sans },
  emptyText: { fontSize: 13, color: Colors.ink3, fontFamily: Fonts.sans, fontStyle: 'italic' },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.xl,
    paddingVertical: Space.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    backgroundColor: Colors.surface,
  },
  chips: { flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap' },
  chip: {
    paddingVertical: 5, paddingHorizontal: Space.md,
    borderRadius: Radius.full, backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.line,
  },
  chipActive: { backgroundColor: Colors.greenDeep, borderColor: Colors.greenDeep },
  chipText: { fontSize: 12, fontFamily: Fonts.sans, color: Colors.ink2 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  addBtn: {
    paddingVertical: 6, paddingHorizontal: Space.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.greenDeep,
  },
  addBtnText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    color: '#fff',
  },
  filterToggle: {
    paddingVertical: 6, paddingHorizontal: Space.md,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.line,
    backgroundColor: Colors.surface2,
  },
  filterToggleActive: { backgroundColor: Colors.greenDeep, borderColor: Colors.greenDeep },
  filterToggleText: { fontSize: 12, fontFamily: Fonts.sans, color: Colors.ink2 },
  filterToggleTextActive: { color: '#fff', fontWeight: '600' },
  advPanel: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    padding: Space.lg,
    gap: Space.md,
  },
  advRow: {
    flexDirection: 'row',
    gap: Space.lg,
    flexWrap: 'wrap',
  },
  advField: { flex: 1, minWidth: 160, gap: 4 },
  advInput: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    paddingVertical: 6,
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.ink,
    backgroundColor: Colors.surface2,
    outlineStyle: 'none',
  } as any,
  filterLabel: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    color: Colors.ink3,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  filterPillGroup: { flex: 1, minWidth: 160 },
  filterPillRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill: {
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.line,
    backgroundColor: Colors.surface2,
  },
  pillActive: { backgroundColor: Colors.greenDeep, borderColor: Colors.greenDeep },
  pillText: { fontSize: 12, fontFamily: Fonts.sans, color: Colors.ink2 },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  advFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Space.xs,
  },
  coordToggle: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  clearBtn: {
    paddingVertical: 5, paddingHorizontal: Space.md,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.error,
  },
  clearBtnText: { fontSize: 12, fontFamily: Fonts.sans, color: Colors.error },
  tableHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Space.lg, paddingVertical: Space.sm,
    backgroundColor: Colors.surface2, borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  colHead: {
    fontSize: 11, fontFamily: Fonts.sans, fontWeight: '600',
    color: Colors.ink3, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Space.lg, paddingVertical: 12,
    backgroundColor: Colors.surface,
  },
  rowLost: { backgroundColor: '#fdf4f3' },
  rowCatalog: { width: 130, fontSize: 12, fontFamily: Fonts.mono, color: Colors.ink2 },
  rowSci: { flex: 2, fontSize: 13, fontFamily: Fonts.sans, fontStyle: 'italic', color: Colors.ink },
  rowFamily: { flex: 1, fontSize: 12, fontFamily: Fonts.sans, color: Colors.ink2 },
  rowDate: { width: 100, fontSize: 12, fontFamily: Fonts.mono, color: Colors.ink3 },
  rowLocality: { flex: 1, fontSize: 12, fontFamily: Fonts.sans, color: Colors.ink2 },
  rowBadges: { width: 120, flexDirection: 'row', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' },
  sep: { height: 1, backgroundColor: Colors.line },
  footerLoad: { paddingVertical: Space.lg, alignItems: 'center' },
});
