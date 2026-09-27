import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import {
  CategoryIcon,
  PrimaryButton,
  ScreenHeader,
  Stepper,
} from '@/src/components/design';
import { PhotoPicker } from '@/src/components/PhotoPicker';
import { useSession } from '@/src/store/session';
import { INCIDENT_CATEGORIES, LOCATION_PRESETS } from '@/src/constants/config';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';

const MAX_LEN = 500;
const URGENCY = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
] as const;

/** Screen 7 — Report Incident step 2: details + urgency. */
export default function ReportDetailsScreen() {
  const router = useRouter();
  const { draft, setDraft } = useSession();
  const [error, setError] = React.useState<string | null>(null);

  const category = INCIDENT_CATEGORIES.find((c) => c.id === draft.category);

  const next = () => {
    if (!draft.description.trim() && draft.category === 'other') {
      setError('Please describe what you observed.');
      return;
    }
    if (!draft.locationLabel.trim()) {
      setError('Tell us the area (e.g. Gate 3) so the safety team can find it.');
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
            <Text className="flex-1 text-[14px] font-semibold">
              {category?.label ?? 'Select'}
            </Text>
            <ChevronDown size={18} color={THEME.light.mutedForeground} />
          </Pressable>
        </View>

        <View className="gap-1.5">
          <Label>Description (optional)</Label>
          <Textarea
            maxLength={MAX_LEN}
            placeholder="Smoke near Gate 3, looks like it might be coming from the food court area."
            placeholderTextColor={THEME.light.mutedForeground}
            value={draft.description}
            onChangeText={(t) => setDraft({ description: t })}
            className="min-h-[110px] rounded-2xl border-border bg-card text-[14px]"
          />
          <Text className="text-right text-[11px] text-muted-foreground">
            {draft.description.length}/{MAX_LEN}
          </Text>
        </View>

        <View className="gap-1.5">
          <Label>Area / gate</Label>
          <View className="flex-row flex-wrap gap-2">
            {LOCATION_PRESETS.map((preset) => {
              const selected = draft.locationLabel.trim().toLowerCase() === preset.toLowerCase();
              return (
                <Pressable
                  key={preset}
                  onPress={() => setDraft({ locationLabel: preset })}
                  className={cn(
                    'rounded-full border px-4 py-2',
                    selected ? 'border-primary bg-primary/5' : 'border-border bg-card',
                  )}>
                  <Text className={cn('text-[13px] font-medium', selected && 'font-bold')}>
                    {preset}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Input
            placeholder="e.g. Gate 3"
            placeholderTextColor={THEME.light.mutedForeground}
            autoCapitalize="none"
            value={draft.locationLabel}
            onChangeText={(t) => setDraft({ locationLabel: t })}
            className="h-14 rounded-2xl bg-card text-[15px]"
          />
        </View>

        <View className="gap-1.5">
          <Label>Urgency Level</Label>
          <ToggleGroup
            type="single"
            value={draft.urgency}
            onValueChange={(v) => {
              if (v) setDraft({ urgency: v as 'low' | 'medium' | 'high' });
            }}
            className="gap-2">
            {URGENCY.map((u) => {
              const selected = draft.urgency === u.id;
              return (
                <ToggleGroupItem
                  key={u.id}
                  value={u.id}
                  className={cn(
                    'h-12 flex-1 rounded-2xl border',
                    selected ? 'border-primary bg-primary' : 'border-border bg-card',
                  )}>
                  <Text
                    className={cn(
                      'text-[13px] font-bold',
                      selected ? 'text-primary-foreground' : 'text-muted-foreground',
                    )}>
                    {u.label}
                  </Text>
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </View>

        {error ? <Text className="text-[13px] text-destructive">{error}</Text> : null}

        <PhotoPicker photoUri={draft.photoUri} onChange={(uri) => setDraft({ photoUri: uri })} />

        <PrimaryButton title="Next" onPress={next} />
      </ScrollView>
    </ScreenContainer>
  );
}
