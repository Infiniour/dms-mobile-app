import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type CapturedPhoto = {
  uri: string;
  fileName: string;
  mimeType: string;
};

type CameraCaptureModalProps = {
  visible: boolean;
  onClose: () => void;
  onCapture: (photo: CapturedPhoto) => void;
};

/**
 * Full-screen VisionCamera capture. Takes a JPEG to a temp file and returns
 * a file:// URI the rest of the app already knows how to upload.
 */
export function CameraCaptureModal({ visible, onClose, onCapture }: CameraCaptureModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput({ quality: 0.85, qualityPrioritization: 'balanced' });
  const { hasPermission, requestPermission, canRequestPermission } = useCameraPermission();
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!visible || hasPermission) {
      return;
    }

    if (canRequestPermission) {
      requestPermission();
    }
  }, [visible, hasPermission, canRequestPermission, requestPermission]);

  useEffect(() => {
    if (!visible) {
      setIsCapturing(false);
      setErrorMessage('');
    }
  }, [visible]);

  const handleCapture = useCallback(async () => {
    if (isCapturing) {
      return;
    }

    setIsCapturing(true);
    setErrorMessage('');

    try {
      const photoFile = await photoOutput.capturePhotoToFile(
        { flashMode: 'off', enableShutterSound: true },
        {}
      );
      const path = photoFile.filePath;
      const uri = path.startsWith('file://') ? path : `file://${path}`;
      const fileName = path.split('/').pop() || `photo-${Date.now()}.jpg`;

      onCapture({
        uri,
        fileName,
        mimeType: 'image/jpeg',
      });
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to take photo.');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, onCapture, onClose, photoOutput]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.screen}>
        {hasPermission && device ? (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={visible}
            outputs={[photoOutput]}
            enableNativeTapToFocusGesture
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.fallback, { backgroundColor: '#000' }]}>
            <ActivityIndicator color="#fff" />
            <Text style={[Typography.body, styles.fallbackText]}>
              {!hasPermission
                ? canRequestPermission
                  ? 'Waiting for camera permission…'
                  : 'Camera permission is blocked. Enable it in Settings.'
                : 'No camera available on this device.'}
            </Text>
            {!hasPermission && canRequestPermission ? (
              <Pressable
                onPress={requestPermission}
                style={({ pressed }) => [styles.permissionButton, { opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[Typography.button, { color: colors['on-primary'] }]}>Allow camera</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [styles.roundButton, { opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Close camera">
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {errorMessage ? (
            <Text style={[Typography.caption, styles.errorText]}>{errorMessage}</Text>
          ) : null}
          <Pressable
            onPress={handleCapture}
            disabled={!hasPermission || !device || isCapturing}
            style={({ pressed }) => [
              styles.shutterOuter,
              { opacity: pressed || isCapturing || !hasPermission || !device ? 0.6 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Take photo">
            <View style={styles.shutterInner}>
              {isCapturing ? <ActivityIndicator color="#111" /> : null}
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  fallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  fallbackText: {
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#4f46e5',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: '#ffb4ab',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
