import type React from 'react';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { getImageInfo } from 'react-native-nitro-image-compressor';
import {
  BenchmarkChart,
  EmptyState,
  ImageSourceInfo,
  ResultCard,
  ScreenHeader,
} from '../components';
import type { BenchmarkResult, ImageSource } from '../utils';
import { runBenchmark } from '../utils';

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
      fileName: asset.fileName ?? 'Photo',
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

    // Yield so React flushes the loading state and becomes completely idle before benchmarking
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const benchResults = await runBenchmark(source);
      setResults(benchResults);
      setRunCount((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [source]);

  const validResults = results.filter((r) => !r.error);
  const winner =
    validResults.length > 0
      ? validResults.reduce((best, r) => (r.duration < best.duration ? r : best))
      : null;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="🏎️ Head-to-Head"
        badge="BENCHMARK"
        badgeColor="#4f46e5"
        subtitle="Same image, same params, 3 libraries"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {!source ? (
          <EmptyState
            onPickPress={pickImage}
            title="Benchmark 3 Libraries"
            description="Pick a photo to measure execution time, output size, and image quality side-by-side."
            buttonLabel="Choose Image from Library"
          />
        ) : (
          <>
            <ImageSourceInfo source={source} onChangePress={pickImage} />

            <TouchableOpacity
              style={[styles.benchButton, loading && styles.disabled]}
              onPress={startBenchmark}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.benchButtonText}> Running all 3 libraries...</Text>
                </View>
              ) : (
                <Text style={styles.benchButtonText}>
                  🚀 Run Benchmark{runCount > 0 ? ` (#${runCount + 1})` : ''}
                </Text>
              )}
            </TouchableOpacity>

            {winner && (
              <View style={styles.winnerBanner}>
                <View style={styles.trophyCircle}>
                  <Text style={styles.trophyIcon}>🏆</Text>
                </View>
                <View style={styles.winnerInfo}>
                  <Text style={styles.winnerTitle}>Fastest Library</Text>
                  <Text style={styles.winnerText}>
                    {winner.library} won at{' '}
                    <Text style={styles.winnerHighlight}>{winner.duration}ms</Text>
                  </Text>
                </View>
              </View>
            )}

            {validResults.length > 0 && <BenchmarkChart results={validResults} />}

            {results.length > 0 && (
              <View style={styles.resultsSection}>
                <Text style={styles.sectionTitle}>Library Breakdown</Text>
                {results.map((result) => (
                  <ResultCard key={result.library} result={result} />
                ))}
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
  benchButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  disabled: {
    opacity: 0.65,
  },
  benchButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  trophyCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trophyIcon: {
    fontSize: 20,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  winnerText: {
    fontSize: 13,
    color: '#065f46',
    fontWeight: '600',
    marginTop: 1,
  },
  winnerHighlight: {
    fontWeight: '800',
    color: '#047857',
  },
  resultsSection: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
  },
});
