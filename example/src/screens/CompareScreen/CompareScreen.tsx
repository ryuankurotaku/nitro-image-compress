import type React from 'react';
import { useCallback, useMemo, useReducer } from 'react';
import {
  ActivityIndicator,
  Alert,
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
} from '../../components';
import {
  BENCHMARK_DISPATCH_DELAY_MS,
  COMPARE_SCREEN_BADGE,
  COMPARE_SCREEN_BADGE_COLOR,
  COMPARE_SCREEN_SUBTITLE,
  COMPARE_SCREEN_TITLE,
  INITIAL_COMPARE_STATE,
} from './constants';
import { compareReducer } from './reducer';
import { runBenchmark } from './utils';

const CompareScreen: React.FC = () => {
  const [state, dispatch] = useReducer(compareReducer, INITIAL_COMPARE_STATE);
  const { source, results, loading, runCount } = state;

  const pickImage = useCallback(async () => {
    try {
      const response = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
      if (response.didCancel) return;
      if (response.errorMessage) {
        Alert.alert('Image Picker Error', response.errorMessage);
        return;
      }

      const asset = response.assets?.[0];
      if (!asset?.uri) return;

      const info = getImageInfo(asset.uri);
      dispatch({
        type: 'SET_SOURCE',
        payload: {
          uri: asset.uri,
          fileName: asset.fileName ?? 'Photo',
          fileSize: info.size,
          width: info.width,
          height: info.height,
        },
      });
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  }, []);

  const startBenchmark = useCallback(async () => {
    if (!source || loading) return;
    dispatch({ type: 'START_BENCHMARK' });

    // Yield so React flushes the loading state and becomes completely idle before benchmarking
    await new Promise((resolve) => setTimeout(resolve, BENCHMARK_DISPATCH_DELAY_MS));

    try {
      const benchResults = await runBenchmark(source);
      dispatch({ type: 'BENCHMARK_SUCCESS', payload: benchResults });
    } catch (error) {
      dispatch({ type: 'BENCHMARK_FAILURE' });
      Alert.alert('Benchmark Failed', String(error));
    }
  }, [source, loading]);

  const validResults = useMemo(() => results.filter((r) => !r.error), [results]);

  const winner = useMemo(
    () =>
      validResults.length > 0
        ? validResults.reduce((best, r) => (r.duration < best.duration ? r : best))
        : null,
    [validResults],
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={COMPARE_SCREEN_TITLE}
        badge={COMPARE_SCREEN_BADGE}
        badgeColor={COMPARE_SCREEN_BADGE_COLOR}
        subtitle={COMPARE_SCREEN_SUBTITLE}
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

export default CompareScreen;

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
