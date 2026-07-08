import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { getImageInfo } from 'react-native-nitro-image-compressor';
import { BenchmarkChart, ResultCard, ImageSourceInfo } from '../components';
import { runBenchmark } from '../utils';
import type { BenchmarkResult, ImageSource } from '../utils';

export const CompareScreen: React.FC = () => {
  const [source, setSource] = useState<ImageSource | null>(null);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [runCount, setRunCount] = useState(0);

  const pickImage = useCallback(async () => {
    const response = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
    const asset = response.assets?.[0];
    if (!asset?.uri) return;

    const info = getImageInfo(asset.uri);
    setSource({
      uri: asset.uri,
      fileName: asset.fileName ?? 'Unknown',
      fileSize: info.size,
      width: info.width,
      height: info.height,
    });
    setResults([]);
    setRunCount(0);
  }, []);

  const startBenchmark = useCallback(async () => {
    if (!source) return;
    setLoading(true);
    setResults([]);

    try {
      const benchResults = await runBenchmark(source);
      setResults(benchResults);
      setRunCount((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [source]);

  const validResults = results.filter((r) => !r.error);
  const winner = validResults.length > 0
    ? validResults.reduce((best, r) => (r.duration < best.duration ? r : best))
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🏎️ Head-to-Head</Text>
        <Text style={styles.subtitle}>Same image, same params, all 3 libraries</Text>
      </View>

      <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
        <Text style={styles.buttonText}>
          {source ? '🔄 Pick Different Image' : '📷 Pick Image'}
        </Text>
      </TouchableOpacity>

      {source && <ImageSourceInfo source={source} />}

      {source && (
        <TouchableOpacity
          style={[styles.benchButton, loading && styles.disabled]}
          onPress={startBenchmark}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.buttonText}>  Running all 3...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>
              🚀 Run Benchmark{runCount > 0 ? ` (#${runCount + 1})` : ''}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {winner && (
        <View style={styles.winnerBanner}>
          <Text style={styles.winnerText}>
            🏆 Winner: {winner.library} — {winner.duration}ms
          </Text>
        </View>
      )}

      {validResults.length > 0 && <BenchmarkChart results={validResults} />}

      {results.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Individual Results</Text>
          {results.map((result) => (
            <ResultCard key={result.library} result={result} />
          ))}
        </View>
      )}

      {!source && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Pick an image to run a fair comparison across all 3 compression libraries
            using identical parameters:
          </Text>
          <Text style={styles.paramText}>• Quality: 70% JPEG</Text>
          <Text style={styles.paramText}>• Max: 1920 × 1080</Text>
          <Text style={styles.paramText}>• Metric: wall-clock time (ms)</Text>
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
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  pickButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  benchButton: {
    backgroundColor: '#5856D6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  disabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  winnerBanner: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  winnerText: { fontSize: 15, fontWeight: '700', color: '#664D03' },
  resultsSection: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8 },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  infoText: { fontSize: 13, color: '#555', marginBottom: 8 },
  paramText: { fontSize: 12, color: '#666', marginLeft: 8, marginTop: 2 },
});
