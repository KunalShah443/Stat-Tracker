import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopColor: theme.borderSoft,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'SpaceMono',
          letterSpacing: 0.8,
          fontSize: 10,
          textTransform: 'uppercase',
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="add-game"
        options={{
          title: 'Add Game',
          tabBarIcon: ({ color }) => <TabBarIcon name="plus" color={color} />,
        }}
      />
      <Tabs.Screen
        name="game-logs"
        options={{
          title: 'Game Logs',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="season-stats"
        options={{
          title: 'Season Stats',
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="career-stats"
        options={{
          title: 'Career Stats',
          tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ color }) => <TabBarIcon name="trophy" color={color} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Achievements',
          tabBarIcon: ({ color }) => <TabBarIcon name="star" color={color} />,
        }}
      />
    </Tabs>
  );
}
