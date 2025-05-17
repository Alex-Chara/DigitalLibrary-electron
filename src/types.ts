export interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  file_path: string;
  format: 'epub' | 'pdf' | 'mobi';
  current_page: number;
  total_pages: number;
  last_read_at: string;
  created_at: string;
  updated_at: string;
  bookmarks?: Bookmark[];
  reading_stats?: ReadingStat[];
  genre?: string;
  notes: Note[];
}

export interface Bookmark {
  id: string;
  book_id: string;
  page: number;
  note?: string;
  created_at: string;
}

export interface ReadingStat {
  book_id: string;
  pages_read: number;
  time_spent: string;
  date: string;
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
  isLoading: boolean;
  error: string | null;
  initializeStore: () => Promise<void>;
  addBook: (book: Omit<Book, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  removeBook: (bookId: string) => Promise<void>;
  updateBookProgress: (bookId: string, currentPage: number, totalPages: number) => Promise<void>;
  addBookmark: (bookId: string, page: number, note?: string) => Promise<void>;
  removeBookmark: (bookId: string, bookmarkId: string) => Promise<void>;
  setView: (view: 'grid' | 'list') => void;
  setTheme: (theme: 'light' | 'dark' | 'sepia') => void;
  setSelectedBook: (book: Book | undefined) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: SortOption) => void;
  setSortDirection: (direction: SortDirection) => void;
}