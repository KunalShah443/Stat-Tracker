import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/Themed';

type HomeButtonProps = {
  color?: string;
  label?: string;
};

export default function HomeButton({ color, label = 'Home' }: HomeButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go to home"
      onPress={() => router.replace('/home')}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Text style={[styles.text, color ? { color } : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    letterSpacing: 0.6,
    fontFamily: 'SpaceMono',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ translateY: 1 }],
  },
});
