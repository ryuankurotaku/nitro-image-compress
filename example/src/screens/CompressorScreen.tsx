import type React from 'react';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as RNCompressor } from 'react-native-compressor';
import { launchImageLibrary } from 'react-native-image-picker';
import type { ImageInfo } from 'react-native-nitro-image-compressor';
import { getImageInfo } from 'react-native-nitro-image-compressor';
import { EmptyState, ScreenHeader } from '../components';

interface CompressorResult {
  uri: string;
  width: number;
  height: number;
  size: number;
}

export const CompressorScreen: React.FC = () => {
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [sourceInfo, setSourceInfo] = useState<ImageInfo | null>(null);
  const [result, setResult] = useState<CompressorResult | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [runCount, setRunCount] = useState(0);

  const pickImage = useCallback(async () => {
    const response = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
    const asset = response.assets?.[0];
    if (!asset?.uri) return;

    setSourceUri(asset.uri);
    setResult(null);
    setDuration(null);
    setRunCount(0);

    const info = getImageInfo(asset.uri);
    setSourceInfo(info);
  }, []);

  const compressImage = useCallback(async () => {
    if (!sourceUri) return;
    setLoading(true);

    try {
      const start = performance.now();
      const compressedUri = await RNCompressor.compress(sourceUri, {
        compressionMethod: 'manual',
        quality: 0.7,
        maxWidth: 1920,
        maxHeight: 1080,
        output: 'jpg',
      });
      const elapsed = performance.now() - start;

      const info = getImageInfo(compressedUri);

      setResult({
        uri: compressedUri,
        width: info.width,
        height: info.height,
        size: info.size,
      });
      setDuration(Math.round(elapsed));
      setRunCount((prev) => prev + 1);
    } catch (error) {
      Alert.alert('Error', String(error));
    } finally {
      setLoading(false);
    }
  }, [sourceUri]);

  const savings =
    sourceInfo && result ? ((1 - result.size / sourceInfo.size) * 100).toFixed(1) : null;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="🗜️ RN Compressor"
        badge="Bridge / Native"
        badgeColor="#f97316"
        subtitle="Community native bridge compression module"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {!sourceUri ? (
          <EmptyState
            onPickPress={pickImage}
            title="Test RN Compressor"
            description="Pick a photo to test compression with react-native-compressor via traditional bridge."
            buttonLabel="Select Photo from Library"
          />
        ) : (
          <>
            {sourceInfo && (
              <View style={styles.sourceCard}>
                <Image source={{ uri: sourceUri }} style={styles.sourceThumbnail} />
                <View style={styles.sourceDetails}>
                  <Text style={styles.sourceLabel}>SOURCE PHOTO</Text>
                  <Text style={styles.sourceDims}>
                    {sourceInfo.width} × {sourceInfo.height}
                  </Text>
                  <Text style={styles.sourceSize}>
                    {(sourceInfo.size / 1024 / 1024).toFixed(2)} MB •{' '}
                    {sourceInfo.mimeType.split('/')[1]?.toUpperCase() ?? 'IMAGE'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.changeBtn} onPress={pickImage} activeOpacity={0.7}>
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.compressButton, loading && styles.disabled]}
              onPress={compressImage}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.btnRow}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.compressButtonText}> Compressing...</Text>
                </View>
              ) : (
                <Text style={styles.compressButtonText}>
                  🗜️ Compress with RN Compressor{runCount > 0 ? ` (#${runCount + 1})` : ''}
                </Text>
              )}
            </TouchableOpacity>

            {result && duration !== null && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultTitleCol}>
                    <Text style={styles.resultTitle}>Compressed Output</Text>
                    <Text style={styles.resultSubtitle}>Native Bridge • 70% Quality • 1080p</Text>
                  </View>
                  <View style={styles.durationPill}>
                    <Text style={styles.durationPillText}>{duration}ms</Text>
                  </View>
                </View>

                <Image source={{ uri: result.uri }} style={styles.preview} />

                <View style={styles.statsGrid}>
                  <View style={styles.statTile}>
                    <Text style={styles.statTileValue}>{duration}ms</Text>
                    <Text style={styles.statTileLabel}>DURATION</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statTile}>
                    <Text style={styles.statTileValue}>{(result.size / 1024).toFixed(0)} KB</Text>
                    <Text style={styles.statTileLabel}>OUTPUT SIZE</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statTile}>
                    <Text style={styles.statTileValue}>
                      {result.width}×{result.height}
                    </Text>
                    <Text style={styles.statTileLabel}>RESOLUTION</Text>
                  </View>
                </View>

                {savings && (
                  <View style={styles.savingsBanner}>
                    <Text style={styles.savingsIcon}>📉</Text>
                    <Text style={styles.savingsText}>
                      Reduced file size by <Text style={styles.savingsPercent}>{savings}%</Text>
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  sourceThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  sourceDetails: {
    flex: 1,
    marginLeft: 12,
  },
  sourceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  sourceDims: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  sourceSize: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  compressButton: {
    backgroundColor: '#f97316',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  disabled: {
    opacity: 0.65,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compressButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultTitleCol: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  resultSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  durationPill: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  durationPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ea580c',
  },
  preview: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#e2e8f0',
  },
  statTileValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  statTileLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7ed',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  savingsIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c2410c',
  },
  savingsPercent: {
    fontWeight: '800',
    color: '#9a3412',
  },
});
