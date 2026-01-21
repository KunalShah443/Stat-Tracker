import HomeButton from '@/components/HomeButton';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Game, GameStat, getGame, getGameStats } from '@/src/db/database';
import {
  getPostseasonRoundLabel,
  QB_STATS,
  QBStatKey,
} from '@/src/types/stats';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

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
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  const [game, setGame] = useState<Game | null>(null);
  const [statMap, setStatMap] = useState<StatMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const gameId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    const load = async () => {
      if (!gameId) {
        setIsLoading(false);
        return;
      }

      try {
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
  }, [gameId]);

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

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!game || !statMap) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Game not found</Text>
        <Pressable
          style={[styles.backButton, { borderColor: tintColor }]}
          onPress={() => router.replace('/(tabs)/game-logs')}
        >
          <Text style={[styles.backText, { color: tintColor }]}>Back to Logs</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Game Details</Text>
            {weekLabel && <Text style={styles.headerSubtitle}>{weekLabel}</Text>}
          </View>
          <HomeButton color={tintColor} />
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{game.opponent}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Result</Text>
          <Text style={styles.summaryValue}>{game.result || '-'}</Text>
        </View>
        {weekLabel && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Week</Text>
            <Text style={styles.summaryValue}>{weekLabel}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Player Stats</Text>
        {Object.entries(QB_STATS).map(([key, config]) => (
          <View key={key} style={styles.statRow}>
            <Text style={styles.statLabel}>{config.label}</Text>
            <Text style={styles.statValue}>
              {statMap[key as QBStatKey] ?? 0}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        style={[styles.backButton, { borderColor: tintColor }]}
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
    borderBottomColor: '#e0e0e0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 4,
  },
  summaryCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    opacity: 0.6,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
