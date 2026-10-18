import type React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BenchmarkResult } from '../utils/index.js';

interface Props {
  results: BenchmarkResult[];
}

const getLibraryConfig = (library: string) => {
  if (library.includes('nitro')) {
    return {
      name: 'Nitro Compressor',
      tag: 'JSI / Metal',
      color: '#10b981',
      bgLight: '#ecfdf5',
      badgeColor: '#059669',
    };
  }
  if (library.includes('resizer')) {
    return {
      name: 'Image Resizer',
      tag: 'Bridge',
      color: '#3b82f6',
      bgLight: '#eff6ff',
      badgeColor: '#2563eb',
    };
  }
  return {
    name: 'RN Compressor',
    tag: 'Bridge',
    color: '#f97316',
    bgLight: '#fff7ed',
    badgeColor: '#ea580c',
  };
};

export const BenchmarkChart: React.FC<Props> = ({ results }) => {
  const minDuration = Math.min(...results.map((r) => r.duration)) || 1;
  const maxDuration = Math.max(...results.map((r) => r.duration)) || 1;
  const minOutputSize = Math.min(...results.map((r) => r.outputSize)) || 1;
  const maxOutputSize = Math.max(...results.map((r) => r.outputSize)) || 1;

  return (
    <View style={styles.container}>
      {/* Duration Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⏱ Duration</Text>
        <Text style={styles.unitNote}>Lower is better</Text>
      </View>

      <View style={styles.chartBlock}>
        {results.map((result) => {
          const config = getLibraryConfig(result.library);
          const isFastest = result.duration === minDuration;
          const ratio = (result.duration / maxDuration) * 100;

          return (
            <View key={result.library} style={styles.entryRow}>
              <View style={styles.entryHeader}>
                <View style={styles.labelGroup}>
                  <View style={[styles.dot, { backgroundColor: config.color }]} />
                  <Text style={styles.libraryLabel}>{config.name}</Text>
                  <View style={[styles.techPill, { backgroundColor: config.bgLight }]}>
                    <Text style={[styles.techPillText, { color: config.badgeColor }]}>
                      {config.tag}
                    </Text>
                  </View>
                </View>
                <View style={styles.valueGroup}>
                  {isFastest && (
                    <View style={styles.fastestBadge}>
                      <Text style={styles.fastestText}>FASTEST</Text>
                    </View>
                  )}
                  <Text style={[styles.valueText, isFastest && styles.fastestValue]}>
                    {result.duration}ms
                  </Text>
                </View>
              </View>

              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.max(6, ratio)}%`,
                      backgroundColor: config.color,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Output Size Section */}
      <View style={[styles.sectionHeader, styles.sizeHeader]}>
        <Text style={styles.sectionTitle}>📦 Output Size</Text>
        <Text style={styles.unitNote}>Lower is better</Text>
      </View>

      <View style={styles.chartBlock}>
        {results.map((result) => {
          const config = getLibraryConfig(result.library);
          const isSmallest = result.outputSize === minOutputSize;
          const ratio = (result.outputSize / maxOutputSize) * 100;
          const sizeKB = (result.outputSize / 1024).toFixed(0);

          return (
            <View key={`size-${result.library}`} style={styles.entryRow}>
              <View style={styles.entryHeader}>
                <View style={styles.labelGroup}>
                  <View style={[styles.dot, { backgroundColor: config.color }]} />
                  <Text style={styles.libraryLabel}>{config.name}</Text>
                </View>
                <View style={styles.valueGroup}>
                  {isSmallest && (
                    <View style={[styles.fastestBadge, styles.smallestBadge]}>
                      <Text style={[styles.fastestText, styles.smallestText]}>LEAST BYTES</Text>
                    </View>
                  )}
                  <Text style={[styles.valueText, isSmallest && styles.smallestValue]}>
                    {sizeKB} KB
                  </Text>
                </View>
              </View>

              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.max(6, ratio)}%`,
                      backgroundColor: config.color,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sizeHeader: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  unitNote: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  chartBlock: {
    gap: 12,
  },
  entryRow: {
    marginBottom: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  libraryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  techPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  techPillText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fastestBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fastestText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#065f46',
    letterSpacing: 0.5,
  },
  smallestBadge: {
    backgroundColor: '#e0f2fe',
  },
  smallestText: {
    color: '#0369a1',
  },
  valueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  fastestValue: {
    color: '#059669',
    fontWeight: '800',
  },
  smallestValue: {
    color: '#0284c7',
    fontWeight: '800',
  },
  track: {
    height: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
