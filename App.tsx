import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Sidebar, Screen } from './components/Sidebar';
import { Dashboard } from './screens/Dashboard';
import { Upload } from './screens/Upload';
import { Records } from './screens/Records';
import { Colors } from './constants/theme';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');

  return (
    <ToastProvider>
      <View style={styles.root}>
        <StatusBar style="light" />
        <Sidebar active={screen} onChange={setScreen} />
        <View style={styles.main}>
          {screen === 'dashboard' && <Dashboard />}
          {screen === 'upload'    && <Upload />}
          {screen === 'records'   && <Records />}
        </View>
        <ToastContainer />
      </View>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    height: '100vh' as any,
  },
  main: {
    flex: 1,
    overflow: 'hidden',
  },
});
