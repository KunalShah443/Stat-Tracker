import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { showAlert } from '@/src/utils/alerts';
import {
  GameFormData,
  getPostseasonRoundLabel,
  POSTSEASON_ROUNDS,
  QB_STATS,
  QBStatKey,
} from '@/src/types/stats';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

interface QBStatFormProps {
  formData: GameFormData;
  onFormChange: (data: GameFormData) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export const QBStatForm: React.FC<QBStatFormProps> = ({
  formData,
  onFormChange,
  onSubmit,
  isLoading = false,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [showPostseasonOptions, setShowPostseasonOptions] = useState(false);

  const updateBasicField = (field: keyof Omit<GameFormData, 'stats'>, value: any) => {
    onFormChange({
      ...formData,
      [field]: value,
    });
  };

  const updateStat = (statKey: QBStatKey, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (isNaN(numValue)) return;

    onFormChange({
      ...formData,
      stats: {
        ...formData.stats,
        [statKey]: numValue,
      },
    });
  };

  const handleSubmit = () => {
    if (!formData.opponent.trim()) {
      showAlert('Error', 'Please enter opponent name');
      return;
    }
    onSubmit();
  };

  const inputBackground = isDarkMode ? '#333' : '#f0f0f0';
  const inputBorder = isDarkMode ? '#555' : '#ddd';
  const inputText = isDarkMode ? '#fff' : '#000';
  const placeholderText = isDarkMode ? '#999' : '#666';
  const selectedPostseasonLabel = getPostseasonRoundLabel(formData.week ?? null);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Basic Game Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Game Info</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Opponent</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: inputBackground,
                color: inputText,
                borderColor: inputBorder,
              },
            ]}
            placeholder="Enter opponent"
            placeholderTextColor={placeholderText}
            value={formData.opponent}
            onChangeText={(text) => updateBasicField('opponent', text)}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>
              {formData.isPostseason ? 'Postseason Round' : 'Week (Optional)'}
            </Text>
            {formData.isPostseason ? (
              <>
                <Pressable
                  style={[
                    styles.input,
                    styles.dropdownInput,
                    {
                      backgroundColor: inputBackground,
                      borderColor: inputBorder,
                    },
                  ]}
                  onPress={() => setShowPostseasonOptions((prev) => !prev)}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      { color: selectedPostseasonLabel ? inputText : placeholderText },
                    ]}
                  >
                    {selectedPostseasonLabel || 'Select round'}
                  </Text>
                </Pressable>
                {showPostseasonOptions && (
                  <View style={[styles.dropdown, { borderColor: inputBorder }]}>
                    {POSTSEASON_ROUNDS.map((round) => {
                      const isSelected = formData.week === round.value;
                      return (
                        <Pressable
                          key={round.value}
                          style={[
                            styles.dropdownOption,
                            isSelected && {
                              backgroundColor: Colors[colorScheme ?? 'light'].tint,
                            },
                          ]}
                          onPress={() => {
                            updateBasicField('week', round.value);
                            setShowPostseasonOptions(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && { color: '#fff' },
                            ]}
                          >
                            {round.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </>
            ) : (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBackground,
                    color: inputText,
                    borderColor: inputBorder,
                  },
                ]}
                placeholder="Week #"
                placeholderTextColor={placeholderText}
                keyboardType="numeric"
                value={formData.week?.toString() || ''}
                onChangeText={(text) =>
                  updateBasicField('week', text === '' ? undefined : parseInt(text))
                }
              />
            )}
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
            <Text style={styles.label}>Result</Text>
            <View style={styles.buttonGroup}>
              {(['W', 'L', 'T'] as const).map((r) => (
                <Pressable
                  key={r}
                  style={[
                    styles.resultButton,
                    formData.result === r && {
                      backgroundColor: Colors[colorScheme ?? 'light'].tint,
                    },
                  ]}
                  onPress={() => updateBasicField('result', r)}
                >
                  <Text
                    style={[
                      styles.resultButtonText,
                      formData.result === r && { color: '#fff' },
                    ]}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.checkboxRow}>
            <Pressable
              onPress={() => {
                const nextValue = !formData.isPostseason;
                onFormChange({
                  ...formData,
                  isPostseason: nextValue,
                  week: undefined,
                });
                setShowPostseasonOptions(false);
              }}
              style={styles.checkbox}
            >
              <View
                style={[
                  styles.checkboxInner,
                  formData.isPostseason && {
                    backgroundColor: Colors[colorScheme ?? 'light'].tint,
                  },
                ]}
              />
              <Text style={styles.checkboxLabel}>Postseason Game</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* QB Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>QB Stats</Text>

        {Object.entries(QB_STATS).map(([key, config]) => (
          <View key={key} style={styles.formGroup}>
            <Text style={styles.label}>{config.label}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputBackground,
                  color: inputText,
                  borderColor: inputBorder,
                },
              ]}
              placeholder="0"
              placeholderTextColor={placeholderText}
              keyboardType="decimal-pad"
              value={formData.stats[key as QBStatKey].toString()}
              onChangeText={(text) => updateStat(key as QBStatKey, text)}
            />
          </View>
        ))}
      </View>

      {/* Submit Button */}
      <Pressable
        style={[
          styles.submitButton,
          {
            backgroundColor: Colors[colorScheme ?? 'light'].tint,
            opacity: isLoading ? 0.6 : 1,
          },
        ]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? 'Saving...' : 'Save Game'}
        </Text>
      </Pressable>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
  },
  dropdownInput: {
    justifyContent: 'center',
  },
  dropdownText: {
    fontSize: 14,
  },
  dropdown: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  dropdownOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  resultButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  resultButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  checkboxInner: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#999',
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  submitButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
