import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Grid, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type AppAlertVariant = 'info' | 'success' | 'error';
type AppAlertOptions = {
  title: string;
  message?: string;
  details?: string;
  variant?: AppAlertVariant;
  actionLabel?: string;
};
type AppAlertContextValue = {
  showAlert: (options: AppAlertOptions) => void;
};
type QueuedAlert = AppAlertOptions & {
  id: number;
};

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

export function AppAlertProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const [queue, setQueue] = useState<QueuedAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<QueuedAlert | null>(null);

  const showAlert = useCallback((options: AppAlertOptions) => {
    setQueue((current) => [
      ...current,
      {
        ...options,
        variant: options.variant ?? 'info',
        actionLabel: options.actionLabel ?? 'OK',
        id: Date.now() + Math.random(),
      },
    ]);
  }, []);

  useEffect(() => {
    if (currentAlert || queue.length === 0) {
      return;
    }

    const [nextAlert, ...rest] = queue;
    setCurrentAlert(nextAlert);
    setQueue(rest);
  }, [currentAlert, queue]);

  const closeAlert = useCallback(() => {
    setCurrentAlert(null);
  }, []);

  const value = useMemo(() => ({ showAlert }), [showAlert]);
  const variant = currentAlert?.variant ?? 'info';
  const iconName = getVariantIcon(variant);
  const accentColor = getVariantColor(variant, colors);

  return (
    <AppAlertContext.Provider value={value}>
      {children}

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(currentAlert)}
        statusBarTranslucent
        onRequestClose={closeAlert}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={closeAlert} />
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors['surface-container-lowest'],
                borderColor: colors['outline-variant'],
              },
            ]}>
            <View style={[styles.iconWrap, { backgroundColor: `${accentColor}22` }]}>
              <Ionicons name={iconName} size={28} color={accentColor} />
            </View>

            <Text style={[Typography.title, styles.title, { color: colors['on-background'] }]}>
              {currentAlert?.title}
            </Text>

            {currentAlert?.message ? (
              <Text style={[Typography.body, styles.message, { color: colors['on-surface'] }]}>
                {currentAlert.message}
              </Text>
            ) : null}

            {currentAlert?.details ? (
              <ScrollView
                style={[
                  styles.detailsBox,
                  {
                    backgroundColor: colors['surface-container-low'],
                    borderColor: colors['outline-variant'],
                  },
                ]}
                contentContainerStyle={styles.detailsContent}>
                <Text style={[Typography.caption, styles.detailsText, { color: colors['on-surface'] }]}>
                  {currentAlert.details}
                </Text>
              </ScrollView>
            ) : null}

            <Pressable
              onPress={closeAlert}
              style={({ pressed }) => [
                styles.action,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <Text style={[Typography.button, styles.actionText, { color: colors['on-primary'] }]}>
                {currentAlert?.actionLabel ?? 'OK'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AppAlertContext.Provider>
  );
}

export function useAppAlert() {
  const context = useContext(AppAlertContext);

  if (!context) {
    throw new Error('useAppAlert must be used inside AppAlertProvider.');
  }

  return context;
}

function getVariantIcon(variant: AppAlertVariant) {
  if (variant === 'success') {
    return 'checkmark-circle' as const;
  }

  if (variant === 'error') {
    return 'alert-circle' as const;
  }

  return 'information-circle' as const;
}

function getVariantColor(variant: AppAlertVariant, colors: ReturnType<typeof useTheme>['colors']) {
  if (variant === 'success') {
    return colors.tertiary;
  }

  if (variant === 'error') {
    return colors.error;
  }

  return colors.primary;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Grid.columns.margin,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(3, 20, 39, 0.62)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 30,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    lineHeight: 27,
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
  },
  detailsBox: {
    width: '100%',
    maxHeight: 220,
    borderRadius: 18,
    borderWidth: 1,
  },
  detailsContent: {
    padding: 14,
  },
  detailsText: {
    lineHeight: 17,
  },
  action: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontFamily: Typography.button.fontFamily,
    fontWeight: '600',
  },
});
