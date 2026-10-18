import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import type React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CompareScreen, CompressorScreen, NitroScreen, ResizerScreen } from './screens';

const Tab = createBottomTabNavigator();

export const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Compare"
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#4f46e5',
            tabBarInactiveTintColor: '#94a3b8',
            tabBarLabelStyle: styles.tabLabel,
            tabBarStyle: styles.tabBar,
          }}
        >
          <Tab.Screen
            name="Nitro"
            component={NitroScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.7 }}>⚡</Text>
              ),
              tabBarLabel: 'Nitro',
            }}
          />
          <Tab.Screen
            name="Resizer"
            component={ResizerScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.7 }}>🖼️</Text>
              ),
              tabBarLabel: 'Resizer',
            }}
          />
          <Tab.Screen
            name="Compressor"
            component={CompressorScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.7 }}>🗜️</Text>
              ),
              tabBarLabel: 'Compressor',
            }}
          />
          <Tab.Screen
            name="Compare"
            component={CompareScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.7 }}>🏎️</Text>
              ),
              tabBarLabel: 'Compare',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopColor: '#e2e8f0',
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
