import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { PrimaryButton, ScreenHeader, Stepper } from '@/src/components/design';
import { EvidencePhotos } from '@/src/components/EvidencePhotos';
import { useSession } from '@/src/store/session';
import { INCIDENT_CATEGORIES } from '@/src/constants/config';

/** Photo evidence right after category selection; optional, up to 3 compressed photos. */
export default function CameraScreen() {
  const router = useRouter();
  const { draft } = useSession();
  const category = INCIDENT_CATEGORIES.find((item) => item.id === draft.category);

  return (
    <ScreenContainer className="px-0">
      <View className="px-5">
        <ScreenHeader title="Report Incident" onBack={() => router.back()} />
        <Stepper steps={['Category', 'Photo', 'Details', 'Review']} current={1} />
      </View>
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-6">
        <View className="gap-1 rounded-2xl border border-border bg-card p-4">
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Reporting as
          </Text>
          <Text className="text-[15px] font-extrabold">{category?.label ?? 'Report'}</Text>
        </View>
        <EvidencePhotos />
        <Text className="text-center text-[12px] text-muted-foreground">
          Photos upload in the background while you continue.
        </Text>
        <PrimaryButton title="Continue" onPress={() => router.push('/report-details')} />
      </ScrollView>
    </ScreenContainer>
  );
}
