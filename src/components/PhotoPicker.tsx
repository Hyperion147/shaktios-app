import * as React from 'react';
import { Image, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Text } from '@/components/ui/text';

/**
 * Optional evidence picker. Stores only a local URI for now —
 * the backend MVP has no media upload, so the submission service
 * ignores the attachment until an upload endpoint exists.
 */
export function PhotoPicker({
  photoUri,
  onChange,
}: {
  photoUri: string | null;
  onChange: (uri: string | null) => void;
}) {
  const [denied, setDenied] = React.useState(false);

  const pick = async () => {
    setDenied(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setDenied(true);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium">Photo evidence (optional)</Text>
      {photoUri ? (
        <View className="gap-2">
          <Image source={{ uri: photoUri }} className="h-36 w-full rounded-xl" resizeMode="cover" />
          <View className="flex-row gap-2">
            <Pressable onPress={pick} className="flex-1 rounded-lg border border-border py-2.5">
              <Text className="text-center text-sm font-medium">Replace</Text>
            </Pressable>
            <Pressable
              onPress={() => onChange(null)}
              className="flex-1 rounded-lg border border-border py-2.5">
              <Text className="text-center text-sm font-medium">Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={pick}
          className="items-center rounded-xl border border-dashed border-border py-5">
          <Text className="font-medium">Add a photo</Text>
          <Text variant="muted" className="text-xs">
            Helps the safety team understand the scene
          </Text>
        </Pressable>
      )}
      {denied ? (
        <Text className="text-xs text-muted-foreground">
          Photo access denied — you can still submit without a photo.
        </Text>
      ) : null}
    </View>
  );
}
