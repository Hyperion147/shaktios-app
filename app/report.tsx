import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, ChevronRight } from 'lucide-react-native';
import { THEME } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { CategoryTile, PrimaryButton, ScreenHeader, Stepper } from '@/src/components/design';
import { useSession } from '@/src/store/session';
import { VenueState } from '@/src/components/VenueState';
import { INCIDENT_CATEGORIES } from '@/src/constants/config';

/** Select the incident category before collecting report details. */
export default function ReportCategoryScreen() {
  const router = useRouter();
  const { draft, setDraft, activeEvent } = useSession();

  const rows: (typeof INCIDENT_CATEGORIES)[] = [];
  for (let i = 0; i < INCIDENT_CATEGORIES.length; i += 2) {
    rows.push(INCIDENT_CATEGORIES.slice(i, i + 2));
  }

  const canContinue = Boolean(
    activeEvent && activeEvent.status !== 'ended' && activeEvent.zones.length > 0
  );

  return (
    <ScreenContainer className="px-0">
      <View className="px-5">
        <ScreenHeader title="Report Incident" onBack={() => router.back()} />
        <Stepper steps={['Category', 'Details', 'Location', 'Review']} current={0} />
      </View>
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-3 pb-6">
        <VenueState />
        <Pressable accessibilityRole="button" accessibilityLabel="Describe incident by voice"
          accessibilityState={{ disabled: !canContinue }} disabled={!canContinue}
          onPress={() => router.push('/voice-report')}
          className="flex-row items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <Mic size={24} color={THEME.light.primary} />
          <View className="flex-1 gap-1"><Text className="text-[15px] font-bold text-primary">Describe by voice</Text>
            <Text className="text-[12px] leading-5 text-muted-foreground">Optional: speak in a supported Indian language or English, then review and edit the filled form.</Text></View>
          <ChevronRight size={18} color={THEME.light.primary} />
        </Pressable>
        <Text className="text-[15px] font-bold">Or select a category manually</Text>
        {!activeEvent ? (
          <View className="gap-2 rounded-2xl bg-[#FFF4D6] p-3">
            <Text className="text-[12px] font-semibold">
              Join a venue event before reporting so the backend can route this report to a
              canonical zone.
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/scan')}>
              <Text className="text-[12px] font-bold text-primary">Join an event</Text>
            </Pressable>
          </View>
        ) : activeEvent.status === 'ended' ? (
          <View className="gap-2 rounded-2xl bg-[#FFF4D6] p-3">
            <Text className="text-[12px] font-semibold">
              This event has ended. Join an active or upcoming event to report.
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/scan')}>
              <Text className="text-[12px] font-bold text-primary">Choose another event</Text>
            </Pressable>
          </View>
        ) : activeEvent.zones.length === 0 ? (
          <View className="rounded-2xl bg-[#FFF4D6] p-3">
            <Text className="text-[12px] font-semibold">
              This event has no reportable zones yet. Try another event.
            </Text>
          </View>
        ) : null}
        {rows.map((row, ri) => (
          <View key={ri} className="flex-row gap-3">
            {row.map((cat) => (
              <CategoryTile
                key={cat.id}
                id={cat.id}
                label={cat.label}
                selected={draft.category === cat.id}
                onPress={() => setDraft({ category: cat.id })}
              />
            ))}
            {row.length === 1 ? <View className="flex-1" /> : null}
          </View>
        ))}
        <View className="mt-2">
          <PrimaryButton
            title="Next"
            onPress={() => router.push('/report-details')}
            disabled={!canContinue}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
