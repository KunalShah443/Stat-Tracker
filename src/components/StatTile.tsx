import Colors from '@/constants/Colors';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View as RNView } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';

type StatTileProps = {
  label: string;
  value: number | string;
  subLabel?: string;
  stripeColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function StatTile({ label, value, subLabel, stripeColor, style }: StatTileProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const stripe = stripeColor ?? theme.tint;

  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: theme.surface, borderColor: theme.borderSoft },
        style,
      ]}
    >
      <RNView style={[styles.stripe, { backgroundColor: stripe }]} />
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      {subLabel ? (
        <Text style={[styles.subLabel, { color: theme.muted }]}>{subLabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    overflow: 'hidden',
    minHeight: 84,
  },
  stripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 72,
    height: 3,
    borderBottomRightRadius: 12,
  },
  label: {
    fontSize: 11,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  value: {
    fontSize: 20,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  subLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
