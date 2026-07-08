import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { BenchmarkResult } from '../utils/index.js';

interface Props {
  result: BenchmarkResult;
}

export const ResultCard: React.FC<Props> = ({ result }) => {
  if (result.error) {
    return (
      <View style={[styles.card, styles.errorCard]}>
        <Text style={styles.libraryName}>{result.library}</Text>
        <Text style={styles.errorText}>❌ {result.error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.libraryName}>{result.library}</Text>
      <Image source={{ uri: result.outputUri }} style={styles.preview} />
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{result.duration}ms</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {(result.outputSize / 1024).toFixed(0)} KB
          </Text>
          <Text style={styles.statLabel}>Size</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {result.outputWidth}×{result.outputHeight}
          </Text>
          <Text style={styles.statLabel}>Dimensions</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  errorCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  libraryName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  preview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
  },
});
