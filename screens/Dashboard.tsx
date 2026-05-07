import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { TopBar } from '../components/TopBar';
import { api } from '../services/api';
import { QualityStats, TaxonResumen } from '../services/types';

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <View style={[styles.card, { borderTopColor: accent ?? Colors.greenSoft }]}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
      {sub && <Text style={styles.cardSub}>{sub}</Text>}
    </View>
  );
}

function CompletitudBar({ label, pct, count }: { label: string; pct: number; count: number }) {
  const color = pct >= 80 ? Colors.ok : pct >= 50 ? Colors.warn : Colors.error;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barPct, { color }]}>{pct.toFixed(1)}%</Text>
      <Text style={styles.barCount}>{count}</Text>
    </View>
  );
}

export function Dashboard() {
  const [quality, setQuality] = useState<QualityStats | null>(null);
  const [taxa, setTaxa]       = useState<TaxonResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([api.getCalidad(), api.getTaxonResumen()])
      .then(([q, t]) => { setQuality(q); setTaxa(t); })
      .catch(() => setError('No se pudo conectar al servidor. Verifica que el backend esté corriendo en localhost:8000'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.greenDeep} />
      <Text style={styles.loadingText}>Cargando estadísticas…</Text>
    </View>
  );

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.errorBox}>{error}</Text>
    </View>
  );

  const c = quality!.completitud;
  const topFamilies = taxa!.por_familia.slice(0, 8);

  return (
    <View style={styles.root}>
      <TopBar title="Panorama" subtitle={`${quality!.total_registros.toLocaleString()} registros en la colección`} />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Summary cards */}
        <View style={styles.cards}>
          <StatCard label="Total registros" value={quality!.total_registros.toLocaleString()} accent={Colors.lime} />
          {Object.entries(quality!.por_coleccion).map(([code, n]) => (
            <StatCard key={code} label={code} value={n.toLocaleString()} sub="especímenes" />
          ))}
          <StatCard label="Familias" value={taxa!.por_familia.length} accent={Colors.greenSoft} />
          <StatCard label="Taxones" value={taxa!.total_taxones.toLocaleString()} accent={Colors.earth} />
        </View>

        <View style={styles.row2}>
          {/* Completitud */}
          <View style={[styles.panel, { flex: 1.4 }]}>
            <Text style={styles.panelTitle}>Completitud de datos</Text>
            <Text style={styles.panelSub}>Campos clave con datos presentes</Text>
            <View style={{ marginTop: Space.lg, gap: Space.md }}>
              <CompletitudBar label="Nombre científico" pct={c.con_nombre_cientifico.porcentaje} count={c.con_nombre_cientifico.cantidad} />
              <CompletitudBar label="Coordenadas"       pct={c.con_coordenadas.porcentaje}       count={c.con_coordenadas.cantidad} />
              <CompletitudBar label="Fecha de evento"   pct={c.con_fecha_evento.porcentaje}       count={c.con_fecha_evento.cantidad} />
              <CompletitudBar label="País"              pct={c.con_pais.porcentaje}               count={c.con_pais.cantidad} />
            </View>
          </View>

          {/* Estado */}
          <View style={[styles.panel, { flex: 1 }]}>
            <Text style={styles.panelTitle}>Estado de especímenes</Text>
            <Text style={styles.panelSub}>Por occurrenceStatus</Text>
            <View style={{ marginTop: Space.lg, gap: Space.sm }}>
              {Object.entries(quality!.por_estado).map(([estado, n]) => (
                <View key={estado} style={styles.estadoRow}>
                  <View style={[styles.estadoDot, {
                    backgroundColor: estado === 'PRESENT' ? Colors.ok : Colors.warn,
                  }]} />
                  <Text style={styles.estadoLabel}>{estado || '(sin estado)'}</Text>
                  <Text style={styles.estadoCount}>{n.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Familias */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Distribución por familia</Text>
          <Text style={styles.panelSub}>Top 8 familias más representadas</Text>
          <View style={{ marginTop: Space.lg, gap: 10 }}>
            {topFamilies.map((f, i) => {
              const maxN = topFamilies[0].count;
              const pct  = (f.count / maxN) * 100;
              return (
                <View key={f.familia} style={styles.familiaRow}>
                  <Text style={styles.familiaRank}>{i + 1}</Text>
                  <Text style={styles.familiaName}>{f.familia || '(sin familia)'}</Text>
                  <View style={styles.familiaBarTrack}>
                    <View style={[styles.familiaBarFill, { width: `${pct}%` as any }]} />
                  </View>
                  <Text style={styles.familiaCount}>{f.count}</Text>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.md },
  loadingText: { fontSize: 13, color: Colors.ink3, fontFamily: Fonts.sans },
  errorBox: {
    maxWidth: 480, padding: Space.xl, backgroundColor: Colors.errorBg,
    borderRadius: Radius.lg, color: Colors.error, fontFamily: Fonts.sans, fontSize: 13,
  },
  content: { padding: Space.xl, gap: Space.xl },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.md },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Space.lg, minWidth: 140, flex: 1,
    borderTopWidth: 3, borderTopColor: Colors.greenSoft,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardValue: { fontSize: 28, fontFamily: Fonts.serif, fontWeight: '700', color: Colors.ink },
  cardLabel: { fontSize: 12, color: Colors.ink3, marginTop: 4, fontFamily: Fonts.sans },
  cardSub: { fontSize: 11, color: Colors.ink3, marginTop: 2, fontFamily: Fonts.sans },
  row2: { flexDirection: 'row', gap: Space.xl, flexWrap: 'wrap' },
  panel: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Space.xl,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  panelTitle: { fontSize: 15, fontFamily: Fonts.serif, fontWeight: '700', color: Colors.ink },
  panelSub: { fontSize: 12, color: Colors.ink3, marginTop: 3, fontFamily: Fonts.sans },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  barLabel: { fontSize: 12, fontFamily: Fonts.sans, color: Colors.ink2, width: 130 },
  barTrack: { flex: 1, height: 6, backgroundColor: Colors.surface2, borderRadius: Radius.full },
  barFill: { height: 6, borderRadius: Radius.full },
  barPct: { fontSize: 12, fontFamily: Fonts.mono, width: 44, textAlign: 'right' },
  barCount: { fontSize: 11, color: Colors.ink3, width: 50, textAlign: 'right', fontFamily: Fonts.mono },
  estadoRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  estadoDot: { width: 8, height: 8, borderRadius: 4 },
  estadoLabel: { flex: 1, fontSize: 13, fontFamily: Fonts.sans, color: Colors.ink2 },
  estadoCount: { fontSize: 13, fontFamily: Fonts.mono, color: Colors.ink, fontWeight: '600' },
  familiaRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  familiaRank: { width: 20, fontSize: 11, color: Colors.ink3, fontFamily: Fonts.mono, textAlign: 'right' },
  familiaName: { width: 160, fontSize: 12, fontFamily: Fonts.sans, fontStyle: 'italic', color: Colors.ink2 },
  familiaBarTrack: { flex: 1, height: 5, backgroundColor: Colors.surface2, borderRadius: Radius.full },
  familiaBarFill: { height: 5, borderRadius: Radius.full, backgroundColor: Colors.greenSoft },
  familiaCount: { width: 44, fontSize: 12, fontFamily: Fonts.mono, color: Colors.ink, textAlign: 'right' },
});
