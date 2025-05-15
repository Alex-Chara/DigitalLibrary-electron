import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { useLibraryStore } from '../store';
import type { SortOption } from '../types';

export const SearchAndSort: React.FC = () => {
  const { 
    searchQuery, 
    setSearchQuery, 
    sortBy, 
    setSortBy, 
    sortDirection, 
    setSortDirection 
  } = useLibraryStore();

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'title', label: 'Название' },
    { value: 'author', label: 'Автор' },
    { value: 'genre', label: 'Жанр' },
    { value: 'dateAdded', label: 'Дата добавления' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 sticky top-0 bg-gray-100 dark:bg-gray-900 py-4 z-10">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по названию, автору или жанру..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
        />
      </div>
      
      <div className="flex gap-2 items-center">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              Сортировать по {option.label}
            </option>
          ))}
        </select>
        
        <button
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          className={`p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
            sortDirection === 'desc' ? 'rotate-180' : ''
          }`}
          title={sortDirection === 'asc' ? 'По возрастанию' : 'По убыванию'}
        >
          <ArrowUpDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    </div>
  );
};