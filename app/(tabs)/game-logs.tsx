import { Text, View } from '@/components/Themed';
import { SeasonPicker } from '@/src/components/SeasonPicker';
import {
  getGameStats,
  getGamesBySeason,
  getOrCreateCurrentSeason,
  getOrCreateDefaultProfile,
  Profile,
  Season,
} from '@/src/db/database';
import { useFocusEffect } from '@react-navigation/native';
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
  gameDate: string;
  week: number | null;
  isPostseason: number;
  result: string | null;
  passYds: number;
  passTD: number;
}

export default function GameLogsScreen() {
  const [games, setGames] = useState<GameWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [filter, setFilter] = useState<'all' | 'regular' | 'postseason'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Load current season and games whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      const p = getOrCreateDefaultProfile();
      setProfile(p);
      const season = selectedSeason ?? getOrCreateCurrentSeason(p.id);
      if (!selectedSeason) {
        setSelectedSeason(season);
      }
      loadGames(season.id);
    }, [selectedSeason, filter, sortOrder])
  );

  const loadGames = (seasonId: string) => {
    try {
      setIsLoading(true);

      // Get games for current season
      const allGames = getGamesBySeason(seasonId);
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
      const gamesWithStats = sortedGames.map((game) => {
        const stats = getGameStats(game.id);
        const passYds = stats.find((s) => s.stat_key === 'pass_yds')?.stat_value || 0;
        const passTD = stats.find((s) => s.stat_key === 'pass_td')?.stat_value || 0;

        return {
          id: game.id,
          opponent: game.opponent,
          gameDate: game.game_date,
          week: game.week,
          isPostseason: game.is_postseason,
          result: game.result,
          passYds,
          passTD,
        };
      });

      setGames(gamesWithStats);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderGameItem = ({ item }: { item: GameWithStats }) => (
    <Pressable style={styles.gameCard}>
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
        ]}>
        <Text style={styles.resultText}>{item.result || '—'}</Text>
      </View>

      <View style={styles.gameInfo}>
        <Text style={styles.opponent}>{item.opponent}</Text>
        <Text style={styles.dateText}>
          {formatDate(item.gameDate)}
          {item.week && ` • Week ${item.week}`}
          {item.isPostseason === 1 && ' • Postseason'}
        </Text>
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

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (games.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No games recorded yet</Text>
        <Text style={styles.emptySubtext}>Add a game to get started!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Game Logs</Text>
        <Text style={styles.headerSubtitle}>{games.length} games</Text>
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
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
  },
});
