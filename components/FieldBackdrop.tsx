import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View as RNView } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';

type FieldBackdropProps = {
  variant?: 'subtle' | 'hero';
};

const YARD_LINE_TOPS = ['14%', '28%', '42%', '56%', '70%', '84%'] as const;

export default function FieldBackdrop({ variant = 'subtle' }: FieldBackdropProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isHero = variant === 'hero';

  return (
    <RNView pointerEvents="none" style={StyleSheet.absoluteFill}>
      <RNView
        style={[
          styles.glow,
          styles.glowOne,
          { backgroundColor: theme.glow1, opacity: isHero ? 1 : 0.7 },
        ]}
      />
      <RNView
        style={[
          styles.glow,
          styles.glowTwo,
          { backgroundColor: theme.glow2, opacity: isHero ? 1 : 0.65 },
        ]}
      />

      <RNView
        style={[
          styles.wedge,
          { backgroundColor: theme.accent2Soft, opacity: isHero ? 0.9 : 0.65 },
        ]}
      />
      <RNView
        style={[
          styles.wedge,
          styles.wedgeTwo,
          { backgroundColor: theme.tintSoft, opacity: isHero ? 0.85 : 0.6 },
        ]}
      />

      {YARD_LINE_TOPS.map((top) => (
        <RNView key={top} style={[styles.yardLine, { top, backgroundColor: theme.fieldLine }]} />
      ))}

      {YARD_LINE_TOPS.map((top) => (
        <RNView key={`${top}-hash`} style={[styles.hashRow, { top }]}>
          <RNView style={[styles.hash, { backgroundColor: theme.fieldHash }]} />
          <RNView style={[styles.hash, { backgroundColor: theme.fieldHash }]} />
        </RNView>
      ))}
    </RNView>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowOne: {
    width: 360,
    height: 360,
    top: -140,
    left: -150,
  },
  glowTwo: {
    width: 320,
    height: 320,
    bottom: -160,
    right: -140,
  },
  wedge: {
    position: 'absolute',
    width: 620,
    height: 120,
    top: '22%',
    right: -260,
    transform: [{ rotate: '-14deg' }],
    borderRadius: 28,
  },
  wedgeTwo: {
    width: 560,
    height: 96,
    top: '44%',
    right: -240,
    transform: [{ rotate: '-10deg' }],
    borderRadius: 26,
  },
  yardLine: {
    position: 'absolute',
    left: '-10%',
    width: '120%',
    height: 1,
    opacity: 0.9,
  },
  hashRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 56,
    opacity: 0.9,
  },
  hash: {
    width: 18,
    height: 2,
    borderRadius: 2,
  },
});
