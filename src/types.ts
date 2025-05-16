export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  format: 'epub' | 'pdf' | 'mobi';
  dateAdded: Date;
  lastRead?: Date;
  progress: number;
  lastLocation?: string | null;
  tags: string[];
  file: string;
  genre?: string;
  notes: Note[];
}

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  location?: string;
}

export type SortOption = 'title' | 'author' | 'dateAdded' | 'genre';
export type SortDirection = 'asc' | 'desc';

export interface LibraryState {
  books: Book[];
  view: 'grid' | 'list';
  theme: 'light' | 'dark' | 'sepia';
  selectedBook?: Book;
  searchQuery: string;
  sortBy: SortOption;
  sortDirection: SortDirection;
  addBook: (book: Book) => void;
  removeBook: (bookId: string) => void;
  setView: (view: 'grid' | 'list') => void;
  setTheme: (theme: 'light' | 'dark' | 'sepia') => void;
  setSelectedBook: (book: Book | undefined) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: SortOption) => void;
  setSortDirection: (direction: SortDirection) => void;
  updateBookProgress: (bookId: string, progress: number, lastLocation?: string | null) => void;
  addNote: (bookId: string, note: Omit<Note, 'id' | 'createdAt'>) => void;
  removeNote: (bookId: string, noteId: string) => void;
  editNote: (bookId: string, noteId: string, content: string) => void;
}