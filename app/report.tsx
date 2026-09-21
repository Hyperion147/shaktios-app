import * as React from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppInput } from '@/src/components/AppInput';
import { IncidentCategorySelector } from '@/src/components/IncidentCategorySelector';
import { LocationStatus } from '@/src/components/LocationStatus';
import { useSession } from '@/src/store/session';
import { captureLocation, type LocationState } from '@/src/utils/location';

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

  React.useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const next = () => {
    if (!draft.description.trim() && draft.category === 'other') {
      setError('Please describe what you observed.');
      return;
    }
    if (!draft.locationLabel.trim()) {
      setError('Zone / gate is required so the backend can correlate your report.');
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
            {activeEvent ? `Reporting at ${activeEvent.name}` : 'No event joined — location label is required'}.
            Your observation goes to ShaktiOS; risk is assessed server-side.
          </Text>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium">Category</Text>
          <IncidentCategorySelector value={draft.category} onChange={(c) => setDraft({ category: c })} />
        </View>

        <View className="gap-1.5">
          <Text className="text-sm font-medium">Description</Text>
          <TextInput
            multiline
            numberOfLines={3}
            placeholder="e.g. Smoke near Gate 3, crowd pushing"
            placeholderTextColor="#9ca3af"
            value={draft.description}
            onChangeText={(t) => setDraft({ description: t })}
            className="min-h-[90px] rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground"
            textAlignVertical="top"
          />
        </View>

        <AppInput
          label="Zone / gate (matches backend location)"
          placeholder="e.g. gate_4"
          autoCapitalize="none"
          value={draft.locationLabel}
          onChangeText={(t) => setDraft({ locationLabel: t })}
          hint="Exact zone string — this is how reports correlate with incidents."
        />

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

        <View className="gap-2">
          <Text className="text-sm font-medium">Your location</Text>
          <LocationStatus state={locState} onRetry={requestLocation} />
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
