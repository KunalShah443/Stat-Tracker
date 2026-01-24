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
import { Pressable, ScrollView, StyleSheet, TextInput, View as RNView } from 'react-native';

interface QBStatFormProps {
  formData: GameFormData;
  onFormChange: (data: GameFormData) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
}

export const QBStatForm: React.FC<QBStatFormProps> = ({
  formData,
  onFormChange,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save Game',
  submittingLabel = 'Saving...',
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [showPostseasonOptions, setShowPostseasonOptions] = useState(false);

  const updateBasicField = (field: keyof Omit<GameFormData, 'stats'>, value: any) => {
    onFormChange({
      ...formData,
      [field]: value,
    });
  };

  const toOptionalScore = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const num = parseInt(trimmed, 10);
    if (!Number.isFinite(num)) return undefined;
    return Math.max(0, num);
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

  const inputBackground = theme.surface2;
  const inputBorder = theme.borderSoft;
  const inputText = theme.text;
  const placeholderText = theme.muted;
  const selectedPostseasonLabel = getPostseasonRoundLabel(formData.week ?? null);
  const opponentLabel = formData.opponent.trim() || 'Opponent';
  const matchupPreview = formData.isHome
    ? `${opponentLabel} @ Your Team`
    : `Your Team @ ${opponentLabel}`;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Basic Game Info */}
      <View
        style={[
          styles.section,
          { backgroundColor: theme.surface, borderColor: theme.borderSoft },
        ]}
      >
        <RNView style={[styles.sectionStripe, { backgroundColor: theme.tint }]} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Game Info</Text>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.muted }]}>Opponent</Text>
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
            <Text style={[styles.label, { color: theme.muted }]}>
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
                  <View
                    style={[
                      styles.dropdown,
                      {
                        borderColor: inputBorder,
                        backgroundColor: theme.surface,
                      },
                    ]}
                  >
                    {POSTSEASON_ROUNDS.map((round) => {
                      const isSelected = formData.week === round.value;
                      return (
                        <Pressable
                          key={round.value}
                          style={[
                            styles.dropdownOption,
                            isSelected && {
                              backgroundColor: theme.tint,
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
                              { color: theme.text },
                              isSelected && { color: '#0B1220' },
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
            <Text style={[styles.label, { color: theme.muted }]}>Result</Text>
            <View style={styles.buttonGroup}>
              {(['W', 'L', 'T'] as const).map((r) => (
                <Pressable
                  key={r}
                  style={[
                    styles.resultButton,
                    { borderColor: inputBorder, backgroundColor: inputBackground },
                    formData.result === r && {
                      backgroundColor: theme.tint,
                      borderColor: theme.tint,
                    },
                  ]}
                  onPress={() => updateBasicField('result', r)}
                >
                  <Text
                    style={[
                      styles.resultButtonText,
                      { color: theme.text },
                      formData.result === r && { color: '#0B1220' },
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
                  { borderColor: inputBorder },
                  formData.isPostseason && {
                    backgroundColor: theme.tint,
                    borderColor: theme.tint,
                  },
                ]}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                Postseason Game
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.checkboxRow}>
            <Pressable
              onPress={() => updateBasicField('isHome', !formData.isHome)}
              style={styles.checkbox}
            >
              <View
                style={[
                  styles.checkboxInner,
                  { borderColor: inputBorder },
                  formData.isHome && {
                    backgroundColor: theme.tint,
                    borderColor: theme.tint,
                  },
                ]}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>Home Game</Text>
            </Pressable>
          </View>
          <Text style={[styles.helperText, { color: theme.muted }]}>{matchupPreview}</Text>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.checkboxRow}>
            <Pressable
              onPress={() => updateBasicField('isStarter', !formData.isStarter)}
              style={styles.checkbox}
            >
              <View
                style={[
                  styles.checkboxInner,
                  { borderColor: inputBorder },
                  formData.isStarter && {
                    backgroundColor: theme.tint,
                    borderColor: theme.tint,
                  },
                ]}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                Started Game
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.muted }]}>Your Score (Optional)</Text>
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
              keyboardType="numeric"
              value={formData.teamScore?.toString() ?? ''}
              onChangeText={(text) => updateBasicField('teamScore', toOptionalScore(text))}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
            <Text style={[styles.label, { color: theme.muted }]}>
              Opponent Score (Optional)
            </Text>
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
              keyboardType="numeric"
              value={formData.opponentScore?.toString() ?? ''}
              onChangeText={(text) =>
                updateBasicField('opponentScore', toOptionalScore(text))
              }
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.muted }]}>Notes (Optional)</Text>
          <TextInput
            style={[
              styles.input,
              styles.notesInput,
              {
                backgroundColor: inputBackground,
                color: inputText,
                borderColor: inputBorder,
              },
            ]}
            placeholder="Add a quick note about this game..."
            placeholderTextColor={placeholderText}
            multiline
            value={formData.note}
            onChangeText={(text) => updateBasicField('note', text)}
          />
        </View>
      </View>

      {/* QB Stats */}
      <View
        style={[
          styles.section,
          { backgroundColor: theme.surface, borderColor: theme.borderSoft },
        ]}
      >
        <RNView style={[styles.sectionStripe, { backgroundColor: theme.accent2 }]} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>QB Stats</Text>

        {Object.entries(QB_STATS).map(([key, config]) => (
          <View key={key} style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.muted }]}>{config.label}</Text>
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
            backgroundColor: theme.tint,
            opacity: isLoading ? 0.6 : 1,
          },
        ]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? submittingLabel : submitLabel}
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
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
  },
  sectionStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 72,
    height: 3,
    borderBottomRightRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
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
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
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
    alignItems: 'center',
  },
  resultButtonText: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
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
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
  },
  submitButton: {
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#0B1220',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
    letterSpacing: 0.6,
  },
});
