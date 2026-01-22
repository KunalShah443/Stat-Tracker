import FieldBackdrop from '@/components/FieldBackdrop';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View as RNView } from 'react-native';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

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
});
