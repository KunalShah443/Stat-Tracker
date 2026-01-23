import FieldBackdrop from '@/components/FieldBackdrop';
import HomeButton from '@/components/HomeButton';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { createProfile } from '@/src/db/supabaseDatabase';
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
  const theme = Colors[colorScheme ?? 'light'];

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
    <View style={styles.container}>
      <FieldBackdrop variant="hero" />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <RNView style={styles.topRow}>
          <Text style={[styles.kicker, styles.kickerRow, { color: theme.tint }]}>
            NEW PLAYER
          </Text>
          <HomeButton color={theme.tint} />
        </RNView>
        <Text style={[styles.title, { color: theme.text }]}>Build the scouting card.</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Add the name, position, draft spot, and team to start tracking.
        </Text>

        <RNView
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <RNView style={[styles.cardStripe, { backgroundColor: theme.tint }]} />

          <Text style={[styles.label, { color: theme.muted }]}>Player Name</Text>
          <TextInput
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Player name"
            placeholderTextColor={theme.muted}
            autoCapitalize="words"
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.borderSoft,
                backgroundColor: theme.surface2,
              },
            ]}
          />

          <Text style={[styles.label, { color: theme.muted }]}>Position</Text>
          <TextInput
            value={position}
            onChangeText={setPosition}
            placeholder="QB, RB, WR..."
            placeholderTextColor={theme.muted}
            autoCapitalize="characters"
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.borderSoft,
                backgroundColor: theme.surface2,
              },
            ]}
          />

          <RNView style={styles.row}>
            <RNView style={styles.column}>
              <Text style={[styles.label, { color: theme.muted }]}>Draft Round</Text>
              <TextInput
                value={draftRound}
                onChangeText={setDraftRound}
                placeholder="1"
                placeholderTextColor={theme.muted}
                keyboardType="numeric"
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.borderSoft,
                    backgroundColor: theme.surface2,
                  },
                ]}
              />
            </RNView>
            <RNView style={styles.column}>
              <Text style={[styles.label, { color: theme.muted }]}>Draft Pick</Text>
              <TextInput
                value={draftPick}
                onChangeText={setDraftPick}
                placeholder="12"
                placeholderTextColor={theme.muted}
                keyboardType="numeric"
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.borderSoft,
                    backgroundColor: theme.surface2,
                  },
                ]}
              />
            </RNView>
          </RNView>

          <Text style={[styles.label, { color: theme.muted }]}>Team</Text>
          <TextInput
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Drafted team"
            placeholderTextColor={theme.muted}
            autoCapitalize="words"
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.borderSoft,
                backgroundColor: theme.surface2,
              },
            ]}
          />

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.tint },
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#0B1220" />
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
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 12,
    overflow: 'hidden',
  },
  cardStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 72,
    height: 3,
    borderBottomRightRadius: 12,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.6,
    fontFamily: 'SpaceMono',
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
    color: '#0B1220',
    fontSize: 14,
    letterSpacing: 0.6,
    fontFamily: 'SpaceMono',
  },
  buttonPressed: {
    transform: [{ translateY: 2 }],
    opacity: 0.9,
  },
});
