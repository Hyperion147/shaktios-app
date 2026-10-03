import { Redirect, useLocalSearchParams } from 'expo-router';

/** Legacy route — the scanner now lives in the Scan tab. */
export default function ScanAlias() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  return <Redirect href={{ pathname: '/(tabs)/scan', params: typeof eventId === 'string' ? { eventId } : {} }} />;
}
