import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type DocumentPreviewModalProps = {
  visible: boolean;
  onClose: () => void;
  uri: string;
  name: string;
  kind: 'image' | 'pdf' | 'other';
};

/**
 * In-app document viewer.
 *
 * Images use expo-image. PDFs use Mozilla PDF.js inside a WebView — Android's
 * WebView cannot render application/pdf directly and would otherwise download
 * the file / hand it to an external viewer.
 */
export function DocumentPreviewModal({
  visible,
  onClose,
  uri,
  name,
  kind,
}: DocumentPreviewModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  useEffect(() => {
    if (!visible || kind === 'image' || !uri) {
      setPdfBase64(null);
      setPdfError(null);
      setIsLoadingPdf(false);
      return;
    }

    let cancelled = false;
    setIsLoadingPdf(true);
    setPdfError(null);
    setPdfBase64(null);

    fetch(uri)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Unable to load PDF (${response.status})`);
        }

        const buffer = await response.arrayBuffer();
        if (cancelled) {
          return;
        }

        setPdfBase64(arrayBufferToBase64(buffer));
      })
      .catch((error) => {
        if (!cancelled) {
          setPdfError(error instanceof Error ? error.message : 'Unable to open PDF.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingPdf(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [visible, kind, uri]);

  const pdfHtml = useMemo(
    () => (pdfBase64 ? buildPdfViewerHtml(pdfBase64, isDark) : null),
    [pdfBase64, isDark]
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors['outline-variant'] }]}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close preview">
            <Ionicons name="close" size={26} color={colors.primary} />
          </Pressable>
          <Text style={[styles.title, { color: colors['on-surface'] }]} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.body}>
          {kind === 'image' ? (
            <Image
              source={{ uri }}
              style={styles.image}
              contentFit="contain"
              transition={200}
            />
          ) : isLoadingPdf ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[Typography.caption, { color: colors['on-surface-variant'] }]}>
                Loading document…
              </Text>
            </View>
          ) : pdfError ? (
            <View style={styles.loading}>
              <Ionicons name="alert-circle-outline" size={28} color={colors.error} />
              <Text style={[Typography.caption, { color: colors.error, textAlign: 'center' }]}>
                {pdfError}
              </Text>
            </View>
          ) : pdfHtml ? (
            <WebView
              originWhitelist={['*']}
              source={{ html: pdfHtml }}
              style={[styles.webview, { backgroundColor: isDark ? colors.background : '#fff' }]}
              setSupportMultipleWindows={false}
              javaScriptEnabled
              allowFileAccess
              allowingReadAccessToURL="*"
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return globalThis.btoa(binary);
}

function buildPdfViewerHtml(base64: string, isDark: boolean): string {
  const background = isDark ? '#0f1419' : '#ffffff';
  const text = isDark ? '#e8eaed' : '#1a1a1a';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=4" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: ${background};
      color: ${text};
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    #status {
      padding: 24px 16px;
      text-align: center;
      font-size: 14px;
    }
    #viewer {
      padding: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    canvas {
      width: 100% !important;
      height: auto !important;
      max-width: 100%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      background: #fff;
    }
  </style>
</head>
<body>
  <div id="status">Opening PDF…</div>
  <div id="viewer"></div>
  <script>
    (function () {
      var statusEl = document.getElementById('status');
      var viewer = document.getElementById('viewer');
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      var raw = atob('${base64}');
      var bytes = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i++) {
        bytes[i] = raw.charCodeAt(i);
      }

      pdfjsLib.getDocument({ data: bytes }).promise.then(function (pdf) {
        statusEl.style.display = 'none';
        var scale = Math.min(2, (window.devicePixelRatio || 1) * 1.25);

        function renderPage(pageNum) {
          return pdf.getPage(pageNum).then(function (page) {
            var viewport = page.getViewport({ scale: scale });
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            viewer.appendChild(canvas);
            return page.render({ canvasContext: context, viewport: viewport }).promise;
          });
        }

        var chain = Promise.resolve();
        for (var page = 1; page <= pdf.numPages; page++) {
          (function (pageNum) {
            chain = chain.then(function () { return renderPage(pageNum); });
          })(page);
        }
        return chain;
      }).catch(function (error) {
        statusEl.textContent = 'Could not render PDF: ' + (error && error.message ? error.message : error);
      });
    })();
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 16,
  },
  headerSpacer: {
    width: 26,
  },
  body: {
    flex: 1,
  },
  image: {
    flex: 1,
    width: '100%',
  },
  webview: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
});
