import HomeButton from '@/components/HomeButton';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SeasonPicker } from '@/src/components/SeasonPicker';
import {
  getGameStats,
  getGamesBySeason,
  getOrCreateCurrentSeason,
  getOrCreateDefaultProfile,
  Profile,
  Season,
} from '@/src/db/database';
import { getPostseasonRoundLabel } from '@/src/types/stats';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';

interface GameWithStats {
  id: string;
  opponent: string;
  week: number | null;
  isPostseason: number;
  result: string | null;
  passYds: number;
  passTD: number;
}

export default function GameLogsScreen() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const router = useRouter();
  const [games, setGames] = useState<GameWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [filter, setFilter] = useState<'all' | 'regular' | 'postseason'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Load current season and games whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      const initialize = async () => {
        try {
          const p = await getOrCreateDefaultProfile();
          setProfile(p);
          const season = selectedSeason ?? (await getOrCreateCurrentSeason(p.id));
          if (!selectedSeason) {
            setSelectedSeason(season);
          }
          await loadGames(season.id);
        } catch (error) {
          console.error(error);
          setIsLoading(false);
        }
      };

      void initialize();
    }, [selectedSeason, filter, sortOrder])
  );

  const loadGames = async (seasonId: string) => {
    try {
      setIsLoading(true);

      // Get games for current season
      const allGames = await getGamesBySeason(seasonId);
      const filteredGames = allGames.filter((game) => {
        if (filter === 'regular') return game.is_postseason === 0;
        if (filter === 'postseason') return game.is_postseason === 1;
        return true;
      });
      const sortedGames = [...filteredGames].sort((a, b) => {
        const aTime = new Date(a.game_date).getTime();
        const bTime = new Date(b.game_date).getTime();
        return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
      });

      // Enrich with stats
      const gamesWithStats = await Promise.all(
        sortedGames.map(async (game) => {
          const stats = await getGameStats(game.id);
          const passYds =
            stats.find((s) => s.stat_key === 'pass_yds')?.stat_value || 0;
          const passTD =
            stats.find((s) => s.stat_key === 'pass_td')?.stat_value || 0;

          return {
            id: game.id,
            opponent: game.opponent,
            week: game.week,
            isPostseason: game.is_postseason,
            result: game.result,
            passYds,
            passTD,
          };
        })
      );

      setGames(gamesWithStats);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatWeekLabel = (game: GameWithStats) => {
    if (game.isPostseason === 1) {
      return getPostseasonRoundLabel(game.week) || 'Postseason';
    }
    if (game.week) {
      return `Week ${game.week}`;
    }
    return null;
  };

  const renderGameItem = ({ item }: { item: GameWithStats }) => {
    const weekLabel = formatWeekLabel(item);

    return (
      <Pressable
        style={styles.gameCard}
        onPress={() => router.push(`/game-log/${item.id}`)}
      >
        <View
          style={[
            styles.resultBadge,
            {
              backgroundColor:
                item.result === 'W'
                  ? '#4caf50'
                  : item.result === 'L'
                  ? '#f44336'
                  : '#ff9800',
            },
          ]}
        >
          <Text style={styles.resultText}>{item.result || '-'}</Text>
        </View>

        <View style={styles.gameInfo}>
          <Text style={styles.opponent}>{item.opponent}</Text>
          {weekLabel && <Text style={styles.dateText}>{weekLabel}</Text>}
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pass Yds</Text>
            <Text style={styles.statValue}>{item.passYds}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pass TD</Text>
            <Text style={styles.statValue}>{item.passTD}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Game Logs</Text>
            <Text style={styles.headerSubtitle}>{games.length} games</Text>
          </View>
          <HomeButton color={tintColor} />
        </View>
      </View>
      {profile && (
        <SeasonPicker
          profileId={profile.id}
          selectedSeasonId={selectedSeason?.id ?? null}
          onSeasonChange={setSelectedSeason}
        />
      )}
      <View style={styles.controls}>
        <View style={styles.filterGroup}>
          {(['all', 'regular', 'postseason'] as const).map((value) => (
            <Pressable
              key={value}
              style={[
                styles.filterButton,
                filter === value && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(value)}
            >
              <Text style={styles.filterText}>
                {value === 'all' ? 'All' : value === 'regular' ? 'Regular' : 'Postseason'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={styles.sortButton}
          onPress={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
        >
          <Text style={styles.sortText}>
            {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </Text>
        </Pressable>
      </View>
      <FlatList
        data={games}
        renderItem={renderGameItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          games.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No games logged</Text>
          </View>
        }
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
  },
  header: {
    paddingHorizontal: 15,
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    opacity: 0.6,
  },
  controls: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sortText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
    gap: 10,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  gameInfo: {
    flex: 1,
  },
  opponent: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    opacity: 0.6,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    opacity: 0.6,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
