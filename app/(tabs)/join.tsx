import { Redirect } from 'expo-router';

/** Legacy route — event picking now lives in the Scan tab's "Select Event" tab. */
export default function JoinAlias() {
  return <Redirect href="/(tabs)/scan" />;
}
