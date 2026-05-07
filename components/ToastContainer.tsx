import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius, Space } from '../constants/theme';
import { Toast, useToast } from '../context/ToastContext';

const CONFIG: Record<Toast['type'], { bg: string; icon: string }> = {
  success: { bg: Colors.greenDeep, icon: '✓' },
  error:   { bg: Colors.error,     icon: '✕' },
  warning: { bg: Colors.warn,      icon: '!' },
  info:    { bg: Colors.ink2,      icon: 'i' },
};

const EXIT_MS = 280;

function ToastItem({ toast }: { toast: Toast }) {
  const { dismiss } = useToast();
  // CSS transition: start hidden, flip to visible after first paint
  const [visible, setVisible] = useState(false);
  const leaving = useRef(false);

  function leave() {
    if (leaving.current) return;
    leaving.current = true;
    setVisible(false);
    setTimeout(() => dismiss(toast.id), EXIT_MS);
  }

  useEffect(() => {
    // requestAnimationFrame ensures the initial opacity:0 frame renders first,
    // then the transition kicks in smoothly
    const raf = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(leave, toast.duration);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  const cfg = CONFIG[toast.type];

  // CSS-native transition via inline style (works on Expo Web / React Native Web)
  const transitionStyle = {
    opacity: visible ? 1 : 0,
    transform: [{ translateY: visible ? 0 : 14 }],
    transition: `opacity ${EXIT_MS}ms ease, transform ${EXIT_MS}ms ease`,
    pointerEvents: 'auto',
  } as any;

  return (
    <View style={[styles.toast, { backgroundColor: cfg.bg }, transitionStyle]}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{cfg.icon}</Text>
        </View>
        <Text style={styles.message} numberOfLines={3}>{toast.message}</Text>
        <Pressable onPress={leave} hitSlop={12} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>
      {/* Progress bar: CSS linear animation */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              animation: `toast-shrink ${toast.duration}ms linear forwards`,
            } as any,
          ]}
        />
      </View>
    </View>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();

  // position:'fixed' ensures toasts render above React Native modals in the browser stack
  const containerStyle = {
    position: 'fixed',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    gap: Space.sm,
    pointerEvents: 'none',  // let clicks pass through the invisible container
  } as any;

  return (
    <View style={containerStyle}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </View>
  );
}

// Inject keyframes once into the document (Expo Web)
if (typeof document !== 'undefined') {
  const STYLE_ID = '__toast_keyframes__';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes toast-shrink {
        from { width: 100%; }
        to   { width: 0%; }
      }
    `;
    document.head.appendChild(style);
  }
}

const styles = StyleSheet.create({
  toast: {
    minWidth: 300,
    maxWidth: 460,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.md,
    paddingVertical: 13,
    gap: Space.sm,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.sans,
    fontWeight: '500',
    color: '#fff',
    lineHeight: 18,
  },
  closeBtn: {
    padding: Space.xs,
    flexShrink: 0,
  },
  closeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  progressFill: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    width: '100%',
  },
});
