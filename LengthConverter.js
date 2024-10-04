import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

export default function LengthConverter() {
  const [inputValue, setInputValue] = useState('');
  const [fromUnit, setFromUnit] = useState('Metre');
  const [toUnit, setToUnit] = useState('Millimetre');
  const [result, setResult] = useState(null);
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

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
    setResult(finalResult.toFixed(5));
    Keyboard.dismiss();
  };

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
      <View style={styles.container}>
        <Text style={styles.title}>Length Converter</Text>
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
        <TouchableOpacity style={styles.button} onPress={convert}>
          <Text style={styles.buttonText}>Convert</Text>
        </TouchableOpacity>
        {result && (
          <Text style={styles.result}>
            {inputValue} {fromUnit} = {result} {toUnit}
          </Text>
        )}
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
});
