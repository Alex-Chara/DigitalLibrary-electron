import { create } from 'zustand';
import { LibraryState, SortOption, Book, Note } from './types';
import { v4 as uuidv4 } from 'uuid';
import { persist } from 'zustand/middleware';

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      books: [],
      view: 'grid',
      theme: 'light',
      selectedBook: undefined,
      searchQuery: '',
      sortBy: 'title',
      sortDirection: 'asc',
      addBook: (book) => set((state) => {
        const exists = state.books.some(
          (existingBook) => existingBook.title === book.title && existingBook.author === book.author
        );
        
        if (exists) {
          alert(`"${book.title}" is already in your library`);
          return state;
        }
        
        return { books: [...state.books, { ...book, notes: [], progress: 0, scale: 1 }] };
      }),
      removeBook: (bookId) => set((state) => ({
        books: state.books.filter((book) => book.id !== bookId),
        selectedBook: state.selectedBook?.id === bookId ? undefined : state.selectedBook,
      })),
      updateBookProgress: (bookId: string, progress: number) => set((state) => ({
        books: state.books.map((book) =>
          book.id === bookId ? { ...book, progress, lastRead: new Date() } : book
        ),
        selectedBook: state.selectedBook?.id === bookId
          ? { ...state.selectedBook, progress, lastRead: new Date() }
          : state.selectedBook
      })),
      updateBookScale: (bookId: string, scale: number) => set((state) => ({
        books: state.books.map((book) =>
          book.id === bookId ? { ...book, scale } : book
        ),
        selectedBook: state.selectedBook?.id === bookId
          ? { ...state.selectedBook, scale }
          : state.selectedBook
      })),
      setView: (view) => set({ view }),
      setTheme: (theme) => set({ theme }),
      setSelectedBook: (book) => set({ selectedBook: book }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortDirection: (direction) => set({ sortDirection }),
      addNote: (bookId, note) => set((state) => ({
        books: state.books.map((book) => 
          book.id === bookId
            ? {
                ...book,
                notes: [...book.notes, {
                  ...note,
                  id: uuidv4(),
                  createdAt: new Date()
                }]
              }
            : book
        ),
        selectedBook: state.selectedBook?.id === bookId
          ? {
              ...state.selectedBook,
              notes: [...state.selectedBook.notes, {
                ...note,
                id: uuidv4(),
                createdAt: new Date()
              }]
            }
          : state.selectedBook
      })),
      removeNote: (bookId, noteId) => set((state) => ({
        books: state.books.map((book) =>
          book.id === bookId
            ? { ...book, notes: book.notes.filter((note) => note.id !== noteId) }
            : book
        ),
        selectedBook: state.selectedBook?.id === bookId
          ? {
              ...state.selectedBook,
              notes: state.selectedBook.notes.filter((note) => note.id !== noteId)
            }
          : state.selectedBook
      })),
      editNote: (bookId, noteId, content) => set((state) => ({
        books: state.books.map((book) =>
          book.id === bookId
            ? {
                ...book,
                notes: book.notes.map((note) =>
                  note.id === noteId
                    ? { ...note, content }
                    : note
                )
              }
            : book
        ),
        selectedBook: state.selectedBook?.id === bookId
          ? {
              ...state.selectedBook,
              notes: state.selectedBook.notes.map((note) =>
                note.id === noteId
                  ? { ...note, content }
                  : note
              )
            }
          : state.selectedBook
      }))
    }),
    {
      name: 'library-storage',
      skipHydration: true,
    }
  )
);

export const useFilteredBooks = () => {
  const { books, searchQuery, sortBy, sortDirection } = useLibraryStore();
  
  const filteredBooks = books.filter((book) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const titleMatch = book.title.toLowerCase().includes(query);
    const authorMatch = book.author.toLowerCase().includes(query);
    const genreMatch = book.genre?.toLowerCase().includes(query) ?? false;
    
    return titleMatch || authorMatch || genreMatch;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'author':
        comparison = a.author.localeCompare(b.author);
        break;
      case 'genre':
        comparison = (a.genre ?? '').localeCompare(b.genre ?? '');
        break;
      case 'dateAdded':
        comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return sortedBooks;
};