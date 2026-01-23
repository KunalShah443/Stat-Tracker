import FieldBackdrop from '@/components/FieldBackdrop';
import HomeButton from '@/components/HomeButton';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { QBStatForm } from '@/src/components/QBStatForm';
import {
  Game,
  GameStat,
  getGame,
  getGameStats,
  setGameStat,
  updateGame,
} from '@/src/db/database';
import { showAlert } from '@/src/utils/alerts';
import { DEFAULT_GAME_FORM_DATA, GameFormData, QB_STATS, QBStatKey } from '@/src/types/stats';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View as RNView } from 'react-native';

type StatMap = Record<QBStatKey, number>;

const buildStatMap = (stats: GameStat[]): StatMap => {
  const initial = Object.keys(QB_STATS).reduce<StatMap>((acc, key) => {
    acc[key as QBStatKey] = 0;
    return acc;
  }, {} as StatMap);

  stats.forEach((stat) => {
    if (Object.prototype.hasOwnProperty.call(initial, stat.stat_key)) {
      initial[stat.stat_key as QBStatKey] = stat.stat_value;
    }
  });

  return initial;
};

const normalizeResult = (value: string | null): GameFormData['result'] => {
  if (value === 'W' || value === 'L' || value === 'T') return value;
  return undefined;
};

export default function EditGameScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const tintColor = theme.tint;

  const gameId = Array.isArray(id) ? id[0] : id;

  const [game, setGame] = useState<Game | null>(null);
  const [formData, setFormData] = useState<GameFormData>(DEFAULT_GAME_FORM_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!gameId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const loadedGame = await getGame(gameId);
        setGame(loadedGame);
        if (!loadedGame) return;

        const stats = await getGameStats(gameId);
        const statMap = buildStatMap(stats);

        setFormData({
          opponent: loadedGame.opponent,
          gameDate: loadedGame.game_date,
          week: loadedGame.week ?? undefined,
          isPostseason: loadedGame.is_postseason === 1,
          result: normalizeResult(loadedGame.result),
          stats: statMap,
        });
      } catch (error) {
        console.error(error);
        showAlert('Error', 'Failed to load the game for editing.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [gameId]);

  const handleSave = async () => {
    if (!gameId) return;
    if (!formData.opponent.trim()) {
      showAlert('Missing opponent', 'Enter an opponent name.');
      return;
    }

    try {
      setIsSaving(true);

      await updateGame(gameId, {
        opponent: formData.opponent.trim(),
        game_date: formData.gameDate,
        week: formData.week ?? null,
        is_postseason: formData.isPostseason ? 1 : 0,
        result: formData.result ?? null,
      });

      for (const [key, value] of Object.entries(formData.stats)) {
        await setGameStat(gameId, key, value);
      }

      showAlert('Saved', 'Game updated.');
      router.back();
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to save changes. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <FieldBackdrop variant="subtle" />
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.centerContainer}>
        <FieldBackdrop variant="subtle" />
        <Text style={[styles.emptyText, { color: theme.text }]}>Game not found</Text>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            { borderColor: tintColor, backgroundColor: theme.surface2 },
            pressed && styles.backButtonPressed,
          ]}
          onPress={() => router.replace('/(tabs)/game-logs')}
        >
          <Text style={[styles.backText, { color: tintColor }]}>Back to Logs</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FieldBackdrop variant="subtle" />

      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.borderSoft },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Game</Text>
            <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
              {game.game_date} - {game.opponent}
            </Text>
          </View>

          <RNView style={styles.headerActions}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.headerButton,
                { backgroundColor: theme.surface2, borderColor: theme.borderSoft },
                pressed && styles.headerButtonPressed,
              ]}
            >
              <Text style={[styles.headerButtonText, { color: theme.text }]}>Cancel</Text>
            </Pressable>
            <HomeButton color={tintColor} />
          </RNView>
        </View>
        <View style={[styles.headerRule, { backgroundColor: theme.tintSoft }]} />
      </View>

      <QBStatForm
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSave}
        isLoading={isSaving}
        submitLabel="Save Changes"
        submittingLabel="Saving..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerText: {
    flex: 1,
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  headerRule: {
    height: 2,
    width: 56,
    borderRadius: 2,
    marginTop: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  headerButtonPressed: {
    transform: [{ translateY: 1 }],
    opacity: 0.9,
  },
  headerButtonText: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  backButtonPressed: {
    transform: [{ translateY: 1 }],
    opacity: 0.9,
  },
  backText: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
  },
});
