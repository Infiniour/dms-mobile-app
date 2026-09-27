import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/theme';

type ImageFieldProps = {
  label: string;
  type: 'banner' | 'logo';
  imageUri: string | null;
  onPress: () => void;
  backgroundColor: string;
  iconColor: string;
  labelColor: string;
  borderColor: string;
};

export function FormImageField({
  label,
  type,
  imageUri,
  onPress,
  backgroundColor,
  iconColor,
  labelColor,
  borderColor,
}: ImageFieldProps) {
  const isBanner = type === 'banner';
  const height = isBanner ? 160 : 'auto';
  const size = isBanner ? 56 : 40;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <Pressable onPress={onPress}>
        <View
          style={[
            styles.field,
            isBanner ? styles.bannerField : styles.logoField,
            {
              backgroundColor,
              borderColor,
              height: isBanner ? 160 : undefined,
            },
          ]}>
          <Ionicons name="image-outline" size={size} color={iconColor} />
        </View>
      </Pressable>
      {imageUri && (
        <Text style={[styles.selected, { color: iconColor }]}>✓ Image selected</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingBottom: 12,
  },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerField: {
    height: 160,
  },
  logoField: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
  },
  selected: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
