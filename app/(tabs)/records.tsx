import FieldBackdrop from '@/components/FieldBackdrop';
import HomeButton from '@/components/HomeButton';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { getOrCreateCurrentSeason, getOrCreateDefaultProfile } from '@/src/db/supabaseDatabase';
import { getMilestones, getStreaks } from '@/src/db/queries';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    View as RNView,
    ScrollView,
    StyleSheet,
} from 'react-native';

export default function RecordsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const tintColor = theme.tint;
  const [isLoading, setIsLoading] = useState(true);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      void loadRecords();
    }, [])
  );

  const loadRecords = async () => {
    try {
      setIsLoading(true);

      const profile = await getOrCreateDefaultProfile();
      const season = await getOrCreateCurrentSeason(profile.id);

      const milestonesData = await getMilestones(profile.id);
      const streaksData = await getStreaks(season.id);

      setMilestones(milestonesData);
      setStreaks(streaksData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const MilestoneItem = ({ milestone }: { milestone: any }) => (
    <RNView
      style={[
        styles.milestoneItem,
        { backgroundColor: theme.surface, borderColor: theme.borderSoft },
        milestone.achieved && {
          borderColor: theme.tint,
          backgroundColor: theme.tintSoft,
          opacity: 1,
        },
      ]}>
      <RNView
        style={[
          styles.milestoneCheckbox,
          { borderColor: theme.borderSoft, backgroundColor: theme.surface2 },
          milestone.achieved && { borderColor: theme.tint, backgroundColor: theme.tint },
        ]}>
        {milestone.achieved ? (
          <FontAwesome name="check" size={12} color="#0B1220" />
        ) : null}
      </RNView>
      <Text
        style={[
          styles.milestoneLabel,
          milestone.achieved && styles.milestoneLabelAchieved,
          { color: milestone.achieved ? theme.text : theme.muted },
        ]}>
        {milestone.label}
      </Text>
    </RNView>
  );

  const StreakItem = ({ streak }: { streak: any }) => (
    <RNView
      style={[
        styles.streakItem,
        { backgroundColor: theme.surface, borderColor: theme.borderSoft },
      ]}>
      <RNView style={[styles.cardStripe, { backgroundColor: theme.accent2 }]} />
      <Text style={[styles.streakLabel, { color: theme.text }]}>{streak.label}</Text>
      <RNView style={styles.streakStats}>
        <RNView style={styles.streakStat}>
          <Text style={[styles.streakStatValue, { color: theme.text }]}>
            {streak.currentStreak}
          </Text>
          <Text style={[styles.streakStatLabel, { color: theme.muted }]}>Current</Text>
        </RNView>
        <RNView style={[styles.streakDivider, { backgroundColor: theme.borderSoft }]} />
        <RNView style={styles.streakStat}>
          <Text style={[styles.streakStatValue, { color: theme.text }]}>
            {streak.longestStreak}
          </Text>
          <Text style={[styles.streakStatLabel, { color: theme.muted }]}>Best</Text>
        </RNView>
      </RNView>
    </RNView>
  );

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
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Records & Milestones
            </Text>
          </View>
          <HomeButton color={tintColor} />
        </View>
        <View style={[styles.headerRule, { backgroundColor: theme.tintSoft }]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Streaks */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Current Streaks</Text>
          {streaks.map((streak) => (
            <StreakItem key={streak.type} streak={streak} />
          ))}
        </View>

        {/* Career Milestones */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Career Milestones</Text>

          {/* Passing Yards */}
          <Text style={[styles.subsectionTitle, { color: theme.muted }]}>Passing Yards</Text>
          {milestones
            .filter((m) => m.type.startsWith('pass_yds_'))
            .map((milestone) => (
              <MilestoneItem key={milestone.id} milestone={milestone} />
            ))}

          {/* Passing TDs */}
          <Text style={[styles.subsectionTitle, { marginTop: 15, color: theme.muted }]}>
            Passing Touchdowns
          </Text>
          {milestones
            .filter((m) => m.type.startsWith('pass_td_'))
            .map((milestone) => (
              <MilestoneItem key={milestone.id} milestone={milestone} />
            ))}

          {/* Season Records */}
          <Text style={[styles.subsectionTitle, { marginTop: 15, color: theme.muted }]}>
            Single Season Records
          </Text>
          {milestones
            .filter((m) => m.type.startsWith('season_'))
            .map((milestone) => (
              <MilestoneItem key={milestone.id} milestone={milestone} />
            ))}
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
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
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
  subsectionTitle: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    opacity: 0.85,
  },
  milestoneCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 2,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneLabel: {
    fontSize: 14,
  },
  milestoneLabelAchieved: {
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
  },
  streakItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 12,
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
  streakLabel: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  streakStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakStat: {
    flex: 1,
    alignItems: 'center',
  },
  streakStatValue: {
    fontSize: 20,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  streakStatLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  streakDivider: {
    width: 1,
    height: 30,
  },
});
