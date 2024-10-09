import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Keyboard, TouchableWithoutFeedback, FlatList } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { ThemeContext } from './ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LengthConverter() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [inputValue, setInputValue] = useState('');
  const [fromUnit, setFromUnit] = useState('Metre');
  const [toUnit, setToUnit] = useState('Millimetre');
  const [result, setResult] = useState(null);
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);
  const [history, setHistory] = useState([]);

  const conversionRates = {
    Metre: 1,
    Millimetre: 1000,
    Mile: 0.000621371,
    Foot: 3.28084,
  };

  const convert = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    const resultInMeters = value / conversionRates[fromUnit];
    const finalResult = resultInMeters * conversionRates[toUnit];
    const roundedResult = finalResult.toFixed(5);
    setResult(roundedResult);
    
    // Add to history
    const newHistoryItem = {
      id: Date.now().toString(),
      from: `${value} ${fromUnit}`,
      to: `${roundedResult} ${toUnit}`,
    };
    setHistory(prevHistory => [newHistoryItem, ...prevHistory.slice(0, 9)]);
    saveHistory([newHistoryItem, ...history.slice(0, 9)]);
    
    Keyboard.dismiss();
  };

  const saveHistory = async (historyToSave) => {
    try {
      await AsyncStorage.setItem('conversionHistory', JSON.stringify(historyToSave));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem('conversionHistory');
        if (savedHistory !== null) {
          setHistory(JSON.parse(savedHistory));
        }
      } catch (error) {
        console.error('Error loading history:', error);
      }
    };
    loadHistory();
  }, []);

  const handleFromOpen = () => {
    setOpenFrom(prev => !prev);
    if (!openFrom) setOpenTo(false)
  };

  const handleToOpen = () => {
    setOpenTo(prev => !prev);
    if (!openTo) setOpenFrom(false);
  };

  const closeDropdowns = () => {
    setOpenFrom(false);
    setOpenTo(false);
  };

  return (
    <TouchableWithoutFeedback onPress={() => { closeDropdowns(); Keyboard.dismiss(); }} accessible={false}>
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <Text style={[styles.title, { color: theme.textColor }]}>Length Converter</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter value"
          keyboardType="numeric"
          onChangeText={setInputValue}
          value={inputValue}
        />
        <Text style={styles.label}>From:</Text>
        <DropDownPicker
          open={openFrom}
          value={fromUnit}
          items={[
            { label: 'Metre', value: 'Metre' },
            { label: 'Millimetre', value: 'Millimetre' },
            { label: 'Mile', value: 'Mile' },
            { label: 'Foot', value: 'Foot' },
          ]}
          setOpen={handleFromOpen}
          setValue={setFromUnit}
          containerStyle={{ height: 50, zIndex: 10 }}
          dropDownContainerStyle={{ maxHeight: 200 }}
          style={styles.dropdown}
          placeholder="Select a unit"
        />
        <Text style={styles.label}>To:</Text>
        <DropDownPicker
          open={openTo}
          value={toUnit}
          items={[
            { label: 'Metre', value: 'Metre' },
            { label: 'Millimetre', value: 'Millimetre' },
            { label: 'Mile', value: 'Mile' },
            { label: 'Foot', value: 'Foot' },
          ]}
          setOpen={handleToOpen}
          setValue={setToUnit}
          containerStyle={{ height: 50, zIndex: 9 }}
          dropDownContainerStyle={{ maxHeight: 200 }}
          style={styles.dropdown}
          placeholder="Select a unit"
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primaryColor }]} onPress={convert}>
          <Text style={[styles.buttonText, { color: theme.buttonTextColor }]}>Convert</Text>
        </TouchableOpacity>
        {result && (
          <Text style={[styles.result, { color: theme.textColor }]}>
            {inputValue} {fromUnit} = {result} {toUnit}
          </Text>
        )}
        <Text style={[styles.historyTitle, { color: theme.textColor }]}>Conversion History</Text>
        <FlatList
          data={history}
          renderItem={({ item }) => (
            <Text style={[styles.historyItem, { color: theme.textColor }]}>
              {item.from} = {item.to}
            </Text>
          )}
          keyExtractor={item => item.id}
        />
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Text style={{ color: theme.buttonTextColor }}>Toggle Theme</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginVertical: 10,
    alignSelf: 'flex-start',
  },
  input: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    padding: 12,
    width: '100%',
    backgroundColor: '#fff',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    height: 50,
  },
  button: {
    backgroundColor: '#6200ea',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    margin: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  result: {
    fontSize: 18,
    marginTop: 20,
    color: '#333',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  historyItem: {
    fontSize: 14,
    marginBottom: 5,
  },
  themeToggle: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#6200ea',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});