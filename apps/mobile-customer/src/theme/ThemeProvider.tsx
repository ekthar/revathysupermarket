import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';
import { useSettingsStore } from "@/stores/settings";

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({ theme: 'light', toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme() ?? 'light';
  const { preferences, updatePreferences } = useSettingsStore();

  const resolved: Theme = preferences.themeMode === 'system'
    ? (system as Theme)
    : preferences.themeMode;

  const [theme, setTheme] = useState<Theme>(resolved);

  useEffect(() => {
    setTheme(resolved);
  }, [resolved]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    updatePreferences({ themeMode: next });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <View className={theme === 'dark' ? 'dark flex-1' : 'flex-1'}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
