import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from './components/Header';
import { BookGrid } from './components/BookGrid';
import { useLibraryStore } from './store';

function App() {
  const { theme, selectedBook } = useLibraryStore();
  
  return (
    <BrowserRouter>
      <div className={`min-h-screen ${
        selectedBook
          ? (theme === 'dark' ? 'dark bg-gray-900' : theme === 'sepia' ? 'bg-amber-50' : 'bg-white')
          : (theme === 'dark' ? 'dark bg-gray-900' : theme === 'sepia' ? 'bg-amber-50' : 'bg-gray-100')
      }`}>
        {!selectedBook && <Header />}
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${!selectedBook ? 'pt-24' : ''}`}>
          <BookGrid />
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;