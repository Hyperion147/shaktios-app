import { Redirect } from 'expo-router';

/** Legacy route — the scanner now lives in the Scan tab. */
export default function ScanAlias() {
  return <Redirect href="/(tabs)/scan" />;
}
