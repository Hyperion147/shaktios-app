import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { PrimaryButton } from './design';
import { INCIDENT_CATEGORIES } from '../constants/config';
import { MAX_REPORT_DESCRIPTION, missingVoiceFields } from '../utils/voice-draft';
import type { VenueEvent } from '../types';
import type { VoiceDraft, VoiceFields } from '../types/voice';
import { cn } from '@/lib/utils';

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress}
    className={cn('min-h-12 justify-center rounded-xl border px-3 py-3', selected ? 'border-primary bg-primary/10' : 'border-border bg-card')}>
    <Text className={cn('text-[13px] font-semibold', selected && 'text-primary')}>{label}</Text>
  </Pressable>;
}

/** Reviewable/editable suggestions, deliberately separate from final submission. */
export function VoiceDraftPreview({ draft, venue, onChange, onAccept, onDiscard }: {
  draft: VoiceDraft;
  venue: VenueEvent;
  onChange: (patch: Partial<VoiceFields>) => void;
  onAccept: () => void;
  onDiscard: () => void;
}) {
  const missing = missingVoiceFields(draft.fields, venue);
  return <View className="gap-4">
    <View className="gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <Text className="text-[17px] font-bold">Review your voice draft</Text>
      <Text className="text-[13px] leading-5 text-muted-foreground">Nothing has been submitted. Speech recognition and suggestions can be wrong—check every field below.</Text>
      <Text className="text-[12px] font-semibold">Event: {venue.name}</Text>
      <Text className="text-[12px] text-muted-foreground">GPS: not inferred from voice. You can attach your device position on the next step.</Text>
    </View>
    <View className="gap-2 rounded-2xl border border-border bg-card p-4">
      <Text className="text-[13px] font-bold">What Sarvam heard</Text>
      <Text className="text-[12px] text-muted-foreground">Detected language: {draft.language_code ?? 'Not identified'}</Text>
      <Text selectable className="text-[14px] leading-6">{draft.transcript}</Text>
    </View>
    {draft.warnings.length > 0 && <View accessibilityLiveRegion="polite" className="gap-2 rounded-2xl bg-[#FFF4D6] p-4">
      <Text className="text-[13px] font-bold">Please check</Text>
      {draft.warnings.map((warning, index) => <Text key={index} className="text-[12px] leading-5">• {warning}</Text>)}
    </View>}
    <View className="gap-2">
      <Text className="text-[14px] font-bold">Incident category</Text>
      {!draft.fields.category && <Text className="text-[12px] text-destructive">Select a category; no default was guessed.</Text>}
      <View className="flex-row flex-wrap gap-2">
        {INCIDENT_CATEGORIES.map((category) => <Choice key={category.id} label={category.label} selected={draft.fields.category === category.id} onPress={() => onChange({ category: category.id })} />)}
      </View>
    </View>
    <View className="gap-2">
      <Text className="text-[14px] font-bold">Report description</Text>
      <Textarea accessibilityLabel="Voice report description" value={draft.fields.description}
        onChangeText={(description) => onChange({ description })} maxLength={MAX_REPORT_DESCRIPTION}
        placeholder="Describe what you observed." className="min-h-28 rounded-2xl bg-card text-[14px]" />
      <Text className="text-right text-[11px] text-muted-foreground">{draft.fields.description.length}/{MAX_REPORT_DESCRIPTION}</Text>
    </View>
    <View className="gap-2">
      <Text className="text-[14px] font-bold">Venue zone</Text>
      {!draft.fields.zone_id && <Text className="text-[12px] text-destructive">Choose the registered zone where this happened.</Text>}
      {venue.zones.map((zone) => <Choice key={zone.id} label={zone.label} selected={draft.fields.zone_id === zone.id} onPress={() => onChange({ zone_id: zone.id })} />)}
    </View>
    <View className="gap-2">
      <Text className="text-[14px] font-bold">Urgency</Text>
      {!draft.fields.urgency && <Text className="text-[12px] text-destructive">Choose the urgency yourself.</Text>}
      <View className="flex-row gap-2">{(['low', 'medium', 'high'] as const).map((urgency) => <View key={urgency} className="flex-1">
        <Choice label={urgency.charAt(0).toUpperCase() + urgency.slice(1)} selected={draft.fields.urgency === urgency} onPress={() => onChange({ urgency })} />
      </View>)}</View>
    </View>
    {missing.length > 0 && <Text accessibilityLiveRegion="polite" className="text-[12px] text-destructive">Complete: {missing.join(', ')}.</Text>}
    <PrimaryButton title="Use these details & continue" onPress={onAccept} disabled={missing.length > 0} />
    <Text className="text-center text-[12px] text-muted-foreground">Next: optional GPS, then a final confirmation before submission.</Text>
    <PrimaryButton title="Discard voice draft" variant="outline" onPress={onDiscard} />
  </View>;
}
