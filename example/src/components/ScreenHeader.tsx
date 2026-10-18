import type React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  title: string;
  badge?: string;
  badgeColor?: string;
  subtitle: string;
}

export const ScreenHeader: React.FC<Props> = ({
  title,
  badge,
  badgeColor = '#10B981',
  subtitle,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {badge && (
          <View
            style={[
              styles.badge,
              { backgroundColor: `${badgeColor}15`, borderColor: `${badgeColor}40` },
            ]}
          >
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '400',
  },
});
