import React, { useState, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { ThemeContext, ThemeProvider } from './ThemeContext';

// Import your two apps
import LengthConverter from './LengthConverter';
import TodoListApp from './TodoList';

// Create Stack navigator
const Stack = createNativeStackNavigator();

function MainScreen({ navigation }) {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Text style={[styles.title, { color: theme.textColor }]}>Welcome to Kydz App :))</Text>
      <Text style={[styles.subtitle, { color: theme.textColor }]}>Choose an application to continue:</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primaryColor }]}
          onPress={() => navigation.navigate('Length Converter')}
        >
          <Text style={[styles.buttonText, { color: theme.buttonTextColor }]}>Length Converter</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primaryColor }]}
          onPress={() => navigation.navigate('Todo List')}
        >
          <Text style={[styles.buttonText, { color: theme.buttonTextColor }]}>Todo List</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
        <Text style={{ color: theme.textColor }}>Toggle Theme</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Main">
          <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Length Converter" component={LengthConverter} />
          <Stack.Screen name="Todo List" component={TodoListApp} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#6200ea',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 2,
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  themeToggle: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6200ea',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 2,
  },
});
