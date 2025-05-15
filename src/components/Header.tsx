import React from 'react';
import { Library, Grid, List, Sun, Moon, Sunrise } from 'lucide-react';
import { useLibraryStore } from '../store';

export const Header: React.FC = () => {
  const { view, theme, setView, setTheme } = useLibraryStore();

  const themeIcons = {
    light: <Sun className="w-5 h-5" />,
    dark: <Moon className="w-5 h-5" />,
    sepia: <Sunrise className="w-5 h-5" />,
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Library className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Цифровая Библиотека</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded ${
                  view === 'grid'
                    ? 'bg-white dark:bg-gray-600 shadow'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                title="Сетка"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded ${
                  view === 'list'
                    ? 'bg-white dark:bg-gray-600 shadow'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                title="Список"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['light', 'dark', 'sepia'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`p-2 rounded ${
                    theme === t
                      ? 'bg-white dark:bg-gray-600 shadow'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                  title={t === 'light' ? 'Светлая' : t === 'dark' ? 'Тёмная' : 'Сепия'}
                >
                  {themeIcons[t]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};