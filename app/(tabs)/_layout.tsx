import { Pressable, View, type ColorValue, type GestureResponderEvent } from 'react-native';
import { Tabs } from 'expo-router';
import { CircleUserRound, FileText, House, ScanLine } from 'lucide-react-native';
import { THEME } from '@/lib/theme';
import { Text } from '@/components/ui/text';

function CenterScanButton({ onPress }: { onPress?: (e: GestureResponderEvent) => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Scan event QR"
      className="items-center justify-center"
      style={{ top: -14 }}>
      <View
        style={{ backgroundColor: THEME.light.primary }}
        className="h-14 w-14 items-center justify-center rounded-full shadow-lg">
        <ScanLine color="#fff" size={24} />
      </View>
      <Text className="mt-0.5 text-[10px] font-semibold text-muted-foreground">Scan</Text>
    </Pressable>
  );
}

function TabLabel({ title, color }: { title: string; color: ColorValue }) {
  return (
    <Text style={{ color: color as string }} className="text-[10px] font-semibold">
      {title}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME.light.primary,
        tabBarInactiveTintColor: THEME.light.mutedForeground,
        tabBarStyle: {
          backgroundColor: THEME.light.card,
          borderTopColor: THEME.light.border,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
          tabBarLabel: ({ color }) => <TabLabel title="Home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
          tabBarLabel: ({ color }) => <TabLabel title="Reports" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: () => null,
          tabBarLabel: () => null,
          tabBarButton: (props) => <CenterScanButton onPress={props.onPress} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <CircleUserRound color={color} size={size} />,
          tabBarLabel: ({ color }) => <TabLabel title="Profile" color={color} />,
        }}
      />
      {/* Reachable via push, hidden from the tab bar. */}
      <Tabs.Screen name="join" options={{ href: null }} />
    </Tabs>
  );
}
