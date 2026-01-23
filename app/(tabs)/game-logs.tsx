import FieldBackdrop from '@/components/FieldBackdrop';
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
  teamScore: number | null;
  opponentScore: number | null;
  hasNote: boolean;
  passYds: number;
  passTD: number;
}

export default function GameLogsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const tintColor = theme.tint;
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
            teamScore: game.team_score,
            opponentScore: game.opponent_score,
            hasNote: Boolean(game.note && game.note.trim()),
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

  const badgeTextColor = colorScheme === 'dark' ? '#0B1220' : '#fff';

  const renderGameItem = ({ item }: { item: GameWithStats }) => {
    const weekLabel = formatWeekLabel(item);
    const scoreLabel =
      item.teamScore === null && item.opponentScore === null
        ? null
        : `Score ${item.teamScore ?? '-'}-${item.opponentScore ?? '-'}`;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.gameCard,
          { backgroundColor: theme.surface, borderColor: theme.borderSoft },
          pressed && styles.gameCardPressed,
          pressed && { borderColor: theme.tint },
        ]}
        onPress={() => router.push(`/game-log/${item.id}`)}
      >
        <View
          style={[
            styles.resultBadge,
            {
              backgroundColor:
                item.result === 'W'
                  ? theme.success
                  : item.result === 'L'
                  ? theme.danger
                  : theme.warning,
            },
          ]}
        >
          <Text style={[styles.resultText, { color: badgeTextColor }]}>
            {item.result || '-'}
          </Text>
        </View>

        <View style={styles.gameInfo}>
          <Text style={styles.opponent}>{item.opponent}</Text>
          {weekLabel && (
            <Text style={[styles.dateText, { color: theme.muted }]}>{weekLabel}</Text>
          )}
          {scoreLabel && (
            <Text style={[styles.dateText, { color: theme.muted }]}>{scoreLabel}</Text>
          )}
          {!scoreLabel && item.hasNote && (
            <Text style={[styles.dateText, { color: theme.muted }]}>Note added</Text>
          )}
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Pass Yds</Text>
            <Text style={styles.statValue}>{item.passYds}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Pass TD</Text>
            <Text style={styles.statValue}>{item.passTD}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <FieldBackdrop variant="subtle" />
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FieldBackdrop variant="subtle" />
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.borderSoft }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Game Logs</Text>
            <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
              {games.length} games
            </Text>
          </View>
          <HomeButton color={tintColor} />
        </View>
        <View style={[styles.headerRule, { backgroundColor: theme.tintSoft }]} />
      </View>
      {profile && (
        <SeasonPicker
          profileId={profile.id}
          selectedSeasonId={selectedSeason?.id ?? null}
          onSeasonChange={setSelectedSeason}
        />
      )}
      <View style={[styles.controls, { backgroundColor: theme.surface, borderBottomColor: theme.borderSoft }]}>
        <View style={styles.filterGroup}>
          {(['all', 'regular', 'postseason'] as const).map((value) => (
            <Pressable
              key={value}
              style={[
                styles.filterButton,
                { borderColor: theme.borderSoft, backgroundColor: theme.surface2 },
                filter === value && {
                  backgroundColor: theme.tintSoft,
                  borderColor: theme.tint,
                },
              ]}
              onPress={() => setFilter(value)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === value ? theme.tint : theme.muted },
                ]}
              >
                {value === 'all' ? 'All' : value === 'regular' ? 'Regular' : 'Postseason'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={[styles.sortButton, { borderColor: theme.borderSoft, backgroundColor: theme.surface2 }]}
          onPress={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
        >
          <Text style={[styles.sortText, { color: theme.muted }]}>
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
            <Text style={[styles.emptyText, { color: theme.text }]}>No games logged</Text>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  controls: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
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
  },
  filterText: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.3,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  sortText: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.3,
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
    borderRadius: 14,
    borderWidth: 1,
  },
  gameCardPressed: {
    transform: [{ translateY: 1 }],
    opacity: 0.95,
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
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
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
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
  },
});
