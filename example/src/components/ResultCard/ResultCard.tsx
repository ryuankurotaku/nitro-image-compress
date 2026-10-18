import type React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { ResultCardProps } from './types';
import { getLibraryConfig } from './utils';

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const config = getLibraryConfig(result.library);

  if (result.error) {
    return (
      <View style={[styles.card, styles.errorCard]}>
        <View style={styles.headerRow}>
          <Text style={styles.libraryName}>
            {config.icon} {result.library}
          </Text>
          <View style={styles.errorBadge}>
            <Text style={styles.errorBadgeText}>FAILED</Text>
          </View>
        </View>
        <Text style={styles.errorText}>❌ {result.error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Text style={styles.icon}>{config.icon}</Text>
          <Text style={styles.libraryName}>{result.library}</Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: `${config.color}15`, borderColor: `${config.color}35` },
          ]}
        >
          <Text style={[styles.badgeText, { color: config.color }]}>{config.badge}</Text>
        </View>
      </View>

      <Image source={{ uri: result.outputUri }} style={styles.preview} />

      <View style={styles.stats}>
        <View style={styles.statTile}>
          <Text style={[styles.statValue, { color: config.color }]}>{result.duration}ms</Text>
          <Text style={styles.statLabel}>DURATION</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{(result.outputSize / 1024).toFixed(0)} KB</Text>
          <Text style={styles.statLabel}>FILE SIZE</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statTile}>
          <Text style={styles.statValue}>
            {result.outputWidth}×{result.outputHeight}
          </Text>
          <Text style={styles.statLabel}>DIMENSIONS</Text>
        </View>
      </View>
    </View>
  );
};

export default ResultCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  errorCard: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  icon: {
    fontSize: 16,
  },
  libraryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  errorBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  errorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
  },
  preview: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginBottom: 14,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 10,
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
    height: 24,
    backgroundColor: '#e2e8f0',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});
