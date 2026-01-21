import { Text, View } from '@/components/Themed';
import { getOrCreateCurrentSeason, getOrCreateDefaultProfile } from '@/src/db/database';
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
  const [isLoading, setIsLoading] = useState(true);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [])
  );

  const loadRecords = async () => {
    try {
      setIsLoading(true);

      const profile = getOrCreateDefaultProfile();
      const season = getOrCreateCurrentSeason(profile.id);

      const milestonesData = getMilestones(profile.id);
      const streaksData = getStreaks(season.id);

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
        milestone.achieved && styles.milestoneItemAchieved,
      ]}>
      <RNView
        style={[
          styles.milestoneCheckbox,
          milestone.achieved && styles.milestoneCheckboxAchieved,
        ]}>
        {milestone.achieved && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </RNView>
      <Text
        style={[
          styles.milestoneLabel,
          milestone.achieved && styles.milestoneLabelAchieved,
        ]}>
        {milestone.label}
      </Text>
    </RNView>
  );

  const StreakItem = ({ streak }: { streak: any }) => (
    <RNView style={styles.streakItem}>
      <Text style={styles.streakLabel}>{streak.label}</Text>
      <RNView style={styles.streakStats}>
        <RNView style={styles.streakStat}>
          <Text style={styles.streakStatValue}>{streak.currentStreak}</Text>
          <Text style={styles.streakStatLabel}>Current</Text>
        </RNView>
        <RNView style={styles.streakDivider} />
        <RNView style={styles.streakStat}>
          <Text style={styles.streakStatValue}>{streak.longestStreak}</Text>
          <Text style={styles.streakStatLabel}>Best</Text>
        </RNView>
      </RNView>
    </RNView>
  );

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
        <Text style={styles.headerTitle}>Records & Milestones</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Streaks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Streaks</Text>
          {streaks.map((streak) => (
            <StreakItem key={streak.type} streak={streak} />
          ))}
        </View>

        {/* Career Milestones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Career Milestones</Text>

          {/* Passing Yards */}
          <Text style={styles.subsectionTitle}>Passing Yards</Text>
          {milestones
            .filter((m) => m.type.startsWith('pass_yds_'))
            .map((milestone) => (
              <MilestoneItem key={milestone.id} milestone={milestone} />
            ))}

          {/* Passing TDs */}
          <Text style={[styles.subsectionTitle, { marginTop: 15 }]}>
            Passing Touchdowns
          </Text>
          {milestones
            .filter((m) => m.type.startsWith('pass_td_'))
            .map((milestone) => (
              <MilestoneItem key={milestone.id} milestone={milestone} />
            ))}

          {/* Season Records */}
          <Text style={[styles.subsectionTitle, { marginTop: 15 }]}>
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
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
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
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
    marginBottom: 10,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    opacity: 0.6,
  },
  milestoneItemAchieved: {
    borderColor: '#4caf50',
    opacity: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  milestoneCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneCheckboxAchieved: {
    borderColor: '#4caf50',
    backgroundColor: '#4caf50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  milestoneLabel: {
    fontSize: 14,
  },
  milestoneLabelAchieved: {
    fontWeight: '600',
  },
  streakItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '700',
    marginBottom: 2,
  },
  streakStatLabel: {
    fontSize: 11,
    opacity: 0.6,
  },
  streakDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
  },
});
