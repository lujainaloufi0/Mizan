import { Redirect } from 'expo-router';
import { useMizan } from '@/store/mizan';

/** First launch → one-time profile; no plan yet → weekly setup; otherwise Home. */
export default function Entry() {
  const setupDone = useMizan((s) => s.profile.setupDone);
  const hasWeek = useMizan((s) => !!s.week);
  if (!setupDone) return <Redirect href="/welcome" />;
  if (!hasWeek) return <Redirect href="/new-week" />;
  return <Redirect href="/(tabs)" />;
}
