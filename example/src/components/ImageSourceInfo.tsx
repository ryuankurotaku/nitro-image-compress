import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { ImageSource } from '../utils/index.js';

interface Props {
  source: ImageSource;
}

export const ImageSourceInfo: React.FC<Props> = ({ source }) => {
  return (
    <View style={styles.container}>
      <Image source={{ uri: source.uri }} style={styles.preview} />
      <View style={styles.info}>
        <Text style={styles.fileName} numberOfLines={1}>
          {source.fileName}
        </Text>
        <Text style={styles.detail}>
          {source.width} × {source.height}
        </Text>
        <Text style={styles.detail}>
          {(source.fileSize / 1024 / 1024).toFixed(2)} MB
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    alignItems: 'center',
  },
  preview: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  detail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
