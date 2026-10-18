import type React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BenchmarkResult } from '../utils/index.js';

interface Props {
  results: BenchmarkResult[];
}

const getBarColor = (index: number): string => {
  const colors = ['#34C759', '#007AFF', '#FF9500'];
  return colors[index % colors.length]!;
};

export const BenchmarkChart: React.FC<Props> = ({ results }) => {
  const maxDuration = Math.max(...results.map((r) => r.duration)) || 1;
  const maxOutputSize = Math.max(...results.map((r) => r.outputSize)) || 1;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⏱ Duration (ms) — lower is better</Text>
      {results.map((result, index) => (
        <View key={result.library} style={styles.row}>
          <Text style={styles.label} numberOfLines={1}>
            {result.library}
          </Text>
          <View style={styles.barRow}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${Math.max(2, (result.duration / maxDuration) * 100)}%`,
                    backgroundColor: getBarColor(index),
                  },
                ]}
              />
            </View>
            <Text style={styles.value}>{result.duration}ms</Text>
          </View>
        </View>
      ))}

      <Text style={[styles.title, styles.sizeTitle]}>📦 Output Size (KB) — lower is better</Text>
      {results.map((result, index) => (
        <View key={`size-${result.library}`} style={styles.row}>
          <Text style={styles.label} numberOfLines={1}>
            {result.library}
          </Text>
          <View style={styles.barRow}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${Math.max(2, (result.outputSize / maxOutputSize) * 100)}%`,
                    backgroundColor: getBarColor(index),
                  },
                ]}
              />
            </View>
            <Text style={styles.value}>{(result.outputSize / 1024).toFixed(0)} KB</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  sizeTitle: {
    marginTop: 20,
  },
  row: {
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  barTrack: {
    flex: 1,
    height: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    minWidth: 54,
    textAlign: 'right',
    color: '#333',
  },
});
