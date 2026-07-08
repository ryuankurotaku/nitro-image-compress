import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { compress, getImageInfo } from 'nitro-image-compress';
import type { CompressResult, ImageInfo } from 'nitro-image-compress';

export const NitroScreen: React.FC = () => {
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [sourceInfo, setSourceInfo] = useState<ImageInfo | null>(null);
  const [result, setResult] = useState<CompressResult | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = useCallback(async () => {
    const response = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
    const asset = response.assets?.[0];
    if (!asset?.uri) return;

    setSourceUri(asset.uri);
    setResult(null);
    setDuration(null);

    const info = getImageInfo(asset.uri);
    setSourceInfo(info);
  }, []);

  const compressImage = useCallback(async () => {
    if (!sourceUri) return;
    setLoading(true);

    try {
      const start = performance.now();
      const compressed = await compress(sourceUri, {
        quality: 0.7,
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'jpeg',
      });
      const elapsed = performance.now() - start;

      setResult(compressed);
      setDuration(Math.round(elapsed));
    } catch (error) {
      Alert.alert('Error', String(error));
    } finally {
      setLoading(false);
    }
  }, [sourceUri]);

  const savings = sourceInfo && result
    ? ((1 - result.size / sourceInfo.size) * 100).toFixed(1)
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>⚡ nitro-image-compress</Text>
        <Text style={styles.badge}>JSI / Nitro Modules</Text>
      </View>

      <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
        <Text style={styles.buttonText}>
          {sourceUri ? '🔄 Pick Different Image' : '📷 Pick Image'}
        </Text>
      </TouchableOpacity>

      {sourceInfo && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Source Image</Text>
          <Text style={styles.infoText}>
            {sourceInfo.width} × {sourceInfo.height} • {(sourceInfo.size / 1024 / 1024).toFixed(2)} MB
          </Text>
          <Text style={styles.infoText}>{sourceInfo.mimeType}</Text>
        </View>
      )}

      {sourceUri && (
        <TouchableOpacity
          style={[styles.compressButton, loading && styles.disabled]}
          onPress={compressImage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>🚀 Compress</Text>
          )}
        </TouchableOpacity>
      )}

      {result && duration !== null && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Result</Text>
          <Image source={{ uri: result.uri }} style={styles.preview} />
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{duration}ms</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{(result.size / 1024).toFixed(0)} KB</Text>
              <Text style={styles.statLabel}>Size</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{result.width}×{result.height}</Text>
              <Text style={styles.statLabel}>Dimensions</Text>
            </View>
          </View>
          {savings && (
            <Text style={styles.savings}>📉 Saved {savings}%</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
  badge: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
    marginTop: 4,
  },
  pickButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  compressButton: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  disabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 4 },
  infoText: { fontSize: 12, color: '#666', marginTop: 2 },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  resultTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#007AFF' },
  statLabel: { fontSize: 10, color: '#999', marginTop: 2 },
  savings: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34C759',
    textAlign: 'center',
    marginTop: 12,
  },
});
