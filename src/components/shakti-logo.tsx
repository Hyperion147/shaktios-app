import { Image } from 'react-native';

/** Decorative brand mark; sign-in and splash already render the ShaktiOS name. */
export function ShaktiLogo({ size = 84 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/images/shakti-mark.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
