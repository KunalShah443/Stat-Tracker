import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import type { Session } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { initDb } from '@/src/db/db';
import { getSupabase, isSupabaseConfigured } from '@/src/lib/supabase';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'home',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Initialize database on app startup
  useEffect(() => {
    initDb().catch((err) => {
      console.error('Failed to initialize database', err);
    });
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const useSupabase = useMemo(() => isSupabaseConfigured(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(useSupabase);

  useEffect(() => {
    if (!useSupabase) return;

    const supabase = getSupabase();

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
        }
        setSession(data.session ?? null);
        setIsAuthLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsAuthLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsAuthLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [useSupabase]);

  useEffect(() => {
    if (!useSupabase || isAuthLoading) return;

    // When Supabase is enabled, force users through /home (which contains the sign-in UI).
    const currentRoot = segments[0] ?? '';
    if (!session && currentRoot !== 'home') {
      router.replace('/home');
    }
  }, [isAuthLoading, router, segments, session, useSupabase]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="new-player" options={{ headerShown: false }} />
        <Stack.Screen name="continue-player" options={{ headerShown: false }} />
        <Stack.Screen name="game-log/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="edit-game/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
