import FieldBackdrop from '@/components/FieldBackdrop';
import HomeButton from '@/components/HomeButton';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { StatTile } from '@/src/components/StatTile';
import {
  getGamesBySeason,
  getOrCreateDefaultProfile,
  getSeasonsByProfile,
} from '@/src/db/supabaseDatabase';
import { getCareerStats } from '@/src/db/queries';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    View as RNView,
    ScrollView,
    StyleSheet,
} from 'react-native';

export default function CareerStatsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const tintColor = theme.tint;
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
        <FieldBackdrop variant="subtle" />
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.centerContainer}>
        <FieldBackdrop variant="subtle" />
        <Text style={[styles.emptyText, { color: theme.text }]}>
          No career stats available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FieldBackdrop variant="subtle" />
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.borderSoft }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Career Stats</Text>
            <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
              {gameCount} games
            </Text>
          </View>
          <HomeButton color={tintColor} />
        </View>
        <View style={[styles.headerRule, { backgroundColor: theme.tintSoft }]} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Regular Season */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Regular Season</Text>
          <View style={styles.statsGrid}>
            <StatTile
              style={styles.statTile}
              label="Pass Yards"
              value={stats.regular_season.pass_yds.total.toFixed(1)}
              subLabel={`${stats.regular_season.pass_yds.average.toFixed(1)}/game`}
              stripeColor={theme.accent2}
            />
            <StatTile
              style={styles.statTile}
              label="Pass TDs"
              value={stats.regular_season.pass_td.total.toFixed(1)}
              subLabel={`${stats.regular_season.pass_td.average.toFixed(1)}/game`}
              stripeColor={theme.accent2}
            />
            <StatTile
              style={styles.statTile}
              label="Interceptions"
              value={stats.regular_season.pass_int.total.toFixed(1)}
              subLabel={`${stats.regular_season.pass_int.average.toFixed(1)}/game`}
              stripeColor={theme.danger}
            />
            <StatTile
              style={styles.statTile}
              label="Completions"
              value={stats.regular_season.pass_cmp.total.toFixed(1)}
              subLabel={`${stats.regular_season.pass_cmp.average.toFixed(1)}/game`}
              stripeColor={theme.accent2}
            />
            <StatTile
              style={styles.statTile}
              label="Attempts"
              value={stats.regular_season.pass_att.total.toFixed(1)}
              subLabel={`${stats.regular_season.pass_att.average.toFixed(1)}/game`}
              stripeColor={theme.accent2}
            />
            <StatTile
              style={styles.statTile}
              label="Rush Yards"
              value={stats.regular_season.rush_yds.total.toFixed(1)}
              subLabel={`${stats.regular_season.rush_yds.average.toFixed(1)}/game`}
              stripeColor={theme.tint}
            />
            <StatTile
              style={styles.statTile}
              label="Rush Attempts"
              value={stats.regular_season.rush_att.total.toFixed(1)}
              subLabel={`${stats.regular_season.rush_att.average.toFixed(1)}/game`}
              stripeColor={theme.tint}
            />
            <StatTile
              style={styles.statTile}
              label="Rush TDs"
              value={stats.regular_season.rush_td.total.toFixed(1)}
              subLabel={`${stats.regular_season.rush_td.average.toFixed(1)}/game`}
              stripeColor={theme.tint}
            />
          </View>
        </View>

        {/* Postseason */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Postseason ({stats.postseason.pass_yds.games} games)
          </Text>
          {stats.postseason.pass_yds.games === 0 ? (
            <Text style={[styles.sectionHint, { color: theme.muted }]}>
              No postseason games logged yet.
            </Text>
          ) : null}
          <View style={styles.statsGrid}>
              <StatTile
                style={styles.statTile}
                label="Pass Yards"
                value={stats.postseason.pass_yds.total.toFixed(1)}
                subLabel={`${stats.postseason.pass_yds.average.toFixed(1)}/game`}
                stripeColor={theme.accent2}
              />
              <StatTile
                style={styles.statTile}
                label="Pass TDs"
                value={stats.postseason.pass_td.total.toFixed(1)}
                subLabel={`${stats.postseason.pass_td.average.toFixed(1)}/game`}
                stripeColor={theme.accent2}
              />
              <StatTile
                style={styles.statTile}
                label="Interceptions"
                value={stats.postseason.pass_int.total.toFixed(1)}
                subLabel={`${stats.postseason.pass_int.average.toFixed(1)}/game`}
                stripeColor={theme.danger}
              />
              <StatTile
                style={styles.statTile}
                label="Completions"
                value={stats.postseason.pass_cmp.total.toFixed(1)}
                subLabel={`${stats.postseason.pass_cmp.average.toFixed(1)}/game`}
                stripeColor={theme.accent2}
              />
              <StatTile
                style={styles.statTile}
                label="Attempts"
                value={stats.postseason.pass_att.total.toFixed(1)}
                subLabel={`${stats.postseason.pass_att.average.toFixed(1)}/game`}
                stripeColor={theme.accent2}
              />
              <StatTile
                style={styles.statTile}
                label="Rush Yards"
                value={stats.postseason.rush_yds.total.toFixed(1)}
                subLabel={`${stats.postseason.rush_yds.average.toFixed(1)}/game`}
                stripeColor={theme.tint}
              />
              <StatTile
                style={styles.statTile}
                label="Rush Attempts"
                value={stats.postseason.rush_att.total.toFixed(1)}
                subLabel={`${stats.postseason.rush_att.average.toFixed(1)}/game`}
                stripeColor={theme.tint}
              />
              <StatTile
                style={styles.statTile}
                label="Rush TDs"
                value={stats.postseason.rush_td.total.toFixed(1)}
                subLabel={`${stats.postseason.rush_td.average.toFixed(1)}/game`}
                stripeColor={theme.tint}
              />
          </View>
        </View>

        {/* Combined */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Combined</Text>
          <View style={styles.statsGrid}>
            <StatTile
              style={styles.statTile}
              label="Pass Yards"
              value={stats.combined.pass_yds.total.toFixed(1)}
              subLabel={`${stats.combined.pass_yds.average.toFixed(1)}/game`}
              stripeColor={theme.accent2}
            />
            <StatTile
              style={styles.statTile}
              label="Pass TDs"
              value={stats.combined.pass_td.total.toFixed(1)}
              subLabel={`${stats.combined.pass_td.average.toFixed(1)}/game`}
              stripeColor={theme.accent2}
            />
            <StatTile
              style={styles.statTile}
              label="Interceptions"
              value={stats.combined.pass_int.total.toFixed(1)}
              subLabel={`${stats.combined.pass_int.average.toFixed(1)}/game`}
              stripeColor={theme.danger}
            />
            <StatTile
              style={styles.statTile}
              label="Completions"
              value={stats.combined.pass_cmp.total.toFixed(1)}
              subLabel={`${stats.combined.pass_cmp.average.toFixed(1)}/game`}
              stripeColor={theme.accent2}
            />
            <StatTile
              style={styles.statTile}
              label="Attempts"
              value={stats.combined.pass_att.total.toFixed(1)}
              subLabel={`${stats.combined.pass_att.average.toFixed(1)}/game`}
              stripeColor={theme.accent2}
            />
            <StatTile
              style={styles.statTile}
              label="Rush Yards"
              value={stats.combined.rush_yds.total.toFixed(1)}
              subLabel={`${stats.combined.rush_yds.average.toFixed(1)}/game`}
              stripeColor={theme.tint}
            />
            <StatTile
              style={styles.statTile}
              label="Rush Attempts"
              value={stats.combined.rush_att.total.toFixed(1)}
              subLabel={`${stats.combined.rush_att.average.toFixed(1)}/game`}
              stripeColor={theme.tint}
            />
            <StatTile
              style={styles.statTile}
              label="Rush TDs"
              value={stats.combined.rush_td.total.toFixed(1)}
              subLabel={`${stats.combined.rush_td.average.toFixed(1)}/game`}
              stripeColor={theme.tint}
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    marginBottom: 4,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
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
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.3,
  },
  sectionHint: {
    fontSize: 12,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statTile: {
    width: '48%',
  },
  emptyText: {
    fontSize: 16,
  },
});
