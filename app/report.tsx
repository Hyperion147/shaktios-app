import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { CategoryTile, PrimaryButton, ScreenHeader, Stepper } from '@/src/components/design';
import { useSession } from '@/src/store/session';
import { INCIDENT_CATEGORIES } from '@/src/constants/config';

/** Screen 6 — Report Incident step 1: select category. */
export default function ReportCategoryScreen() {
  const router = useRouter();
  const { draft, setDraft, activeEvent } = useSession();

  const rows: (typeof INCIDENT_CATEGORIES)[] = [];
  for (let i = 0; i < INCIDENT_CATEGORIES.length; i += 2) {
    rows.push(INCIDENT_CATEGORIES.slice(i, i + 2));
  }

  return (
    <ScreenContainer className="px-0">
      <View className="px-5">
        <ScreenHeader title="Report Incident" onBack={() => router.back()} />
        <Stepper steps={['Category', 'Details', 'Location', 'Review']} current={0} />
      </View>
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-3 pb-6">
        <Text className="text-[15px] font-bold">Select Incident Category</Text>
        {activeEvent ? null : (
          <View className="rounded-2xl bg-[#FFF4D6] p-3">
            <Text className="text-[12px] font-semibold">
              No event joined — the report will be filed without an event. Join one from Scan for
              faster routing.
            </Text>
          </View>
        )}
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
          <PrimaryButton title="Next" onPress={() => router.push('/report-details')} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
