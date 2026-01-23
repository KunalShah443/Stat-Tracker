import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  createSeason,
  getSeasonsByProfile,
  Season,
  updateSeason,
} from '@/src/db/supabaseDatabase';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View as RNView,
} from 'react-native';

type ModalMode = 'list' | 'create' | 'edit';

interface SeasonPickerProps {
  profileId: string;
  selectedSeasonId: string | null;
  onSeasonChange: (season: Season) => void;
}

export const SeasonPicker: React.FC<SeasonPickerProps> = ({
  profileId,
  selectedSeasonId,
  onSeasonChange,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const tintColor = theme.tint;
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('list');
  const [yearInput, setYearInput] = useState(String(new Date().getFullYear()));
  const [teamInput, setTeamInput] = useState('');

  const refreshSeasons = useCallback(async () => {
    const loaded = await getSeasonsByProfile(profileId);
    setSeasons(loaded);
    return loaded;
  }, [profileId]);

  useEffect(() => {
    void refreshSeasons();
  }, [refreshSeasons]);

  const selectedSeason = useMemo(
    () => seasons.find((s) => s.id === selectedSeasonId) || null,
    [seasons, selectedSeasonId]
  );

  useEffect(() => {
    if (!selectedSeasonId && seasons.length > 0) {
      onSeasonChange(seasons[0]);
    }
  }, [selectedSeasonId, seasons, onSeasonChange]);

  const closeModal = () => {
    setIsModalVisible(false);
    setModalMode('list');
  };

  const openList = () => {
    setModalMode('list');
    setIsModalVisible(true);
  };

  const openCreate = () => {
    setYearInput(String(new Date().getFullYear()));
    setTeamInput('');
    setModalMode('create');
    setIsModalVisible(true);
  };

  const openEdit = () => {
    if (!selectedSeason) return;
    setTeamInput(selectedSeason.team_name);
    setModalMode('edit');
    setIsModalVisible(true);
  };

  const handleSelectSeason = (season: Season) => {
    onSeasonChange(season);
    closeModal();
  };

  const handleCreateSeason = async () => {
    const year = Number(yearInput);
    const team = teamInput.trim();

    if (!Number.isInteger(year) || year < 1900) {
      Alert.alert('Error', 'Enter a valid season year');
      return;
    }

    if (!team) {
      Alert.alert('Error', 'Enter a team name');
      return;
    }

    const existing = seasons.find((s) => s.season_year === year);
    if (existing) {
      Alert.alert('Season exists', 'That year already exists. Select it from the list.');
      return;
    }

    const season = await createSeason(profileId, year, team);
    await refreshSeasons();
    onSeasonChange(season);
    closeModal();
  };

  const handleUpdateTeam = async () => {
    if (!selectedSeason) return;
    const team = teamInput.trim();

    if (!team) {
      Alert.alert('Error', 'Enter a team name');
      return;
    }

    const updated = await updateSeason(selectedSeason.id, { team_name: team });
    if (!updated) {
      Alert.alert('Error', 'Failed to update season');
      return;
    }

    await refreshSeasons();
    onSeasonChange(updated);
    closeModal();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderBottomColor: theme.borderSoft },
      ]}
    >
      <View style={styles.seasonHeader}>
        <Text style={[styles.seasonLabel, { color: theme.muted }]}>Season</Text>
        <Text style={[styles.seasonValue, { color: theme.text }]}>
          {selectedSeason
            ? `${selectedSeason.season_year} - ${selectedSeason.team_name}`
            : 'Not set'}
        </Text>
      </View>
      <View style={styles.actionsRow}>
        <Pressable style={styles.actionButton} onPress={openList}>
          <Text style={[styles.actionText, { color: tintColor }]}>Change</Text>
        </Pressable>
        {selectedSeason && (
          <Pressable style={styles.actionButton} onPress={openEdit}>
            <Text style={[styles.actionText, { color: tintColor }]}>Edit Team</Text>
          </Pressable>
        )}
        <Pressable style={styles.actionButton} onPress={openCreate}>
          <Text style={[styles.actionText, { color: tintColor }]}>New Season</Text>
        </Pressable>
      </View>

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
            {modalMode === 'list' && (
              <>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Select Season
                </Text>
                <ScrollView style={styles.list}>
                  {seasons.map((season) => {
                    const isSelected = season.id === selectedSeasonId;
                    return (
                      <Pressable
                        key={season.id}
                        style={[
                          styles.listItem,
                          {
                            borderColor: theme.borderSoft,
                            backgroundColor: theme.surface2,
                          },
                          isSelected && {
                            borderColor: theme.tint,
                            backgroundColor: theme.tintSoft,
                          },
                        ]}
                        onPress={() => handleSelectSeason(season)}
                      >
                        <Text style={[styles.listItemTitle, { color: theme.text }]}>
                          {season.season_year}
                        </Text>
                        <Text style={[styles.listItemSubtitle, { color: theme.muted }]}>
                          {season.team_name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Pressable style={styles.modalCloseButton} onPress={closeModal}>
                  <Text style={[styles.modalCloseText, { color: theme.tint }]}>
                    Close
                  </Text>
                </Pressable>
              </>
            )}

            {modalMode === 'create' && (
              <>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Create Season
                </Text>
                <Text style={[styles.inputLabel, { color: theme.muted }]}>
                  Season Year
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface2,
                      color: theme.text,
                      borderColor: theme.borderSoft,
                    },
                  ]}
                  keyboardType="numeric"
                  value={yearInput}
                  onChangeText={setYearInput}
                />
                <Text style={[styles.inputLabel, { color: theme.muted }]}>
                  Team Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface2,
                      color: theme.text,
                      borderColor: theme.borderSoft,
                    },
                  ]}
                  value={teamInput}
                  onChangeText={setTeamInput}
                />
                <View style={styles.modalButtonRow}>
                  <Pressable
                    style={[styles.modalSecondaryButton, { borderColor: theme.borderSoft }]}
                    onPress={closeModal}
                  >
                    <Text style={[styles.modalSecondaryText, { color: theme.text }]}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalPrimaryButton, { backgroundColor: tintColor }]}
                    onPress={handleCreateSeason}
                  >
                    <Text style={styles.modalPrimaryText}>Save</Text>
                  </Pressable>
                </View>
              </>
            )}

            {modalMode === 'edit' && (
              <>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Edit Team
                </Text>
                <Text style={[styles.inputLabel, { color: theme.muted }]}>
                  Team Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface2,
                      color: theme.text,
                      borderColor: theme.borderSoft,
                    },
                  ]}
                  value={teamInput}
                  onChangeText={setTeamInput}
                />
                <View style={styles.modalButtonRow}>
                  <Pressable
                    style={[styles.modalSecondaryButton, { borderColor: theme.borderSoft }]}
                    onPress={closeModal}
                  >
                    <Text style={[styles.modalSecondaryText, { color: theme.text }]}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalPrimaryButton, { backgroundColor: tintColor }]}
                    onPress={handleUpdateTeam}
                  >
                    <Text style={styles.modalPrimaryText}>Update</Text>
                  </Pressable>
                </View>
              </>
            )}
          </RNView>
        </RNView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  seasonHeader: {
    marginBottom: 6,
  },
  seasonLabel: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  seasonValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
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
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
  },
  list: {
    marginBottom: 12,
  },
  listItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
  listItemSubtitle: {
    fontSize: 12,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
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
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalPrimaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  modalPrimaryText: {
    color: '#0B1220',
    fontWeight: '600',
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
  },
  modalSecondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
  },
  modalSecondaryText: {
    fontWeight: '600',
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
  },
});
