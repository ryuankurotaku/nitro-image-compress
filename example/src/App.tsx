import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import type React from 'react';
import { Text } from 'react-native';
import { CompareScreen, CompressorScreen, NitroScreen, ResizerScreen } from './screens';

const Tab = createBottomTabNavigator();

export const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Compare"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#999',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          tabBarStyle: { paddingBottom: 6, height: 56 },
        }}
      >
        <Tab.Screen
          name="Nitro"
          component={NitroScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚡</Text>,
            tabBarLabel: 'Nitro',
          }}
        />
        <Tab.Screen
          name="Resizer"
          component={ResizerScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🖼️</Text>,
            tabBarLabel: 'Resizer',
          }}
        />
        <Tab.Screen
          name="Compressor"
          component={CompressorScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗜️</Text>,
            tabBarLabel: 'Compressor',
          }}
        />
        <Tab.Screen
          name="Compare"
          component={CompareScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏎️</Text>,
            tabBarLabel: 'Compare',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
