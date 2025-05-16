export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  format: 'epub' | 'pdf' | 'mobi';
  dateAdded: Date;
  lastRead?: Date;
  progress: number;
  scale: number;
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
  updateBookProgress: (bookId: string, progress: number) => void;
  updateBookScale: (bookId: string, scale: number) => void;
  setView: (view: 'grid' | 'list') => void;
  setTheme: (theme: 'light' | 'dark' | 'sepia') => void;
  setSelectedBook: (book: Book | undefined) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: SortOption) => void;
  setSortDirection: (direction: SortDirection) => void;
  addNote: (bookId: string, note: Omit<Note, 'id' | 'createdAt'>) => void;
  removeNote: (bookId: string, noteId: string) => void;
  editNote: (bookId: string, noteId: string, content: string) => void;
}