import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View as RNView } from 'react-native';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const palette =
    colorScheme === 'dark'
      ? {
          background: '#11110f',
          text: '#f3efe6',
          muted: '#a7a197',
          kicker: '#f4c95d',
          card: '#1a1814',
          cardBorder: '#2d2a24',
          tagNew: '#ff7a45',
          tagContinue: '#2a9d8f',
          orb1: 'rgba(255, 183, 3, 0.25)',
          orb2: 'rgba(33, 158, 188, 0.2)',
        }
      : {
          background: '#f5f1e8',
          text: '#1b1b1b',
          muted: '#5f5a51',
          kicker: '#9a6b2f',
          card: '#fffaf0',
          cardBorder: '#e0d6c6',
          tagNew: '#ff7a45',
          tagContinue: '#2a9d8f',
          orb1: 'rgba(244, 201, 93, 0.35)',
          orb2: 'rgba(78, 205, 196, 0.25)',
        };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <RNView pointerEvents="none" style={[styles.orb, { backgroundColor: palette.orb1 }]} />
      <RNView
        pointerEvents="none"
        style={[styles.orb, styles.orbTwo, { backgroundColor: palette.orb2 }]}
      />

      <View style={styles.content}>
        <Text style={[styles.kicker, { color: palette.kicker }]}>STAT TRACKER</Text>
        <Text style={[styles.title, { color: palette.text }]}>Welcome back.</Text>
        <Text style={[styles.subtitle, { color: palette.muted }]}>
          Start fresh or keep the streak alive.
        </Text>

        <RNView style={styles.cardStack}>
          <Pressable
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: palette.card, borderColor: palette.cardBorder },
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push('/new-player')}
          >
            <Text style={[styles.cardTitle, { color: palette.text }]}>New Player</Text>
            <Text style={[styles.cardBody, { color: palette.muted }]}>
              Create your first season and log game one.
            </Text>
            <RNView style={[styles.cardTag, { backgroundColor: palette.tagNew }]}>
              <Text style={styles.cardTagText}>Fresh start</Text>
            </RNView>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: palette.card, borderColor: palette.cardBorder },
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push('/continue-player')}
          >
            <Text style={[styles.cardTitle, { color: palette.text }]}>
              Continuing Player
            </Text>
            <Text style={[styles.cardBody, { color: palette.muted }]}>
              Jump into your latest season and keep building.
            </Text>
            <RNView style={[styles.cardTag, { backgroundColor: palette.tagContinue }]}>
              <Text style={styles.cardTagText}>Pick up</Text>
            </RNView>
          </Pressable>
        </RNView>
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
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  cardPressed: {
    transform: [{ translateY: 2 }],
    opacity: 0.9,
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
    color: '#fff',
    fontSize: 11,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.6,
  },
  orb: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -80,
    right: -70,
  },
  orbTwo: {
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: -60,
    left: -60,
  },
});
