import FieldBackdrop from '@/components/FieldBackdrop';
import HomeButton from '@/components/HomeButton';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  Achievement,
  createAchievement,
  deleteAchievement,
  getAchievementsByProfile,
  getOrCreateDefaultProfile,
  getSeasonsByProfile,
  Profile,
  Season,
} from '@/src/db/database';
import { showAlert, showConfirm } from '@/src/utils/alerts';
import { QB_STATS, QBStatKey } from '@/src/types/stats';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View as RNView,
} from 'react-native';

type AchievementTone = 'tint' | 'accent2' | 'danger' | 'warning';

type AchievementConfig = {
  type: string;
  label: string;
  subtitle: string;
  tone: AchievementTone;
};

const AWARDS: AchievementConfig[] = [
  { type: 'award_mvp', label: 'MVP', subtitle: 'League MVP', tone: 'tint' },
  {
    type: 'award_super_bowl',
    label: 'Super Bowl',
    subtitle: 'Championships',
    tone: 'accent2',
  },
  {
    type: 'award_super_bowl_mvp',
    label: 'Super Bowl MVP',
    subtitle: 'Big game hero',
    tone: 'tint',
  },
  {
    type: 'award_oroy',
    label: 'OROY',
    subtitle: 'Offensive Rookie of the Year',
    tone: 'accent2',
  },
  {
    type: 'award_opoy',
    label: 'OPOY',
    subtitle: 'Offensive Player of the Year',
    tone: 'tint',
  },
];

const LEADER_KEYS: QBStatKey[] = [
  'pass_yds',
  'pass_td',
  'pass_cmp',
  'pass_att',
  'rush_yds',
  'rush_td',
];

const LEADERS: AchievementConfig[] = LEADER_KEYS.map((key) => {
  const baseLabel = QB_STATS[key].label;
  const tone: AchievementTone =
    key.startsWith('rush_') ? 'tint' : key === 'pass_td' ? 'tint' : 'accent2';
  return {
    type: `leader_${key}`,
    label: 'League Leader',
    subtitle: `${baseLabel}`,
    tone,
  };
});

function getToneColor(theme: (typeof Colors)['light'], tone: AchievementTone) {
  if (tone === 'accent2') return theme.accent2;
  if (tone === 'danger') return theme.danger;
  if (tone === 'warning') return theme.warning;
  return theme.tint;
}

function normalizeYear(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const year = Number(trimmed);
  if (!Number.isInteger(year)) return null;
  return year;
}

export default function AchievementsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const tintColor = theme.tint;

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [entries, setEntries] = useState<Achievement[]>([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeConfig, setActiveConfig] = useState<AchievementConfig | null>(null);
  const [yearInput, setYearInput] = useState(String(new Date().getFullYear()));

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const p = await getOrCreateDefaultProfile();
      setProfile(p);
      const loadedSeasons = await getSeasonsByProfile(p.id);
      setSeasons(loadedSeasons);
      const loadedEntries = await getAchievementsByProfile(p.id);
      setEntries(loadedEntries);
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to load achievements.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const yearsByType = useMemo(() => {
    const map: Record<string, number[]> = {};
    entries.forEach((entry) => {
      if (!map[entry.type]) map[entry.type] = [];
      map[entry.type].push(entry.year);
    });
    Object.keys(map).forEach((key) => {
      map[key] = Array.from(new Set(map[key])).sort((a, b) => a - b);
    });
    return map;
  }, [entries]);

  const seasonYears = useMemo(() => {
    const years = Array.from(new Set(seasons.map((s) => s.season_year))).sort((a, b) => b - a);
    const current = new Date().getFullYear();
    if (!years.includes(current)) years.unshift(current);
    return years;
  }, [seasons]);

  const seasonTeamByYear = useMemo(() => {
    const map: Record<number, string> = {};
    seasons.forEach((season) => {
      // If duplicate season years exist, prefer the first one we see.
      if (map[season.season_year] === undefined) {
        map[season.season_year] = season.team_name;
      }
    });
    return map;
  }, [seasons]);

  const closeModal = () => {
    setIsModalVisible(false);
    setActiveConfig(null);
  };

  const openAddModal = (config: AchievementConfig) => {
    setActiveConfig(config);
    setYearInput(String(new Date().getFullYear()));
    setIsModalVisible(true);
  };

  const handleAddYear = async () => {
    if (!profile || !activeConfig) return;
    const year = normalizeYear(yearInput);
    if (year === null || year < 1900 || year > 2200) {
      showAlert('Invalid year', 'Enter a valid year (e.g. 2026).');
      return;
    }

    try {
      await createAchievement(profile.id, activeConfig.type, year);
      setEntries(await getAchievementsByProfile(profile.id));
      closeModal();
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Could not save that achievement year.');
    }
  };

  const handleRemoveYear = (config: AchievementConfig, year: number) => {
    if (!profile) return;

    showConfirm({
      title: 'Remove year',
      message: `Remove ${year} from ${config.subtitle}?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      onConfirm: () => {
        void (async () => {
          try {
            await deleteAchievement(profile.id, config.type, year);
            setEntries(await getAchievementsByProfile(profile.id));
          } catch (error) {
            console.error(error);
            showAlert('Error', 'Could not remove that year.');
          }
        })();
      },
    });
  };

  const renderAchievementCard = (config: AchievementConfig) => {
    const years = yearsByType[config.type] ?? [];
    const count = years.length;
    const stripeColor = getToneColor(theme, config.tone);

    return (
      <RNView
        key={config.type}
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.borderSoft },
        ]}
      >
        <RNView style={[styles.cardStripe, { backgroundColor: stripeColor }]} />

        <RNView style={styles.cardHeader}>
          <RNView style={styles.cardTitleBlock}>
            <Text style={[styles.cardLabel, { color: theme.muted }]}>{config.label}</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{config.subtitle}</Text>
          </RNView>
          <RNView
            style={[
              styles.cardCountPill,
              { backgroundColor: theme.surface2, borderColor: theme.borderSoft },
            ]}
          >
            <Text style={[styles.cardCountText, { color: stripeColor }]}>{count}</Text>
          </RNView>
        </RNView>

        {count === 0 ? (
          <Text style={[styles.cardEmpty, { color: theme.muted }]}>No years added yet.</Text>
        ) : (
          <RNView style={styles.yearRow}>
            {years.map((year) => (
              <Pressable
                key={`${config.type}_${year}`}
                onPress={() => handleRemoveYear(config, year)}
                style={({ pressed }) => [
                  styles.yearChip,
                  { backgroundColor: theme.surface2, borderColor: theme.borderSoft },
                  pressed && { borderColor: stripeColor },
                ]}
              >
                <Text style={[styles.yearChipText, { color: theme.text }]}>{year}</Text>
                <Text
                  numberOfLines={1}
                  style={[styles.yearChipTeam, { color: theme.muted }]}
                >
                  {seasonTeamByYear[year] ?? 'Team TBD'}
                </Text>
              </Pressable>
            ))}
          </RNView>
        )}

        <Pressable
          onPress={() => openAddModal(config)}
          style={({ pressed }) => [
            styles.addButton,
            { borderColor: stripeColor, backgroundColor: theme.surface2 },
            pressed && styles.addButtonPressed,
          ]}
        >
          <Text style={[styles.addButtonText, { color: stripeColor }]}>Add year</Text>
        </Pressable>
      </RNView>
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

      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.borderSoft },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Achievements</Text>
            <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
              Track awards and league leaders by year.
            </Text>
          </View>
          <HomeButton color={tintColor} />
        </View>
        <View style={[styles.headerRule, { backgroundColor: theme.tintSoft }]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Awards</Text>
        <RNView style={styles.cardGrid}>{AWARDS.map(renderAchievementCard)}</RNView>

        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 18 }]}>
          League Leaders
        </Text>
        <RNView style={styles.cardGrid}>{LEADERS.map(renderAchievementCard)}</RNView>

        <RNView style={{ height: 24 }} />
      </ScrollView>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <RNView style={styles.modalOverlay}>
          <RNView
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface, borderColor: theme.borderSoft },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {activeConfig ? `Add year - ${activeConfig.subtitle}` : 'Add year'}
            </Text>

            <Text style={[styles.inputLabel, { color: theme.muted }]}>Year</Text>
            <TextInput
              value={yearInput}
              onChangeText={setYearInput}
              placeholder="2026"
              placeholderTextColor={theme.muted}
              keyboardType="numeric"
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface2,
                  color: theme.text,
                  borderColor: theme.borderSoft,
                },
              ]}
            />

            <Text style={[styles.inputLabel, { color: theme.muted }]}>Quick pick</Text>
            <RNView style={styles.quickPickRow}>
              {seasonYears.slice(0, 8).map((year) => (
                <Pressable
                  key={`pick_${year}`}
                  onPress={() => setYearInput(String(year))}
                  style={({ pressed }) => [
                    styles.quickPickChip,
                    {
                      backgroundColor: theme.surface2,
                      borderColor: theme.borderSoft,
                    },
                    pressed && { borderColor: theme.tint },
                  ]}
                >
                  <Text style={[styles.quickPickText, { color: theme.text }]}>{year}</Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.quickPickTeam, { color: theme.muted }]}
                  >
                    {seasonTeamByYear[year] ?? 'Team TBD'}
                  </Text>
                </Pressable>
              ))}
            </RNView>

            <RNView style={styles.modalButtonRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalSecondaryButton,
                  { borderColor: theme.borderSoft, backgroundColor: theme.surface2 },
                  pressed && styles.addButtonPressed,
                ]}
                onPress={closeModal}
              >
                <Text style={[styles.modalSecondaryText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalPrimaryButton,
                  { backgroundColor: theme.tint },
                  pressed && styles.addButtonPressed,
                ]}
                onPress={handleAddYear}
              >
                <Text style={styles.modalPrimaryText}>Save</Text>
              </Pressable>
            </RNView>
          </RNView>
        </RNView>
      </Modal>
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
  content: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  cardGrid: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
  },
  cardCountPill: {
    minWidth: 44,
    height: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardCountText: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
  },
  cardEmpty: {
    fontSize: 13,
    marginBottom: 12,
  },
  yearRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  yearChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  yearChipText: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
  },
  yearChipTeam: {
    fontSize: 10,
    letterSpacing: 0.1,
    marginTop: 2,
    maxWidth: 140,
  },
  addButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  addButtonPressed: {
    transform: [{ translateY: 1 }],
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  quickPickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  quickPickChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  quickPickText: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
  },
  quickPickTeam: {
    fontSize: 10,
    letterSpacing: 0.1,
    marginTop: 2,
    maxWidth: 140,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalPrimaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  modalPrimaryText: {
    color: '#0B1220',
    fontFamily: 'SpaceMono',
    letterSpacing: 0.6,
    fontSize: 13,
    textTransform: 'uppercase',
  },
  modalSecondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  modalSecondaryText: {
    fontFamily: 'SpaceMono',
    letterSpacing: 0.6,
    fontSize: 13,
    textTransform: 'uppercase',
  },
});
