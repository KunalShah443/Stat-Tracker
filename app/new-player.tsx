import HomeButton from '@/components/HomeButton';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { createProfile } from '@/src/db/database';
import { showAlert } from '@/src/utils/alerts';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View as RNView,
} from 'react-native';

export default function NewPlayerScreen() {
  const colorScheme = useColorScheme();
  const palette =
    colorScheme === 'dark'
      ? {
          background: '#0e0f13',
          text: '#f8f5ee',
          muted: '#b1a79a',
          accent: '#ef9c66',
          card: '#161821',
          border: '#2d2f3a',
          orb1: 'rgba(239, 156, 102, 0.2)',
          orb2: 'rgba(90, 200, 165, 0.18)',
        }
      : {
          background: '#f4efe6',
          text: '#1b1c1f',
          muted: '#6b645b',
          accent: '#c26b2b',
          card: '#fffaf0',
          border: '#e3d7c8',
          orb1: 'rgba(239, 156, 102, 0.25)',
          orb2: 'rgba(90, 200, 165, 0.2)',
        };

  const [playerName, setPlayerName] = useState('');
  const [position, setPosition] = useState('');
  const [draftRound, setDraftRound] = useState('');
  const [draftPick, setDraftPick] = useState('');
  const [teamName, setTeamName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmedName = playerName.trim();
    const trimmedPosition = position.trim();
    const trimmedTeam = teamName.trim();
    const roundValue = draftRound.trim();
    const pickValue = draftPick.trim();
    const round = Number(roundValue);
    const pick = Number(pickValue);

    if (!trimmedName) {
      showAlert('Missing name', 'Enter the player name.');
      return;
    }

    if (!trimmedPosition) {
      showAlert('Missing position', 'Enter the player position.');
      return;
    }

    if (!roundValue || !Number.isInteger(round) || round <= 0) {
      showAlert('Invalid draft round', 'Enter a valid round number.');
      return;
    }

    if (!pickValue || !Number.isInteger(pick) || pick <= 0) {
      showAlert('Invalid draft pick', 'Enter a valid pick number.');
      return;
    }

    if (!trimmedTeam) {
      showAlert('Missing team', 'Enter the drafted team.');
      return;
    }

    try {
      setIsSaving(true);
      await createProfile(
        'madden',
        trimmedPosition,
        trimmedName,
        round,
        pick,
        trimmedTeam
      );
      router.replace('/(tabs)/add-game');
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Could not create the player. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <RNView pointerEvents="none" style={[styles.orb, { backgroundColor: palette.orb1 }]} />
      <RNView
        pointerEvents="none"
        style={[styles.orb, styles.orbTwo, { backgroundColor: palette.orb2 }]}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <RNView style={styles.topRow}>
          <Text style={[styles.kicker, styles.kickerRow, { color: palette.accent }]}>
            NEW PLAYER
          </Text>
          <HomeButton color={palette.accent} />
        </RNView>
        <Text style={[styles.title, { color: palette.text }]}>
          Build the scouting card.
        </Text>
        <Text style={[styles.subtitle, { color: palette.muted }]}>
          Add the name, position, draft spot, and team to start tracking.
        </Text>

        <RNView style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.label, { color: palette.muted }]}>Player Name</Text>
          <TextInput
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Player name"
            placeholderTextColor={palette.muted}
            autoCapitalize="words"
            style={[styles.input, { color: palette.text, borderColor: palette.border }]}
          />

          <Text style={[styles.label, { color: palette.muted }]}>Position</Text>
          <TextInput
            value={position}
            onChangeText={setPosition}
            placeholder="QB, RB, WR..."
            placeholderTextColor={palette.muted}
            autoCapitalize="characters"
            style={[styles.input, { color: palette.text, borderColor: palette.border }]}
          />

          <RNView style={styles.row}>
            <RNView style={styles.column}>
              <Text style={[styles.label, { color: palette.muted }]}>Draft Round</Text>
              <TextInput
                value={draftRound}
                onChangeText={setDraftRound}
                placeholder="1"
                placeholderTextColor={palette.muted}
                keyboardType="numeric"
                style={[styles.input, { color: palette.text, borderColor: palette.border }]}
              />
            </RNView>
            <RNView style={styles.column}>
              <Text style={[styles.label, { color: palette.muted }]}>Draft Pick</Text>
              <TextInput
                value={draftPick}
                onChangeText={setDraftPick}
                placeholder="12"
                placeholderTextColor={palette.muted}
                keyboardType="numeric"
                style={[styles.input, { color: palette.text, borderColor: palette.border }]}
              />
            </RNView>
          </RNView>

          <Text style={[styles.label, { color: palette.muted }]}>Team</Text>
          <TextInput
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Drafted team"
            placeholderTextColor={palette.muted}
            autoCapitalize="words"
            style={[styles.input, { color: palette.text, borderColor: palette.border }]}
          />

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: palette.accent },
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Player</Text>
            )}
          </Pressable>
        </RNView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 48,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 2,
    fontFamily: 'SpaceMono',
    marginBottom: 12,
  },
  kickerRow: {
    marginBottom: 0,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: 'SpaceMono',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 12,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  primaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    letterSpacing: 0.6,
    fontFamily: 'SpaceMono',
  },
  buttonPressed: {
    transform: [{ translateY: 2 }],
    opacity: 0.9,
  },
  orb: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    top: -90,
    right: -80,
  },
  orbTwo: {
    width: 200,
    height: 200,
    borderRadius: 100,
    bottom: -60,
    left: -50,
  },
});
