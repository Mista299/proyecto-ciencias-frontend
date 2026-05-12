import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Sidebar, Screen } from './components/Sidebar';
import { Dashboard } from './screens/Dashboard';
import { Upload } from './screens/Upload';
import { Records } from './screens/Records';
import { Login } from './screens/Login';
import { AdminPanel } from './screens/AdminPanel';
import { Taxonomia } from './screens/Taxonomia';
import { Cartografia } from './screens/Cartografia';
import { Settings } from './screens/Settings';
import { Colors } from './constants/theme';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppShell() {
  const { user, isAdmin } = useAuth();
  const [screen, setScreen] = useState<Screen>('dashboard');

  useEffect(() => {
    if (!isAdmin && screen === 'admin') {
      setScreen('dashboard');
    }
  }, [user, isAdmin]);

  if (!user) return <Login />;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Sidebar active={screen} onChange={setScreen} />
      <View style={styles.main}>
        {screen === 'dashboard'  && <Dashboard />}
        {screen === 'upload'     && <Upload />}
        {screen === 'records'    && <Records />}
        {screen === 'admin'      && isAdmin && <AdminPanel />}
        {screen === 'taxonomia'  && <Taxonomia />}
        {screen === 'cartografia'&& <Cartografia />}
        {screen === 'settings'   && <Settings />}
      </View>
      <ToastContainer />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AuthProvider>
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
