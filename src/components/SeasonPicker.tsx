import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  createSeason,
  getSeasonsByProfile,
  Season,
  updateSeason,
} from '@/src/db/database';
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
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const modalBackground = colorScheme === 'dark' ? '#1a1a1a' : '#fff';
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
    <View style={styles.container}>
      <View style={styles.seasonHeader}>
        <Text style={styles.seasonLabel}>Season</Text>
        <Text style={styles.seasonValue}>
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
          <RNView style={[styles.modalContent, { backgroundColor: modalBackground }]}>
            {modalMode === 'list' && (
              <>
                <Text style={styles.modalTitle}>Select Season</Text>
                <ScrollView style={styles.list}>
                  {seasons.map((season) => {
                    const isSelected = season.id === selectedSeasonId;
                    return (
                      <Pressable
                        key={season.id}
                        style={[
                          styles.listItem,
                          isSelected && styles.listItemSelected,
                        ]}
                        onPress={() => handleSelectSeason(season)}
                      >
                        <Text style={styles.listItemTitle}>
                          {season.season_year}
                        </Text>
                        <Text style={styles.listItemSubtitle}>
                          {season.team_name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Pressable style={styles.modalCloseButton} onPress={closeModal}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </Pressable>
              </>
            )}

            {modalMode === 'create' && (
              <>
                <Text style={styles.modalTitle}>Create Season</Text>
                <Text style={styles.inputLabel}>Season Year</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
                      color: colorScheme === 'dark' ? '#fff' : '#000',
                      borderColor: colorScheme === 'dark' ? '#555' : '#ddd',
                    },
                  ]}
                  keyboardType="numeric"
                  value={yearInput}
                  onChangeText={setYearInput}
                />
                <Text style={styles.inputLabel}>Team Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
                      color: colorScheme === 'dark' ? '#fff' : '#000',
                      borderColor: colorScheme === 'dark' ? '#555' : '#ddd',
                    },
                  ]}
                  value={teamInput}
                  onChangeText={setTeamInput}
                />
                <View style={styles.modalButtonRow}>
                  <Pressable style={styles.modalSecondaryButton} onPress={closeModal}>
                    <Text style={styles.modalSecondaryText}>Cancel</Text>
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
                <Text style={styles.modalTitle}>Edit Team</Text>
                <Text style={styles.inputLabel}>Team Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
                      color: colorScheme === 'dark' ? '#fff' : '#000',
                      borderColor: colorScheme === 'dark' ? '#555' : '#ddd',
                    },
                  ]}
                  value={teamInput}
                  onChangeText={setTeamInput}
                />
                <View style={styles.modalButtonRow}>
                  <Pressable style={styles.modalSecondaryButton} onPress={closeModal}>
                    <Text style={styles.modalSecondaryText}>Cancel</Text>
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
    borderBottomColor: '#e0e0e0',
  },
  seasonHeader: {
    marginBottom: 6,
  },
  seasonLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 2,
  },
  seasonValue: {
    fontSize: 16,
    fontWeight: '600',
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  list: {
    marginBottom: 12,
  },
  listItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  listItemSelected: {
    borderColor: '#4caf50',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  listItemSubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
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
    color: '#fff',
    fontWeight: '600',
  },
  modalSecondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalSecondaryText: {
    fontWeight: '600',
  },
});
