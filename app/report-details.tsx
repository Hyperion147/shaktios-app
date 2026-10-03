import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { CategoryIcon, PrimaryButton, ScreenHeader, Stepper } from '@/src/components/design';
import { useSession } from '@/src/store/session';
import { INCIDENT_CATEGORIES } from '@/src/constants/config';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';

const MAX_LEN = 500;
const URGENCY = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
] as const;

/** Collect the report description, urgency, and server-defined venue zone. */
export default function ReportDetailsScreen() {
  const router = useRouter();
  const { draft, setDraft, activeEvent } = useSession();
  const [error, setError] = React.useState<string | null>(null);
  const category = INCIDENT_CATEGORIES.find((item) => item.id === draft.category);

  const next = () => {
    if (!activeEvent || activeEvent.status === 'ended') {
      setError('Join an active or upcoming event before continuing.');
      return;
    }
    if (!draft.zoneId) {
      setError('Select the venue zone where you observed the incident.');
      return;
    }
    if (!draft.description.trim() && draft.category === 'other') {
      setError('Please describe what you observed.');
      return;
    }
    setError(null);
    router.push('/location');
  };

  return (
    <ScreenContainer className="px-0">
      <View className="px-5">
        <ScreenHeader title="Report Incident" onBack={() => router.back()} />
        <Stepper steps={['Category', 'Details', 'Location', 'Review']} current={1} />
      </View>
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-6">
        <View className="gap-1.5">
          <Label>Category</Label>
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3">
            {category ? <CategoryIcon id={category.id} size={32} /> : null}
            <Text className="flex-1 text-[14px] font-semibold">{category?.label ?? 'Select'}</Text>
            <ChevronDown size={18} color={THEME.light.mutedForeground} />
          </Pressable>
        </View>

        <View className="gap-1.5">
          <Label>Description (optional)</Label>
          <Textarea
            maxLength={MAX_LEN}
            placeholder="Describe what you observed and where it happened."
            placeholderTextColor={THEME.light.mutedForeground}
            value={draft.description}
            onChangeText={(text) => setDraft({ description: text })}
            className="min-h-[110px] rounded-2xl border-border bg-card text-[14px]"
          />
          <Text className="text-right text-[11px] text-muted-foreground">
            {draft.description.length}/{MAX_LEN}
          </Text>
        </View>

        <View className="gap-1.5">
          <Label>Venue zone</Label>
          <Text variant="muted" className="text-[12px]">
            Choose a zone from the selected event. Reports use its canonical id for backend routing.
          </Text>
          <View className="gap-2">
            {(activeEvent?.zones ?? []).map((zone) => {
              const selected = draft.zoneId === zone.id;
              return (
                <Pressable
                  key={zone.id}
                  onPress={() => setDraft({ zoneId: zone.id, locationLabel: zone.label })}
                  className={cn(
                    'rounded-2xl border px-4 py-3',
                    selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  )}>
                  <Text
                    className={cn('text-[13px] font-medium', selected && 'font-bold text-primary')}>
                    {zone.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {!activeEvent?.zones.length ? (
            <Text className="text-[13px] text-destructive">
              No zones are available for this event.
            </Text>
          ) : null}
        </View>

        <View className="gap-1.5">
          <Label>Urgency Level</Label>
          <ToggleGroup
            type="single"
            value={draft.urgency}
            onValueChange={(value) => {
              if (value) setDraft({ urgency: value as 'low' | 'medium' | 'high' });
            }}
            className="gap-2">
            {URGENCY.map((item) => {
              const selected = draft.urgency === item.id;
              return (
                <ToggleGroupItem
                  key={item.id}
                  value={item.id}
                  className={cn(
                    'h-12 flex-1 rounded-2xl border',
                    selected ? 'border-primary bg-primary' : 'border-border bg-card'
                  )}>
                  <Text
                    className={cn(
                      'text-[13px] font-bold',
                      selected ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}>
                    {item.label}
                  </Text>
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </View>

        {error ? <Text className="text-[13px] text-destructive">{error}</Text> : null}
        <PrimaryButton title="Next" onPress={next} />
      </ScrollView>
    </ScreenContainer>
  );
}
