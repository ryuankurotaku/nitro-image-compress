import type React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  DEFAULT_EMPTY_STATE_BUTTON_LABEL,
  DEFAULT_EMPTY_STATE_DESCRIPTION,
  DEFAULT_EMPTY_STATE_FEATURES,
  DEFAULT_EMPTY_STATE_TITLE,
} from './constants';
import type { EmptyStateProps } from './types';

const EmptyState: React.FC<EmptyStateProps> = ({
  onPickPress,
  title = DEFAULT_EMPTY_STATE_TITLE,
  description = DEFAULT_EMPTY_STATE_DESCRIPTION,
  buttonLabel = DEFAULT_EMPTY_STATE_BUTTON_LABEL,
  features = DEFAULT_EMPTY_STATE_FEATURES,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.dropZone} onPress={onPickPress} activeOpacity={0.85}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>📸</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.primaryButton}>
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </View>
      </TouchableOpacity>

      {features.length > 0 && (
        <View style={styles.featuresRow}>
          {features.map((feature) => (
            <View key={feature.label} style={styles.featurePill}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureText}>{feature.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default EmptyState;

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  dropZone: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    padding: 28,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  featureIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
});
