import { Text, View } from '@/components/Themed';
import {
  getGamesBySeason,
  getOrCreateDefaultProfile,
  getSeasonsByProfile,
} from '@/src/db/database';
import { getCareerStats } from '@/src/db/queries';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    View as RNView,
    ScrollView,
    StyleSheet,
} from 'react-native';

interface StatDisplayProps {
  label: string;
  total: number;
  average: number;
  games: number;
}

const StatDisplay: React.FC<StatDisplayProps> = ({
  label,
  total,
  average,
  games,
}) => (
  <RNView style={styles.statBox}>
    <Text style={styles.statBoxLabel}>{label}</Text>
    <Text style={styles.statBoxValue}>{total.toFixed(1)}</Text>
    <Text style={styles.statBoxAverage}>
      {average.toFixed(1)}/game
    </Text>
  </RNView>
);

export default function CareerStatsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [gameCount, setGameCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      void loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      setIsLoading(true);

      const profile = await getOrCreateDefaultProfile();
      const seasons = await getSeasonsByProfile(profile.id);

      // Count total games
      const gamesBySeason = await Promise.all(
        seasons.map((season) => getGamesBySeason(season.id))
      );
      const totalGames = gamesBySeason.reduce((acc, games) => acc + games.length, 0);

      const careerStats = await getCareerStats(profile.id);
      setStats(careerStats);
      setGameCount(totalGames);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No career stats available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Career Stats</Text>
        <Text style={styles.headerSubtitle}>{gameCount} games</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Regular Season */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Regular Season</Text>
          <View style={styles.statsGrid}>
            <StatDisplay
              label="Pass Yards"
              total={stats.regular_season.pass_yds.total}
              average={stats.regular_season.pass_yds.average}
              games={stats.regular_season.pass_yds.games}
            />
            <StatDisplay
              label="Pass TDs"
              total={stats.regular_season.pass_td.total}
              average={stats.regular_season.pass_td.average}
              games={stats.regular_season.pass_td.games}
            />
            <StatDisplay
              label="Interceptions"
              total={stats.regular_season.pass_int.total}
              average={stats.regular_season.pass_int.average}
              games={stats.regular_season.pass_int.games}
            />
            <StatDisplay
              label="Completions"
              total={stats.regular_season.pass_cmp.total}
              average={stats.regular_season.pass_cmp.average}
              games={stats.regular_season.pass_cmp.games}
            />
            <StatDisplay
              label="Attempts"
              total={stats.regular_season.pass_att.total}
              average={stats.regular_season.pass_att.average}
              games={stats.regular_season.pass_att.games}
            />
            <StatDisplay
              label="Rush Yards"
              total={stats.regular_season.rush_yds.total}
              average={stats.regular_season.rush_yds.average}
              games={stats.regular_season.rush_yds.games}
            />
            <StatDisplay
              label="Rush Attempts"
              total={stats.regular_season.rush_att.total}
              average={stats.regular_season.rush_att.average}
              games={stats.regular_season.rush_att.games}
            />
            <StatDisplay
              label="Rush TDs"
              total={stats.regular_season.rush_td.total}
              average={stats.regular_season.rush_td.average}
              games={stats.regular_season.rush_td.games}
            />
          </View>
        </View>

        {/* Postseason */}
        {stats.postseason.pass_yds.games > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Postseason</Text>
            <View style={styles.statsGrid}>
              <StatDisplay
                label="Pass Yards"
                total={stats.postseason.pass_yds.total}
                average={stats.postseason.pass_yds.average}
                games={stats.postseason.pass_yds.games}
              />
              <StatDisplay
                label="Pass TDs"
                total={stats.postseason.pass_td.total}
                average={stats.postseason.pass_td.average}
                games={stats.postseason.pass_td.games}
              />
              <StatDisplay
                label="Interceptions"
                total={stats.postseason.pass_int.total}
                average={stats.postseason.pass_int.average}
                games={stats.postseason.pass_int.games}
              />
              <StatDisplay
                label="Completions"
                total={stats.postseason.pass_cmp.total}
                average={stats.postseason.pass_cmp.average}
                games={stats.postseason.pass_cmp.games}
              />
              <StatDisplay
                label="Attempts"
                total={stats.postseason.pass_att.total}
                average={stats.postseason.pass_att.average}
                games={stats.postseason.pass_att.games}
              />
              <StatDisplay
                label="Rush Yards"
                total={stats.postseason.rush_yds.total}
                average={stats.postseason.rush_yds.average}
                games={stats.postseason.rush_yds.games}
              />
              <StatDisplay
                label="Rush Attempts"
                total={stats.postseason.rush_att.total}
                average={stats.postseason.rush_att.average}
                games={stats.postseason.rush_att.games}
              />
              <StatDisplay
                label="Rush TDs"
                total={stats.postseason.rush_td.total}
                average={stats.postseason.rush_td.average}
                games={stats.postseason.rush_td.games}
              />
            </View>
          </View>
        )}

        {/* Combined */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Combined</Text>
          <View style={styles.statsGrid}>
            <StatDisplay
              label="Pass Yards"
              total={stats.combined.pass_yds.total}
              average={stats.combined.pass_yds.average}
              games={stats.combined.pass_yds.games}
            />
            <StatDisplay
              label="Pass TDs"
              total={stats.combined.pass_td.total}
              average={stats.combined.pass_td.average}
              games={stats.combined.pass_td.games}
            />
            <StatDisplay
              label="Interceptions"
              total={stats.combined.pass_int.total}
              average={stats.combined.pass_int.average}
              games={stats.combined.pass_int.games}
            />
            <StatDisplay
              label="Completions"
              total={stats.combined.pass_cmp.total}
              average={stats.combined.pass_cmp.average}
              games={stats.combined.pass_cmp.games}
            />
            <StatDisplay
              label="Attempts"
              total={stats.combined.pass_att.total}
              average={stats.combined.pass_att.average}
              games={stats.combined.pass_att.games}
            />
            <StatDisplay
              label="Rush Yards"
              total={stats.combined.rush_yds.total}
              average={stats.combined.rush_yds.average}
              games={stats.combined.rush_yds.games}
            />
            <StatDisplay
              label="Rush Attempts"
              total={stats.combined.rush_att.total}
              average={stats.combined.rush_att.average}
              games={stats.combined.rush_att.games}
            />
            <StatDisplay
              label="Rush TDs"
              total={stats.combined.rush_td.total}
              average={stats.combined.rush_td.average}
              games={stats.combined.rush_td.games}
            />
          </View>
        </View>

        <RNView style={{ height: 20 }} />
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '48%',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statBoxLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 6,
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statBoxAverage: {
    fontSize: 11,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
  },
});
