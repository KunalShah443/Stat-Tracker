import HomeButton from '@/components/HomeButton';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import {
  deleteProfile,
  getAllProfiles,
  Profile,
  setActiveProfileId,
} from '@/src/db/database';
import { showConfirm } from '@/src/utils/alerts';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View as RNView,
} from 'react-native';

export default function ContinuePlayerScreen() {
  const colorScheme = useColorScheme();
  const palette =
    colorScheme === 'dark'
      ? {
          background: '#0f1116',
          text: '#f7f1e9',
          muted: '#b1a79a',
          accent: '#66c3a1',
          danger: '#ff6b6b',
          card: '#171a22',
          border: '#2b2f3a',
          orb1: 'rgba(102, 195, 161, 0.2)',
          orb2: 'rgba(88, 129, 250, 0.2)',
        }
      : {
          background: '#f3efe8',
          text: '#191a1d',
          muted: '#6b645b',
          accent: '#2a9d8f',
          danger: '#c44545',
          card: '#fffaf0',
          border: '#e4d8c9',
          orb1: 'rgba(102, 195, 161, 0.25)',
          orb2: 'rgba(88, 129, 250, 0.2)',
        };

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isContinuing, setIsContinuing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isBusy = isContinuing || isDeleting;

  const loadProfiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const loaded = await getAllProfiles();
      setProfiles(loaded);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfiles();
    }, [loadProfiles])
  );

  const handleContinue = async (profileId: string) => {
    try {
      setIsContinuing(true);
      await setActiveProfileId(profileId);
      router.replace('/(tabs)/game-logs');
    } catch (error) {
      console.error(error);
    } finally {
      setIsContinuing(false);
    }
  };

  const handleDelete = async (profileId: string) => {
    try {
      setIsDeleting(true);
      await deleteProfile(profileId);
      await loadProfiles();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (profile: Profile) => {
    showConfirm({
      title: 'Delete player',
      message: `Delete ${profile.player_name}? This removes seasons and games.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => void handleDelete(profile.id),
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <RNView style={styles.loading}>
          <ActivityIndicator size="large" />
        </RNView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <RNView pointerEvents="none" style={[styles.orb, { backgroundColor: palette.orb1 }]} />
      <RNView
        pointerEvents="none"
        style={[styles.orb, styles.orbTwo, { backgroundColor: palette.orb2 }]}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <RNView style={styles.topRow}>
          <Text style={[styles.kicker, styles.kickerRow, { color: palette.accent }]}>
            CONTINUE
          </Text>
          <HomeButton color={palette.accent} />
        </RNView>
        <Text style={[styles.title, { color: palette.text }]}>Choose a player.</Text>
        <Text style={[styles.subtitle, { color: palette.muted }]}>
          Pick up where you left off.
        </Text>

        {profiles.length === 0 ? (
          <RNView style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>
              No saved players
            </Text>
            <Text style={[styles.emptySubtitle, { color: palette.muted }]}>
              Create a new player to start tracking.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: palette.accent },
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push('/new-player')}
            >
              <Text style={styles.primaryButtonText}>Create New Player</Text>
            </Pressable>
          </RNView>
        ) : (
          <RNView style={styles.list}>
            {profiles.map((profile) => {
              const draftRound =
                typeof profile.draft_round === 'number'
                  ? `R${profile.draft_round}`
                  : 'R-';
              const draftPick =
                typeof profile.draft_pick === 'number'
                  ? `Pick ${profile.draft_pick}`
                  : 'Pick -';
              const teamLabel = profile.team_name ?? 'Team TBD';

              return (
                <RNView
                  key={profile.id}
                  style={[
                    styles.profileCard,
                    { backgroundColor: palette.card, borderColor: palette.border },
                  ]}
                >
                  <RNView style={styles.profileHeader}>
                    <Text style={[styles.profileName, { color: palette.text }]}>
                      {profile.player_name || 'Unnamed Player'}
                    </Text>
                    <Pressable
                      onPress={() => confirmDelete(profile)}
                      disabled={isBusy}
                    >
                      <Text style={[styles.deleteText, { color: palette.danger }]}>
                        Delete
                      </Text>
                    </Pressable>
                  </RNView>
                  <Text style={[styles.profileMeta, { color: palette.muted }]}>
                    {profile.position} - {teamLabel}
                  </Text>
                  <Text style={[styles.profileDraft, { color: palette.muted }]}>
                    Drafted {draftRound} - {draftPick}
                  </Text>
                  <RNView style={styles.cardActions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.cardPrimaryButton,
                        { backgroundColor: palette.accent },
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => handleContinue(profile.id)}
                      disabled={isBusy}
                    >
                      <Text style={styles.cardPrimaryText}>Continue</Text>
                    </Pressable>
                  </RNView>
                </RNView>
              );
            })}

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: palette.border },
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push('/new-player')}
              disabled={isBusy}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.text }]}>
                Create New Player
              </Text>
            </Pressable>
          </RNView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  list: {
    gap: 16,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'SpaceMono',
  },
  deleteText: {
    fontSize: 12,
    letterSpacing: 0.6,
    fontFamily: 'SpaceMono',
  },
  profileMeta: {
    fontSize: 13,
    marginBottom: 4,
  },
  profileDraft: {
    fontSize: 12,
  },
  cardActions: {
    marginTop: 12,
  },
  cardPrimaryButton: {
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  cardPrimaryText: {
    color: '#fff',
    fontSize: 13,
    letterSpacing: 0.6,
    fontFamily: 'SpaceMono',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 22,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'SpaceMono',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 8,
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
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    letterSpacing: 0.6,
    fontFamily: 'SpaceMono',
  },
  buttonPressed: {
    transform: [{ translateY: 2 }],
    opacity: 0.9,
  },
  orb: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -80,
    right: -70,
  },
  orbTwo: {
    width: 210,
    height: 210,
    borderRadius: 105,
    bottom: -60,
    left: -60,
  },
});
