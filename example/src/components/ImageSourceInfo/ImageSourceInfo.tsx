import type React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SOURCE_IMAGE_THUMBNAIL_SIZE } from './constants';
import type { ImageSourceInfoProps } from './types';

const ImageSourceInfo: React.FC<ImageSourceInfoProps> = ({ source, onChangePress }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: source.uri }} style={styles.preview} />
      <View style={styles.info}>
        <Text style={styles.fileName} numberOfLines={1}>
          {source.fileName}
        </Text>
        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {source.width} × {source.height}
            </Text>
          </View>
          <View style={[styles.tag, styles.sizeTag]}>
            <Text style={[styles.tagText, styles.sizeTagText]}>
              {(source.fileSize / 1024 / 1024).toFixed(2)} MB
            </Text>
          </View>
        </View>
      </View>
      {onChangePress && (
        <TouchableOpacity style={styles.changeButton} onPress={onChangePress} activeOpacity={0.7}>
          <Text style={styles.changeButtonText}>Change</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ImageSourceInfo;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  preview: {
    width: SOURCE_IMAGE_THUMBNAIL_SIZE,
    height: SOURCE_IMAGE_THUMBNAIL_SIZE,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  info: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  sizeTag: {
    backgroundColor: '#e0f2fe',
  },
  sizeTagText: {
    color: '#0284c7',
  },
  changeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginLeft: 8,
  },
  changeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
});
