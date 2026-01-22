import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

type HomeButtonProps = {
  color?: string;
  label?: string;
};

export default function HomeButton({ color, label = 'Home' }: HomeButtonProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const accent = color ?? theme.tint;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go to home"
      onPress={() => router.replace('/home')}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.surface2,
          borderColor: accent,
        },
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.text, { color: accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    letterSpacing: 1.2,
    fontFamily: 'SpaceMono',
    textTransform: 'uppercase',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ translateY: 1 }],
  },
});
