import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { TopBar } from '../components/TopBar';
import { api } from '../services/api';
import { MapPoint } from '../services/types';
import { Screen } from '../components/Sidebar';
import { nav } from '../services/navigation';

type GeoRow = { country: string; count: number };

// ── Leaflet CDN loader (module-level, deduped) ──────────────────────────────
let _leafletState: 'idle' | 'loading' | 'ready' = 'idle';
const _leafletQueue: Array<() => void> = [];

function loadLeaflet(): Promise<void> {
  if (_leafletState === 'ready') return Promise.resolve();
  return new Promise(resolve => {
    _leafletQueue.push(resolve);
    if (_leafletState === 'loading') return;
    _leafletState = 'loading';
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script   = document.createElement('script');
    script.src     = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload  = () => {
      _leafletState = 'ready';
      _leafletQueue.forEach(cb => cb());
      _leafletQueue.length = 0;
    };
    document.body.appendChild(script);
  });
}

// ── Native <select> rendered via React.createElement (no extra package) ─────
function WebSelect({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  const style = {
    background:   Colors.surface2,
    border:       `1px solid ${Colors.line}`,
    borderRadius: '8px',
    padding:      '4px 8px',
    fontSize:     '12px',
    fontFamily:   Fonts.sans,
    color:        value ? Colors.ink2 : Colors.ink3,
    cursor:       'pointer',
    outline:      'none',
    height:       '30px',
    maxWidth:     '190px',
  };
  return (React.createElement as any)(
    'select',
    { value, onChange: (e: any) => onChange(e.target.value), style },
    (React.createElement as any)('option', { key: '__all__', value: '' }, placeholder),
    ...options.map(o => (React.createElement as any)('option', { key: o, value: o }, o))
  );
}

// ── Disposition filter definition ───────────────────────────────────────────
const DISPOSITIONS = [
  { value: '',              label: 'Todos',        dot: null },
  { value: 'En colección',  label: 'En colección', dot: Colors.lime },
  { value: 'Extraviado',    label: 'Extraviado',   dot: '#e05c4b' },
];

// ── Color by disposition ────────────────────────────────────────────────────
function markerStyle(disposition: string | undefined) {
  if (disposition === 'Extraviado')   return { fill: '#e05c4b', border: '#8b1a0e' };
  if (disposition === 'En colección') return { fill: Colors.lime, border: Colors.greenDeeper };
  return { fill: '#aab', border: '#778' };
}

// ── Props ───────────────────────────────────────────────────────────────────
interface Props { onNavigate: (screen: Screen) => void; }

// ── Component ───────────────────────────────────────────────────────────────
export function Cartografia({ onNavigate }: Props) {
  const [points,  setPoints]  = useState<MapPoint[]>([]);
  const [geo,     setGeo]     = useState<GeoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [mapReady, setMapReady] = useState(false);

  // Filters
  const [dispFilter,     setDispFilter]     = useState('');
  const [familyFilter,   setFamilyFilter]   = useState('');
  const [orderFilter,    setOrderFilter]    = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');

  const mapRef         = useRef<any>(null);
  const mapInstance    = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const onNavigateRef  = useRef(onNavigate);
  onNavigateRef.current = onNavigate;   // keep stale-closure safe

  // ── Derived ───────────────────────────────────────────────────────────────
  const uniqueFamilies = useMemo(() =>
    [...new Set(points.map(p => p.family).filter(Boolean) as string[])].sort(),
  [points]);

  const uniqueOrders = useMemo(() =>
    [...new Set(points.map(p => p.taxonOrder).filter(Boolean) as string[])].sort(),
  [points]);

  const uniqueProvinces = useMemo(() =>
    [...new Set(points.map(p => p.stateProvince).filter(Boolean) as string[])].sort(),
  [points]);

  const filteredPoints = useMemo(() => points.filter(p => {
    if (dispFilter     && p.disposition  !== dispFilter)     return false;
    if (familyFilter   && p.family       !== familyFilter)   return false;
    if (orderFilter    && p.taxonOrder   !== orderFilter)    return false;
    if (provinceFilter && p.stateProvince !== provinceFilter) return false;
    return true;
  }), [points, dispFilter, familyFilter, orderFilter, provinceFilter]);

  const activeFilters = [dispFilter, familyFilter, orderFilter, provinceFilter].filter(Boolean).length;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([api.getMapa(), api.getDistribucion()])
      .then(([pts, dist]) => { setPoints(pts); setGeo(dist); })
      .catch(() => setError('No se pudo cargar los datos cartográficos. Verifica que el servidor esté activo.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Initialize map (once, after loading) ─────────────────────────────────
  useEffect(() => {
    if (loading || error) return;
    loadLeaflet().then(() => {
      const container = mapRef.current;
      if (!container) return;
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
      const L   = (window as any).L;
      const map = L.map(container, { center: [4.5, -74], zoom: 5 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);
      markerLayerRef.current = L.layerGroup().addTo(map);
      mapInstance.current    = map;
      setTimeout(() => { map.invalidateSize(); setMapReady(true); }, 80);
    });
  }, [loading, error]);

  // ── Rebuild markers when filters or map readiness changes ─────────────────
  useEffect(() => {
    if (!mapReady || !markerLayerRef.current) return;
    const L = (window as any).L;
    markerLayerRef.current.clearLayers();

    filteredPoints.forEach(p => {
      const { fill, border } = markerStyle(p.disposition);
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: 5, color: border, weight: 1, fillColor: fill, fillOpacity: 0.82,
      });

      // Build popup DOM element
      const wrap = document.createElement('div');
      wrap.style.cssText =
        'font-family:system-ui,sans-serif;font-size:12px;min-width:210px;line-height:1.5';

      const dispColor = p.disposition === 'Extraviado'   ? '#e05c4b'
                      : p.disposition === 'En colección' ? '#2E5339'
                      : '#888';
      wrap.innerHTML = `
        <div style="font-style:italic;font-weight:700;font-size:13px;margin-bottom:5px">
          ${p.scientificName ?? '—'}
        </div>
        <table style="border-collapse:collapse;width:100%;font-size:11px;color:#555">
          <tr><td style="color:#999;padding-right:6px">Catálogo</td>
              <td><code>${p.catalogNumber ?? '—'}</code></td></tr>
          <tr><td style="color:#999;padding-right:6px">Familia</td>
              <td>${p.family ?? '—'}</td></tr>
          <tr><td style="color:#999;padding-right:6px">Orden</td>
              <td>${p.taxonOrder ?? '—'}</td></tr>
          <tr><td style="color:#999;padding-right:6px">Dpto.</td>
              <td>${p.stateProvince ?? '—'}</td></tr>
          <tr><td style="color:#999;padding-right:6px">Estado</td>
              <td style="color:${dispColor};font-weight:600">${p.disposition ?? 'Sin estado'}</td></tr>
        </table>
        <div id="map-nav-btn" style="margin-top:8px"></div>
      `;

      const btn = document.createElement('button');
      btn.textContent = 'Ver en Explorador →';
      btn.style.cssText =
        'background:#1f3a27;color:#fff;border:none;border-radius:6px;'
        + 'padding:5px 10px;font-size:11px;cursor:pointer;'
        + 'width:100%;font-family:system-ui,sans-serif';
      btn.addEventListener('click', () => {
        if (p.occurrenceId) {
          nav.setRecord(p.occurrenceId);
          onNavigateRef.current('records');
        }
      });
      wrap.querySelector('#map-nav-btn')!.appendChild(btn);

      marker.bindPopup(wrap, { maxWidth: 260 }).addTo(markerLayerRef.current);
    });
  }, [filteredPoints, mapReady]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
  }, []);

  const clearFilters = () => {
    setDispFilter(''); setFamilyFilter(''); setOrderFilter(''); setProvinceFilter('');
  };

  const total = geo.reduce((s, r) => s + r.count, 0);

  return (
    <View style={styles.root}>
      <TopBar
        title="Cartografía"
        subtitle={
          loading ? 'Cargando…' :
          error   ? 'Error al cargar datos' :
          activeFilters > 0
            ? `${filteredPoints.length.toLocaleString()} de ${points.length.toLocaleString()} especímenes`
            : `${points.length.toLocaleString()} especímenes georeferenciados`
        }
      />

      {/* ── Filter bar ── */}
      {!loading && !error && (
        <View style={styles.filterBar}>

          {/* Disposition pills */}
          <View style={styles.pillRow}>
            {DISPOSITIONS.map(d => (
              <Pressable
                key={d.value || '__all__'}
                style={[
                  styles.pill,
                  dispFilter === d.value && styles.pillActive,
                  dispFilter === d.value && d.value === 'Extraviado' && styles.pillLost,
                ]}
                onPress={() => setDispFilter(d.value)}
              >
                {d.dot !== null && (
                  <View style={[styles.dot, { backgroundColor: d.dot }]} />
                )}
                <Text style={[styles.pillText, dispFilter === d.value && styles.pillTextActive]}>
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sep} />

          <WebSelect
            value={familyFilter}
            onChange={setFamilyFilter}
            options={uniqueFamilies}
            placeholder="Familia"
          />
          <WebSelect
            value={orderFilter}
            onChange={setOrderFilter}
            options={uniqueOrders}
            placeholder="Orden"
          />
          <WebSelect
            value={provinceFilter}
            onChange={setProvinceFilter}
            options={uniqueProvinces}
            placeholder="Departamento"
          />

          {activeFilters > 0 && (
            <Pressable style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearText}>✕ Limpiar ({activeFilters})</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.body}>

        {/* ── Sidebar: geo distribution ── */}
        <View style={styles.sidebar}>
          <Text style={styles.sideTitle}>Distribución</Text>
          <Text style={styles.sideSub}>Por país de colecta</Text>

          {loading ? (
            <View style={styles.sideCenter}>
              <ActivityIndicator color={Colors.greenDeep} />
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1, marginTop: Space.lg } as any}
              showsVerticalScrollIndicator={false}
            >
              {geo.map(row => {
                const pct = total > 0 ? (row.count / total) * 100 : 0;
                return (
                  <View key={row.country} style={styles.geoRow}>
                    <Text style={styles.geoLabel} numberOfLines={1}>{row.country}</Text>
                    <View style={styles.geoTrack}>
                      <View style={[styles.geoFill, { width: `${pct}%` as any }]} />
                    </View>
                    <Text style={styles.geoCount}>{row.count.toLocaleString()}</Text>
                  </View>
                );
              })}

              {/* Legend */}
              {!loading && !error && (
                <View style={styles.legend}>
                  <Text style={styles.legendTitle}>Leyenda</Text>
                  {[
                    { color: Colors.lime,  label: 'En colección' },
                    { color: '#e05c4b',    label: 'Extraviado' },
                    { color: '#aab',       label: 'Sin estado' },
                  ].map(l => (
                    <View key={l.label} style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                      <Text style={styles.legendLabel}>{l.label}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={{ height: Space.xl }} />
            </ScrollView>
          )}
        </View>

        {/* ── Map area ── */}
        <View style={styles.mapArea}>
          {loading && (
            <View style={styles.mapFeedback}>
              <ActivityIndicator size="large" color={Colors.greenDeep} />
              <Text style={styles.feedbackText}>Cargando mapa…</Text>
            </View>
          )}
          {!loading && error && (
            <View style={styles.mapFeedback}>
              <Text style={styles.errorBox}>{error}</Text>
            </View>
          )}
          {!loading && !error && <View ref={mapRef} style={styles.map} />}
        </View>

      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg, overflow: 'hidden' as any },

  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    paddingHorizontal: Space.xl,
    paddingVertical: Space.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    flexWrap: 'wrap' as any,
  },
  pillRow: { flexDirection: 'row', gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.surface2,
  },
  pillActive: { backgroundColor: Colors.greenDeep, borderColor: Colors.greenDeep },
  pillLost:   { backgroundColor: '#8b1a0e', borderColor: '#8b1a0e' },
  dot:        { width: 7, height: 7, borderRadius: 4 },
  pillText:       { fontSize: 12, fontFamily: Fonts.sans, color: Colors.ink2 },
  pillTextActive: { fontSize: 12, fontFamily: Fonts.sans, color: '#fff', fontWeight: '600' },
  sep: { width: 1, height: 20, backgroundColor: Colors.line, marginHorizontal: 2 },
  clearBtn: {
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.error,
    backgroundColor: Colors.errorBg,
  },
  clearText: { fontSize: 11, fontFamily: Fonts.sans, color: Colors.error, fontWeight: '600' },

  body: { flex: 1, flexDirection: 'row' },

  sidebar: {
    width: 256,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.line,
    padding: Space.xl,
    flexDirection: 'column',
  },
  sideTitle: { fontSize: 14, fontFamily: Fonts.serif, fontWeight: '700', color: Colors.ink },
  sideSub:   { fontSize: 11, fontFamily: Fonts.sans,  color: Colors.ink3, marginTop: 2 },
  sideCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  geoRow:   { flexDirection: 'row', alignItems: 'center', gap: Space.sm, marginBottom: Space.sm },
  geoLabel: { width: 80, fontSize: 11, fontFamily: Fonts.sans, color: Colors.ink2 },
  geoTrack: { flex: 1, height: 4, backgroundColor: Colors.surface2, borderRadius: Radius.full },
  geoFill:  { height: 4, borderRadius: Radius.full, backgroundColor: Colors.greenSoft },
  geoCount: { width: 36, fontSize: 11, fontFamily: Fonts.mono, color: Colors.ink, textAlign: 'right' as any },

  legend: {
    marginTop: Space.lg,
    paddingTop: Space.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    gap: 6,
  },
  legendTitle: { fontSize: 10, fontFamily: Fonts.sans, fontWeight: '700', color: Colors.ink3, textTransform: 'uppercase' as any, letterSpacing: 0.6, marginBottom: 4 },
  legendRow:   { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, fontFamily: Fonts.sans, color: Colors.ink2 },

  mapArea:    { flex: 1, overflow: 'hidden' as any },
  map:        { flex: 1 },
  mapFeedback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.md },
  feedbackText: { fontSize: 13, color: Colors.ink3, fontFamily: Fonts.sans },
  errorBox: {
    maxWidth: 420, padding: Space.xl,
    backgroundColor: Colors.errorBg, borderRadius: Radius.lg,
    color: Colors.error, fontFamily: Fonts.sans, fontSize: 13,
    textAlign: 'center' as any,
  },
});
