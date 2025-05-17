import { create } from 'zustand';
import { LibraryState, SortOption, Book, Note } from './types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './lib/supabase';

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  view: 'grid',
  theme: 'light',
  selectedBook: undefined,
  searchQuery: '',
  sortBy: 'title',
  sortDirection: 'asc',
  isLoading: true,
  error: null,

  initializeStore: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: books, error } = await supabase
        .from('books')
        .select(`
          *,
          bookmarks (
            id,
            page,
            note,
            created_at
          ),
          reading_stats (
            pages_read,
            time_spent,
            date
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      set({ books: books || [], isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load books', isLoading: false });
    }
  },

  addBook: async (book) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('books')
        .insert([{
          ...book,
          user_id: user.id,
          current_page: 1,
          total_pages: 0
        }])
        .select()
        .single();

      if (error) throw error;
      
      set((state) => ({ books: [...state.books, data] }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add book' });
    }
  },

  removeBook: async (bookId) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      set((state) => ({
        books: state.books.filter((book) => book.id !== bookId),
        selectedBook: state.selectedBook?.id === bookId ? undefined : state.selectedBook,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to remove book' });
    }
  },

  updateBookProgress: async (bookId: string, currentPage: number, totalPages: number) => {
    try {
      const { error } = await supabase
        .from('books')
        .update({
          current_page: currentPage,
          total_pages: totalPages,
          last_read_at: new Date().toISOString()
        })
        .eq('id', bookId);

      if (error) throw error;

      set((state) => ({
        books: state.books.map((book) =>
          book.id === bookId
            ? { ...book, current_page: currentPage, total_pages: totalPages }
            : book
        ),
        selectedBook: state.selectedBook?.id === bookId
          ? { ...state.selectedBook, current_page: currentPage, total_pages: totalPages }
          : state.selectedBook
      }));

      // Update reading stats
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase.from('reading_stats').upsert({
        book_id: bookId,
        user_id: user.id,
        pages_read: currentPage,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update book progress' });
    }
  },

  addBookmark: async (bookId: string, page: number, note?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          book_id: bookId,
          user_id: user.id,
          page,
          note
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        books: state.books.map((book) =>
          book.id === bookId
            ? { ...book, bookmarks: [...(book.bookmarks || []), data] }
            : book
        ),
        selectedBook: state.selectedBook?.id === bookId
          ? { ...state.selectedBook, bookmarks: [...(state.selectedBook.bookmarks || []), data] }
          : state.selectedBook
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add bookmark' });
    }
  },

  removeBookmark: async (bookId: string, bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;

      set((state) => ({
        books: state.books.map((book) =>
          book.id === bookId
            ? { ...book, bookmarks: book.bookmarks?.filter((b) => b.id !== bookmarkId) }
            : book
        ),
        selectedBook: state.selectedBook?.id === bookId
          ? { ...state.selectedBook, bookmarks: state.selectedBook.bookmarks?.filter((b) => b.id !== bookmarkId) }
          : state.selectedBook
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to remove bookmark' });
    }
  },

  setView: (view) => set({ view }),
  setTheme: (theme) => set({ theme }),
  setSelectedBook: (book) => set({ selectedBook: book }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortDirection: (direction) => set({ sortDirection }),
}));

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