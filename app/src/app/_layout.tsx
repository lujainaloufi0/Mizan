import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useMizan } from '@/store/mizan';
import { initFeel, setFeelSettings } from '@/ui/feel';
import { ToastHost } from '@/ui/overlays';
import { colors } from '@/ui/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'ThmanyahSans-Regular': require('../../assets/fonts/ThmanyahSans-Regular.otf'),
    'ThmanyahSans-Medium': require('../../assets/fonts/ThmanyahSans-Medium.otf'),
    'ThmanyahSans-Bold': require('../../assets/fonts/ThmanyahSans-Bold.otf'),
    'ThmanyahSerifText-Regular': require('../../assets/fonts/ThmanyahSerifText-Regular.otf'),
    'ThmanyahSerifDisplay-Bold': require('../../assets/fonts/ThmanyahSerifDisplay-Bold.otf'),
    'ThmanyahSerifDisplay-Black': require('../../assets/fonts/ThmanyahSerifDisplay-Black.otf'),
  });
  const [hydrated, setHydrated] = useState(() => useMizan.persist.hasHydrated());

  useEffect(() => {
    void initFeel();
    const unsub = useMizan.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  // keep sound/haptics in step with the profile toggles
  useEffect(
    () =>
      useMizan.subscribe((s) => {
        setFeelSettings({ sound: s.profile.sound, haptics: s.profile.haptics });
      }),
    [],
  );

  const ready = fontsLoaded && hydrated;
  useEffect(() => {
    if (ready) {
      const p = useMizan.getState().profile;
      setFeelSettings({ sound: p.sound, haptics: p.haptics });
      SplashScreen.hide();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <SafeAreaProvider>
        {/* Android lays out RTL natively (forcesRTL); the web preview needs the CSS direction */}
        <View style={[{ flex: 1, backgroundColor: colors.canvas }, Platform.OS === 'web' && ({ direction: 'rtl' } as object)]}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas }, animation: 'fade_from_bottom' }}>
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
            <Stack.Screen name="new-week" options={{ animation: 'fade_from_bottom', presentation: 'fullScreenModal' }} />
          </Stack>
          <ToastHost />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
