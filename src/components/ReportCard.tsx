import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Card, StatusBadge } from '@/src/components/Card';
import { INCIDENT_CATEGORIES } from '@/src/constants/config';
import type { CitizenReport } from '@/src/types';

export function ReportCard({ report }: { report: CitizenReport }) {
  const router = useRouter();
  const label = INCIDENT_CATEGORIES.find((c) => c.id === report.category)?.label ?? report.category;
  return (
    <Pressable onPress={() => router.push({ pathname: '/report-detail', params: { id: report.id } })}>
      <Card>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 font-semibold">{label}</Text>
          <StatusBadge status={report.status} />
        </View>
        <Text variant="muted" numberOfLines={2} className="mt-1">
          {report.description || 'No description'}
        </Text>
        <Text variant="muted" className="mt-2 text-xs">
          {new Date(report.createdAt).toLocaleString()} · {report.locationLabel}
        </Text>
      </Card>
    </Pressable>
  );
}
