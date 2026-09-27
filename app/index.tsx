// Session gate with branded ShaktiOS splash (screen 1).
import * as React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '@/src/store/session';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Progress } from '@/components/ui/progress';
import { ShaktiLogo } from '@/src/components/design';
import { Text } from '@/components/ui/text';

const MIN_SPLASH_MS = 1400;

function Splash() {
  const [value, setValue] = React.useState(5);
  React.useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const p = Math.min(100, 5 + ((Date.now() - start) / MIN_SPLASH_MS) * 95);
      setValue(p);
      if (p >= 100) clearInterval(t);
    }, 50);
    return () => clearInterval(t);
  }, []);
  return (
    <ScreenContainer className="items-center justify-center">
      <View className="flex-1 items-center justify-center gap-4">
        <ShaktiLogo size={96} />
        <Text className="text-[28px] font-extrabold tracking-tight text-primary">ShaktiOS</Text>
        <View className="items-center gap-1">
          <Text className="text-[13px] font-medium text-muted-foreground">Safer Communities</Text>
          <Text className="text-[13px] font-medium text-muted-foreground">Stronger Together</Text>
        </View>
      </View>
      <View className="w-full items-center gap-2 pb-10">
        <Text variant="muted" className="text-xs">
          Initializing…
        </Text>
        <Progress value={value} className="h-1.5 w-40 bg-border/60" indicatorClassName="bg-primary" />
      </View>
    </ScreenContainer>
  );
}

export default function Index() {
  const { initializing, user } = useSession();
  const [minElapsed, setMinElapsed] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  if (initializing || !minElapsed) {
    return <Splash />;
  }
  if (!user) {
    return <Redirect href="/login" />;
  }
  return <Redirect href="/(tabs)/home" />;
}
