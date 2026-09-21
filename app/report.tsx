import * as React from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { IncidentCategorySelector } from '@/src/components/IncidentCategorySelector';
import { LocationPicker } from '@/src/components/LocationPicker';
import { PhotoPicker } from '@/src/components/PhotoPicker';
import { useSession } from '@/src/store/session';
import { captureLocation, type LocationState } from '@/src/utils/location';
import { PLACEHOLDER_COLOR } from '@/lib/theme';

const URGENCY = [
  { id: 'low', label: 'Not urgent' },
  { id: 'normal', label: 'Needs attention' },
  { id: 'high', label: 'Urgent!' },
] as const;

export default function ReportScreen() {
  const router = useRouter();
  const { draft, setDraft, activeEvent, setPendingLocation } = useSession();
  const [locState, setLocState] = React.useState<LocationState>({ status: 'idle' });
  const [error, setError] = React.useState<string | null>(null);

  const requestLocation = React.useCallback(async () => {
    setLocState({ status: 'requesting' });
    try {
      const location = await captureLocation();
      setLocState({ status: 'ready', location });
      setPendingLocation(location);
    } catch (e) {
      setLocState({
        status: 'unavailable',
        message: e instanceof Error ? e.message : 'Location unavailable.',
      });
      setPendingLocation(null);
    }
  }, [setPendingLocation]);

  const next = () => {
    if (!draft.description.trim() && draft.category === 'other') {
      setError('Please describe what you observed.');
      return;
    }
    if (!draft.locationLabel.trim()) {
      setError('Tell us the area (e.g. Gate 4) so the safety team can find it.');
      return;
    }
    setError(null);
    router.push('/review');
  };

  return (
    <ScreenContainer className="px-0">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-5 pb-10">
        <View>
          <Pressable onPress={() => router.back()}>
            <Text className="text-sm text-muted-foreground">‹ Back</Text>
          </Pressable>
          <Text variant="h3" className="mt-1">What do you see?</Text>
          <Text variant="muted">
            {activeEvent ? `Reporting at ${activeEvent.name}` : 'No event joined yet'}.
            Just the facts — ShaktiOS assesses everything else.
          </Text>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium">Category</Text>
          <IncidentCategorySelector value={draft.category} onChange={(c) => setDraft({ category: c })} />
        </View>

        <View className="gap-1.5">
          <Text className="text-sm font-medium">Describe what happened</Text>
          <TextInput
            multiline
            numberOfLines={3}
            placeholder="e.g. Heavy pushing near Gate 4 and someone fell"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={draft.description}
            onChangeText={(t) => setDraft({ description: t })}
            className="min-h-[90px] rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground"
            textAlignVertical="top"
          />
        </View>

        <LocationPicker
          label={draft.locationLabel}
          onLabelChange={(t) => setDraft({ locationLabel: t })}
          locationState={locState}
          onRetryLocation={requestLocation}
        />

        <PhotoPicker photoUri={draft.photoUri} onChange={(uri) => setDraft({ photoUri: uri })} />

        <View className="gap-2">
          <Text className="text-sm font-medium">How urgent does this look?</Text>
          <View className="flex-row gap-2">
            {URGENCY.map((u) => (
              <Pressable
                key={u.id}
                onPress={() => setDraft({ urgency: u.id })}
                className={`flex-1 rounded-lg border py-2.5 ${
                  draft.urgency === u.id ? 'border-primary bg-primary/5' : 'border-border'
                }`}>
                <Text className="text-center text-sm font-medium">{u.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

        <Pressable onPress={next} className="rounded-xl bg-primary py-4">
          <Text className="text-center text-base font-bold text-primary-foreground">
            Review report
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
