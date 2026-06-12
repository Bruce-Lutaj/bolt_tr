import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
          borderTopWidth: 1,
          height: Platform.OS === 'android' ? 84 : 84,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          tabBarLabel: 'Today',
          tabBarIcon: ({ color }) => (
            <View
              style={{
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'transparent',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color }}>T</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          tabBarLabel: 'Workout',
          tabBarIcon: ({ color }) => (
            <View
              style={{
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'transparent',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color }}>W</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => (
            <View
              style={{
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'transparent',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color }}>H</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <View
              style={{
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'transparent',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color }}>P</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
