import React, { createContext, useState } from 'react';

const themes = {
  light: {
    backgroundColor: '#f0f0f5',
    cardBackground: '#ffffff',
    textColor: '#333333',
    secondaryTextColor: '#666666',
    primaryColor: '#6200ea',
    inputBackground: '#ffffff',
    placeholderTextColor: '#999999',
    buttonTextColor: '#ffffff',
    editButtonColor: '#4caf50',
    deleteButtonColor: '#f44336',
    completeButtonColor: '#2196f3',
    undoButtonColor: '#ff9800',
  },
  dark: {
    backgroundColor: '#121212',
    cardBackground: '#1e1e1e',
    textColor: '#ffffff',
    secondaryTextColor: '#b3b3b3',
    primaryColor: '#bb86fc',
    inputBackground: '#2c2c2c',
    placeholderTextColor: '#666666',
    buttonTextColor: '#ffffff',
    editButtonColor: '#4caf50',
    deleteButtonColor: '#f44336',
    completeButtonColor: '#2196f3',
    undoButtonColor: '#ff9800',
  },
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const theme = isDark ? themes.dark : themes.light;
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};