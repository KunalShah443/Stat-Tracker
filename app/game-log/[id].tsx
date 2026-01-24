import FieldBackdrop from '@/components/FieldBackdrop';
import HomeButton from '@/components/HomeButton';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Game, GameStat, getGame, getGameStats } from '@/src/db/supabaseDatabase';
import {
  getPostseasonRoundLabel,
  QB_STATS,
  QBStatKey,
} from '@/src/types/stats';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
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

export default function GameLogDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const tintColor = theme.tint;

  const [game, setGame] = useState<Game | null>(null);
  const [statMap, setStatMap] = useState<StatMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const gameId = Array.isArray(id) ? id[0] : id;

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        if (!gameId) {
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);
          const loadedGame = await getGame(gameId);
          const stats = await getGameStats(gameId);
          setGame(loadedGame);
          setStatMap(buildStatMap(stats));
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };

      void load();
    }, [gameId])
  );

  const weekLabel = useMemo(() => {
    if (!game) return null;
    if (game.is_postseason === 1) {
      return getPostseasonRoundLabel(game.week) || 'Postseason';
    }
    if (game.week) {
      return `Week ${game.week}`;
    }
    return null;
  }, [game]);

  const scoreLabel = useMemo(() => {
    if (!game) return null;
    if (game.team_score === null && game.opponent_score === null) return null;
    const team = game.team_score ?? '-';
    const opp = game.opponent_score ?? '-';
    return `${team}-${opp}`;
  }, [game]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <FieldBackdrop variant="subtle" />
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  if (!game || !statMap) {
    return (
      <View style={styles.centerContainer}>
        <FieldBackdrop variant="subtle" />
        <Text style={[styles.emptyText, { color: theme.text }]}>Game not found</Text>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            {
              borderColor: tintColor,
              backgroundColor: theme.surface2,
            },
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
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.borderSoft }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Game Details</Text>
            {weekLabel && (
              <Text style={[styles.headerSubtitle, { color: theme.muted }]}>{weekLabel}</Text>
            )}
          </View>
          <RNView style={styles.headerActions}>
            <Pressable
              onPress={() => router.push((`/edit-game/${game.id}` as any))}
              style={({ pressed }) => [
                styles.editButton,
                { backgroundColor: theme.surface2, borderColor: theme.accent2 },
                pressed && styles.editButtonPressed,
              ]}
            >
              <Text style={[styles.editButtonText, { color: theme.accent2 }]}>Edit</Text>
            </Pressable>
            <HomeButton color={tintColor} />
          </RNView>
        </View>
        <View style={[styles.headerRule, { backgroundColor: theme.tintSoft }]} />
      </View>

      <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
        <RNView style={[styles.cardStripe, { backgroundColor: theme.accent2 }]} />
        <Text style={[styles.summaryTitle, { color: theme.text }]}>{game.opponent}</Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>Result</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>{game.result || '-'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>Venue</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {game.is_home === 1 ? 'Home' : 'Away'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>Starter</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {(game.is_starter ?? 1) === 1 ? 'Yes' : 'No'}
          </Text>
        </View>
        {scoreLabel && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.muted }]}>Score</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{scoreLabel}</Text>
          </View>
        )}
        {weekLabel && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.muted }]}>Week</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{weekLabel}</Text>
          </View>
        )}
      </View>

      {game.note ? (
        <View style={[styles.noteCard, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
          <RNView style={[styles.cardStripe, { backgroundColor: theme.tint }]} />
          <Text style={[styles.noteTitle, { color: theme.text }]}>Notes</Text>
          <Text style={[styles.noteText, { color: theme.text }]}>{game.note}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Player Stats</Text>
        {Object.entries(QB_STATS).map(([key, config]) => (
          <View key={key} style={[styles.statRow, { borderBottomColor: theme.borderSoft }]}>
            <Text style={[styles.statLabel, { color: theme.muted }]}>{config.label}</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {statMap[key as QBStatKey] ?? 0}
            </Text>
          </View>
        ))}
      </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  header: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  headerRule: {
    height: 2,
    width: 56,
    borderRadius: 2,
    marginTop: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  editButtonPressed: {
    transform: [{ translateY: 1 }],
    opacity: 0.9,
  },
  editButtonText: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  summaryCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  noteCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
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
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
  },
  noteTitle: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
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
