import { Text, View } from '@/components/Themed';
import { QBStatForm } from '@/src/components/QBStatForm';
import { SeasonPicker } from '@/src/components/SeasonPicker';
import { useGame, useProfile, useSeason } from '@/src/hooks/useDatabase';
import { DEFAULT_GAME_FORM_DATA, GameFormData } from '@/src/types/stats';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet } from 'react-native';

export default function AddGameScreen() {
  const [formData, setFormData] = useState<GameFormData>(DEFAULT_GAME_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const { profile, getOrCreateDefault } = useProfile();
  const { currentSeason, getOrCreateCurrent, selectSeason } = useSeason();
  const { createNewGame, setStat } = useGame();

  // Initialize profile and season on mount
  useEffect(() => {
    const initialize = async () => {
      const p = getOrCreateDefault();
      getOrCreateCurrent(p.id);
      setIsInitializing(false);
    };

    initialize();
  }, []);

  const handleFormChange = (newData: GameFormData) => {
    setFormData(newData);
  };

  const handleSubmit = async () => {
    if (!profile || !currentSeason) {
      Alert.alert('Error', 'Failed to initialize profile or season');
      return;
    }

    setIsLoading(true);

    try {
      // Create the game
      const game = createNewGame(
        currentSeason.id,
        formData.gameDate,
        formData.opponent,
        formData.isPostseason,
        formData.week,
        formData.result
      );

      // Set all stats
      Object.entries(formData.stats).forEach(([key, value]) => {
        setStat(game.id, key, value);
      });

      Alert.alert('Success', 'Game saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setFormData(DEFAULT_GAME_FORM_DATA);
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save game. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile || !currentSeason) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load profile or season</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Game</Text>
      </View>
      {profile && (
        <SeasonPicker
          profileId={profile.id}
          selectedSeasonId={currentSeason?.id ?? null}
          onSeasonChange={selectSeason}
        />
      )}
      <QBStatForm
        formData={formData}
        onFormChange={handleFormChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
