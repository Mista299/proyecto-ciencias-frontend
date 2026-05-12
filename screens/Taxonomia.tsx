import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { TopBar } from '../components/TopBar';

export function Taxonomia() {
  return (
    <View style={styles.root}>
      <TopBar title="Taxonomía" subtitle="Árbol taxonómico de la colección" />
      <View style={styles.center}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>⌬</Text>
        </View>
        <Text style={styles.title}>Próximamente</Text>
        <Text style={styles.body}>
          Esta vista mostrará el árbol taxonómico completo de la colección y se conectará al
          endpoint{' '}
          <Text style={styles.code}>/taxa/resumen</Text>.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space.xxl,
    gap: Space.md,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.sm,
  },
  icon: {
    fontSize: 26,
    color: Colors.greenDeep,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.serif,
    fontWeight: '400',
    color: Colors.ink,
  },
  body: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.ink2,
    textAlign: 'center',
    maxWidth: 460,
    lineHeight: 20,
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.ink,
  },
});
