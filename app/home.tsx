import FieldBackdrop from '@/components/FieldBackdrop';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getSupabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { showAlert } from '@/src/utils/alerts';
import { router } from 'expo-router';
import type { Session } from '@supabase/supabase-js';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View as RNView } from 'react-native';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const useSupabase = useMemo(() => isSupabaseConfigured(), []);

  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(useSupabase);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

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

  const handleSignIn = async () => {
    if (!useSupabase) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      showAlert('Missing info', 'Enter email and password.');
      return;
    }

    try {
      setIsSigningIn(true);
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (error) {
        showAlert('Sign in failed', error.message);
      }
    } catch (error) {
      console.error(error);
      showAlert('Sign in failed', 'Try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (!useSupabase) return;
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to sign out.');
    }
  };

  return (
    <View style={styles.container}>
      <FieldBackdrop variant="hero" />

      <View style={styles.content}>
        <Text style={[styles.kicker, { color: theme.accent2 }]}>STAT TRACKER</Text>
        <Text style={[styles.title, { color: theme.text }]}>Ready for kickoff.</Text>
        <RNView style={[styles.titleRule, { backgroundColor: theme.tintSoft }]} />
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Start fresh or keep the streak alive.
        </Text>

        {useSupabase && isAuthLoading ? (
          <RNView style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.tint} />
          </RNView>
        ) : useSupabase && !session ? (
          <RNView style={styles.cardStack}>
            <RNView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <RNView style={[styles.cardStripe, { backgroundColor: theme.tint }]} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Sign In</Text>
              <Text style={[styles.cardBody, { color: theme.muted }]}>
                Log in to load and save your game logs in the cloud.
              </Text>

              <Text style={[styles.inputLabel, { color: theme.muted }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface2,
                    color: theme.text,
                    borderColor: theme.borderSoft,
                  },
                ]}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@email.com"
                placeholderTextColor={theme.muted}
                value={email}
                onChangeText={setEmail}
              />

              <Text style={[styles.inputLabel, { color: theme.muted }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface2,
                    color: theme.text,
                    borderColor: theme.borderSoft,
                  },
                ]}
                placeholder="••••••••"
                placeholderTextColor={theme.muted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: theme.tint, opacity: isSigningIn ? 0.7 : 1 },
                  pressed && styles.cardPressed,
                ]}
                disabled={isSigningIn}
                onPress={() => void handleSignIn()}
              >
                <Text style={styles.primaryButtonText}>
                  {isSigningIn ? 'Signing in...' : 'Sign In'}
                </Text>
              </Pressable>
            </RNView>
          </RNView>
        ) : (
          <RNView style={styles.cardStack}>
          <Pressable
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.cardPressed,
              pressed && { borderColor: theme.accent2 },
            ]}
            onPress={() => router.push('/new-player')}
          >
            <RNView style={[styles.cardStripe, { backgroundColor: theme.accent2 }]} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>New Player</Text>
            <Text style={[styles.cardBody, { color: theme.muted }]}>
              Create your first season and log game one.
            </Text>
            <RNView style={[styles.cardTag, { backgroundColor: theme.accent2 }]}>
            <Text style={styles.cardTagText}>ROOKIE</Text>
            </RNView>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.cardPressed,
              pressed && { borderColor: theme.tint },
            ]}
            onPress={() => router.push('/continue-player')}
          >
            <RNView style={[styles.cardStripe, { backgroundColor: theme.tint }]} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Continuing Player
            </Text>
            <Text style={[styles.cardBody, { color: theme.muted }]}>
              Jump into your latest season and keep building.
            </Text>
            <RNView style={[styles.cardTag, { backgroundColor: theme.tint }]}>
              <Text style={styles.cardTagText}>CONTINUE</Text>
            </RNView>
          </Pressable>

          {useSupabase ? (
            <Pressable
              style={({ pressed }) => [
                styles.signOutButton,
                { borderColor: theme.borderSoft },
                pressed && styles.cardPressed,
              ]}
              onPress={() => void handleSignOut()}
            >
              <Text style={[styles.signOutText, { color: theme.muted }]}>Sign out</Text>
            </Pressable>
          ) : null}
        </RNView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 2,
    fontFamily: 'SpaceMono',
    marginBottom: 12,
  },
  title: {
    fontSize: 36,
    lineHeight: 40,
    fontFamily: 'SpaceMono',
    marginBottom: 10,
  },
  titleRule: {
    height: 2,
    width: 72,
    borderRadius: 2,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  cardStack: {
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    overflow: 'hidden',
  },
  cardPressed: {
    transform: [{ translateY: 2 }],
    opacity: 0.9,
  },
  cardStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 64,
    height: 3,
    borderBottomRightRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'SpaceMono',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  cardTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cardTagText: {
    color: '#0B1220',
    fontSize: 11,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.6,
  },
  loadingWrap: {
    paddingTop: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 6,
  },
  primaryButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0B1220',
    fontSize: 14,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.6,
  },
  signOutButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
