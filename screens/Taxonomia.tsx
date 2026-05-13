import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { TopBar } from '../components/TopBar';
import { api } from '../services/api';
import { TaxonResumen } from '../services/types';

function BarRow({
  label, count, max, accent,
}: { label: string; count: number; max: number; accent?: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel} numberOfLines={1}>{label || '(sin clasificar)'}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: accent ?? Colors.greenSoft }]} />
      </View>
      <Text style={styles.barCount}>{count}</Text>
    </View>
  );
}

export function Taxonomia() {
  const [data, setData]       = useState<TaxonResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.getTaxonResumen()
      .then(setData)
      .catch(() => setError('No se pudo cargar el resumen taxonómico. Verifica que el servidor esté activo.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <View style={styles.root}>
      <TopBar title="Taxonomía" subtitle="Árbol taxonómico de la colección" />
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.greenDeep} />
        <Text style={styles.loadingText}>Cargando taxonomía…</Text>
      </View>
    </View>
  );

  if (error || !data) return (
    <View style={styles.root}>
      <TopBar title="Taxonomía" subtitle="Árbol taxonómico de la colección" />
      <View style={styles.center}>
        <Text style={styles.errorBox}>{error}</Text>
      </View>
    </View>
  );

  const topFamilias = data.por_familia.slice(0, 20);
  const topOrdenes  = data.por_orden.slice(0, 15);
  const maxFamilia  = topFamilias[0]?.count ?? 1;
  const maxOrden    = topOrdenes[0]?.count ?? 1;

  return (
    <View style={styles.root}>
      <TopBar
        title="Taxonomía"
        subtitle={`${data.total_taxones.toLocaleString()} taxones · ${data.por_familia.length} familias · ${data.por_orden.length} órdenes`}
      />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Summary cards */}
        <View style={styles.cards}>
          <View style={[styles.card, { borderTopColor: Colors.lime }]}>
            <Text style={styles.cardValue}>{data.total_taxones.toLocaleString()}</Text>
            <Text style={styles.cardLabel}>Total taxones</Text>
          </View>
          <View style={[styles.card, { borderTopColor: Colors.greenSoft }]}>
            <Text style={styles.cardValue}>{data.por_familia.length}</Text>
            <Text style={styles.cardLabel}>Familias</Text>
          </View>
          <View style={[styles.card, { borderTopColor: Colors.earth }]}>
            <Text style={styles.cardValue}>{data.por_orden.length}</Text>
            <Text style={styles.cardLabel}>Órdenes</Text>
          </View>
        </View>

        {/* Two panels */}
        <View style={styles.row2}>

          {/* Familias */}
          <View style={[styles.panel, { flex: 1 }]}>
            <Text style={styles.panelTitle}>Distribución por familia</Text>
            <Text style={styles.panelSub}>Top 20 más representadas</Text>
            <View style={{ marginTop: Space.lg, gap: Space.sm }}>
              {topFamilias.map((f, i) => (
                <View key={f.familia + i} style={styles.rankRow}>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <BarRow label={f.familia} count={f.count} max={maxFamilia} accent={Colors.greenSoft} />
                </View>
              ))}
            </View>
          </View>

          {/* Órdenes */}
          <View style={[styles.panel, { flex: 1 }]}>
            <Text style={styles.panelTitle}>Distribución por orden</Text>
            <Text style={styles.panelSub}>Top 15 más representados</Text>
            <View style={{ marginTop: Space.lg, gap: Space.sm }}>
              {topOrdenes.map((o, i) => (
                <View key={o.orden + i} style={styles.rankRow}>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <BarRow label={o.orden} count={o.count} max={maxOrden} accent={Colors.earth} />
                </View>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bg },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.md },
  loadingText: { fontSize: 13, color: Colors.ink3, fontFamily: Fonts.sans },
  errorBox: {
    maxWidth: 480, padding: Space.xl,
    backgroundColor: Colors.errorBg, borderRadius: Radius.lg,
    color: Colors.error, fontFamily: Fonts.sans, fontSize: 13,
  },
  content: { padding: Space.xl, gap: Space.xl },

  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.md },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Space.lg, minWidth: 140, flex: 1,
    borderTopWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  cardValue: { fontSize: 28, fontFamily: Fonts.serif, fontWeight: '700', color: Colors.ink },
  cardLabel: { fontSize: 12, color: Colors.ink3, marginTop: 4, fontFamily: Fonts.sans },

  row2: { flexDirection: 'row', gap: Space.xl, flexWrap: 'wrap' },
  panel: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Space.xl,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  panelTitle: { fontSize: 15, fontFamily: Fonts.serif, fontWeight: '700', color: Colors.ink },
  panelSub:   { fontSize: 12, color: Colors.ink3, marginTop: 3, fontFamily: Fonts.sans },

  rankRow: { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  rank: { width: 20, fontSize: 11, color: Colors.ink3, fontFamily: Fonts.mono, textAlign: 'right' as any },

  barRow:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  barLabel: { fontSize: 12, fontFamily: Fonts.sans, fontStyle: 'italic', color: Colors.ink2, width: 130 },
  barTrack: { flex: 1, height: 5, backgroundColor: Colors.surface2, borderRadius: Radius.full },
  barFill:  { height: 5, borderRadius: Radius.full },
  barCount: { fontSize: 11, fontFamily: Fonts.mono, color: Colors.ink, width: 40, textAlign: 'right' as any },
});
