import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Keyboard, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useTheme } from '@/hooks/useTheme';
import { Grid } from '@/constants/theme';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Fires once the sheet has actually finished its native presentation animation — the correct moment to do things like auto-focusing an input inside it, rather than guessing with a timeout. */
  onOpen?: () => void;
};

/**
 * A genuinely native sheet (UISheetPresentationController on iOS,
 * BottomSheetDialog on Android via @lodev09/react-native-true-sheet), behind
 * the same visible/onClose/children contract every call site already used —
 * so nothing else needed to change.
 *
 * Not a JS-rendered overlay: earlier attempts with @gorhom/bottom-sheet hit
 * two real bugs from that approach — a sheet positioned relative to its
 * parent instead of the screen, then present() silently not opening it.
 * Both are structurally impossible here since the OS itself presents the
 * sheet, not a portal positioned by JS.
 */
export function BottomSheet({ visible, onClose, children, style, onOpen }: BottomSheetProps) {
  const { colors } = useTheme();
  const sheetRef = useRef<TrueSheet>(null);
  // Tracks whether the sheet is genuinely open right now. Needed in both
  // directions: skip dismiss() on first mount (visible starts false, so
  // without this we'd dismiss a sheet that was never presented), and skip it
  // again after a swipe-to-dismiss — onDidDismiss already fires onClose,
  // which flips `visible` to false and would otherwise call dismiss() a
  // second time on a sheet that just finished dismissing itself. Both cases
  // produced "sheet is already dismissed" warnings.
  const isPresentedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      isPresentedRef.current = true;
      sheetRef.current?.present();
    } else if (isPresentedRef.current) {
      isPresentedRef.current = false;
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    isPresentedRef.current = false;
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  return (
    <TrueSheet
      ref={sheetRef}
      detents={['auto']}
      cornerRadius={28}
      backgroundColor={colors.background}
      onDidPresent={onOpen}
      onDidDismiss={handleDismiss}>
      <View style={[styles.sheet, style]}>{children}</View>
    </TrueSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: Grid.columns.margin,
    paddingTop: 20,
    paddingBottom: 24,
  },
});
