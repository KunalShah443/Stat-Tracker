import HomeButton from '@/components/HomeButton';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { QBStatForm } from '@/src/components/QBStatForm';
import { SeasonPicker } from '@/src/components/SeasonPicker';
import { useGame, useProfile, useSeason } from '@/src/hooks/useDatabase';
import { DEFAULT_GAME_FORM_DATA, GameFormData } from '@/src/types/stats';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet } from 'react-native';

export default function AddGameScreen() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const [formData, setFormData] = useState<GameFormData>(DEFAULT_GAME_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const { profile, getOrCreateDefault } = useProfile();
  const { currentSeason, getOrCreateCurrent, selectSeason } = useSeason();
  const { createNewGame, setStat } = useGame();

  // Initialize profile and season on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const p = await getOrCreateDefault();
        await getOrCreateCurrent(p.id);
      } catch (error) {
        console.error(error);
      } finally {
        setIsInitializing(false);
      }
    };

    void initialize();
  }, [getOrCreateCurrent, getOrCreateDefault]);

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
      const gameDate = new Date().toISOString().split('T')[0];

      // Create the game
      const game = await createNewGame(
        currentSeason.id,
        gameDate,
        formData.opponent,
        formData.isPostseason,
        formData.week,
        formData.result
      );

      // Set all stats
      for (const [key, value] of Object.entries(formData.stats)) {
        await setStat(game.id, key, value);
      }

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
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>New Game</Text>
          <HomeButton color={tintColor} />
        </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
