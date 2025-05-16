import React, { useEffect, useRef, useState } from 'react';
import { Book, Note } from '../types';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Settings, BookOpen, Bookmark, X, StickyNote, Trash2, Pencil, Check } from 'lucide-react';
import { ReactReader } from 'react-reader';
import { renderPdf } from '../utils/readers';
import { useLibraryStore } from '../store';
import { useNavigate } from 'react-router-dom';

interface ReaderProps {
  book: Book;
  onClose: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <span className="font-medium dark:text-white">{title}</span>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800">
          {children}
        </div>
      )}
    </div>
  );
};

const fontFamilies = [
  { name: 'Системный', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { name: 'Антиква', value: 'Georgia, "Times New Roman", serif' },
  { name: 'Гротеск', value: 'Arial, Helvetica, sans-serif' },
  { name: 'Моноширинный', value: '"Courier New", Courier, monospace' },
];

const baseFontSize = 16;

export const Reader: React.FC<ReaderProps> = ({ book, onClose }) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [location, setLocation] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(100);
  const [fontFamily, setFontFamily] = useState(fontFamilies[0].value);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [tocItems, setTocItems] = useState<any[]>([]);
  const [epubFile, setEpubFile] = useState<ArrayBuffer | null>(null);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingInlineNoteId, setEditingInlineNoteId] = useState<string | null>(null);
  const [inlineNoteContent, setInlineNoteContent] = useState('');
  const { theme, addNote, removeNote, editNote } = useLibraryStore();

  useEffect(() => {
    if (book.format === 'epub') {
      fetch(book.file)
        .then(response => response.arrayBuffer())
        .then(buffer => setEpubFile(buffer))
        .catch(error => console.error('Ошибка загрузки EPUB:', error));
    }
  }, [book]);

  useEffect(() => {
    if (!containerRef.current || book.format === 'epub') return;

    const initReader = async () => {
      try {
        const { total } = await renderPdf(book.file, containerRef.current!, currentPage);
        setTotalPages(total);
      } catch (error) {
        console.error('Ошибка инициализации:', error);
      }
    };

    initReader();
  }, [book, currentPage]);

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (book.format === 'pdf') {
      if (direction === 'prev' && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else if (direction === 'next' && currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    } else if (book.format === 'epub' && renditionRef.current) {
      if (direction === 'prev') {
        renditionRef.current.prev();
      } else {
        renditionRef.current.next();
      }
    }
  };

  const toggleBookmark = () => {
    setBookmarks(prev => 
      prev.includes(currentPage)
        ? prev.filter(page => page !== currentPage)
        : [...prev, currentPage].sort((a, b) => a - b)
    );
  };

  const handleLocationChanged = (loc: string) => {
    // Validate location before processing
    if (!loc || typeof loc !== 'string') {
      console.warn('Invalid location received:', loc);
      return;
    }

    try {
      setLocation(loc);
      
      if (renditionRef.current?.book) {
        const locations = renditionRef.current.book.locations;
        if (locations?.length() > 0) {
          const currentLocation = locations.locationFromCfi(loc);
          const totalLocations = locations.length();
          if (typeof currentLocation === 'number' && typeof totalLocations === 'number') {
            setCurrentPage(Math.ceil((currentLocation / totalLocations) * 100));
            setTotalPages(100);
          }
        }
      }
    } catch (error) {
      console.error('Error processing location:', error);
      // Don't update state if there's an error
    }
  };

  const getRendition = (rendition: any) => {
    renditionRef.current = rendition;
    
    const isDark = theme === 'dark';
    const isSepia = theme === 'sepia';
    
    rendition.themes.default({
      '::selection': {
        'background': isDark ? 'rgba(147, 197, 253, 0.3)' : 'rgba(0, 0, 255, 0.2)'
      },
      'body': {
        'font-family': fontFamily,
        'font-size': `${Math.round(baseFontSize * (fontSize / 100))}px`,
        'line-height': lineHeight,
        'padding': '0 20px',
        'margin': '0 auto',
        'max-width': '800px',
        'background-color': isDark ? '#1f2937' : isSepia ? '#fef3c7' : '#ffffff',
        'color': isDark ? '#e5e7eb' : isSepia ? '#78350f' : '#111827'
      },
      'p': {
        'margin': '1em 0'
      },
      'a': {
        'color': isDark ? '#60a5fa' : '#2563eb',
        'text-decoration': 'none'
      },
      'a:hover': {
        'text-decoration': 'underline'
      },
      'h1, h2, h3, h4, h5, h6': {
        'color': isDark ? '#f3f4f6' : isSepia ? '#92400e' : '#111827'
      }
    });

    rendition.on('started', () => {
      rendition.book.ready.then(() => {
        rendition.book.locations.generate().then(() => {
          if (location) {
            try {
              rendition.display(location);
            } catch (error) {
              console.error('Error displaying location:', error);
              // Reset location if invalid
              setLocation(null);
            }
          }
        });
      });
    });

    rendition.on('relocated', (location: any) => {
      try {
        if (location?.start?.cfi && rendition.book.locations.length() > 0) {
          const currentLocation = rendition.book.locations.locationFromCfi(location.start.cfi);
          const totalLocations = rendition.book.locations.length();
          if (typeof currentLocation === 'number' && typeof totalLocations === 'number') {
            setCurrentPage(Math.ceil((currentLocation / totalLocations) * 100));
            setTotalPages(100);
          }
        }
      } catch (error) {
        console.error('Error handling relocation:', error);
      }
    });

    rendition.book.loaded.navigation.then((toc: any) => {
      setTocItems(toc.toc);
    });
  };

  useEffect(() => {
    if (renditionRef.current) {
      const isDark = theme === 'dark';
      const isSepia = theme === 'sepia';
      
      renditionRef.current.themes.default({
        'body': {
          'font-family': fontFamily,
          'font-size': `${Math.round(baseFontSize * (fontSize / 100))}px`,
          'line-height': lineHeight,
          'background-color': isDark ? '#1f2937' : isSepia ? '#fef3c7' : '#ffffff',
          'color': isDark ? '#e5e7eb' : isSepia ? '#78350f' : '#111827'
        },
        'h1, h2, h3, h4, h5, h6': {
          'color': isDark ? '#f3f4f6' : isSepia ? '#92400e' : '#111827'
        }
      });
    }
  }, [fontSize, fontFamily, lineHeight, theme]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleLibraryClick = () => {
    navigate('/');
    onClose();
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      if (editingNoteId) {
        editNote(book.id, editingNoteId, newNote.trim());
        setEditingNoteId(null);
      } else {
        addNote(book.id, {
          content: newNote.trim(),
          location: `Страница ${currentPage}`
        });
      }
      setNewNote('');
    }
  };

  const startEditingInlineNote = (note: Note) => {
    setEditingInlineNoteId(note.id);
    setInlineNoteContent(note.content);
  };

  const saveInlineNote = (noteId: string) => {
    if (inlineNoteContent.trim()) {
      editNote(book.id, noteId, inlineNoteContent.trim());
      setEditingInlineNoteId(null);
      setInlineNoteContent('');
    }
  };

  const cancelInlineEditing = () => {
    setEditingInlineNoteId(null);
    setInlineNoteContent('');
  };

  const cancelEditingNote = () => {
    setNewNote('');
    setEditingNoteId(null);
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[100] flex">
      {/* Sidebar */}
      <div className={`w-72 bg-white dark:bg-gray-800 border-r dark:border-gray-700 transform transition-transform ${
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      } absolute top-0 left-0 bottom-0 z-20 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold dark:text-white">Настройки</h3>
          <button
            onClick={() => setShowSidebar(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <CollapsibleSection title="Настройки чтения">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Размер шрифта</label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(baseFontSize * (fontSize / 100))}px
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Шрифт</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {fontFamilies.map((font) => (
                    <option key={font.name} value={font.value}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Межстрочный интервал</label>
                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 dark:text-gray-400">{lineHeight.toFixed(1)}</div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Оглавление">
            {tocItems.length > 0 ? (
              <ul className="space-y-2">
                {tocItems.map((item, index) => (
                  <li key={index}>
                    <button
                      onClick={() => renditionRef.current?.display(item.href)}
                      className="text-sm hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Оглавление недоступно
              </p>
            )}
          </CollapsibleSection>
        </div>
      </div>

      {/* Bookmarks Panel */}
      <div className={`w-72 bg-white dark:bg-gray-800 border-r dark:border-gray-700 transform transition-transform ${
        showBookmarks ? 'translate-x-0' : '-translate-x-full'
      } absolute top-0 left-0 bottom-0 z-20 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold dark:text-white">Закладки</h3>
          <button
            onClick={() => setShowBookmarks(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <button
            onClick={toggleBookmark}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 mb-4 flex items-center justify-center gap-2"
          >
            <Bookmark className="w-5 h-5" />
            <span>Добавить закладку</span>
          </button>
          
          {bookmarks.length > 0 ? (
            <div className="space-y-2">
              {bookmarks.map(page => (
                <div key={page} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <button
                    onClick={() => setCurrentPage(page)}
                    className="text-sm text-gray-900 dark:text-white"
                  >
                    Страница {page}
                  </button>
                  <button
                    onClick={() => setBookmarks(prev => prev.filter(p => p !== page))}
                    className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Нажмите на кнопку выше, чтобы добавить новую закладку.
            </p>
          )}
        </div>
      </div>

      {/* Notes Panel */}
      <div className={`w-72 bg-white dark:bg-gray-800 border-l dark:border-gray-700 transform transition-transform ${
        showNotes ? 'translate-x-0' : 'translate-x-full'
      } absolute top-0 right-0 bottom-0 z-20 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold dark:text-white">Заметки</h3>
          <button
            onClick={() => setShowNotes(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Добавить заметку..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent resize-none"
                rows={3}
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="self-end px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Добавить
              </button>
            </div>
            {book.notes && book.notes.length > 0 ? (
              <div className="space-y-3">
                {book.notes.map((note) => (
                  note && (
                    <div key={note.id} className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-400 dark:border-gray-500">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {formatDate(new Date(note.createdAt))}
                      </div>
                      {editingInlineNoteId === note.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={inlineNoteContent}
                            onChange={(e) => setInlineNoteContent(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => cancelInlineEditing()}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                              title="Отменить"
                            >
                              <X className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => saveInlineNote(note.id)}
                              className="p-1 text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"
                              title="Сохранить"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {note && note.content ? note.content : ''}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditingInlineNote(note)}
                              className="text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-emerald-400"
                              title="Редактировать"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeNote(book.id, note.id)}
                              className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      {note.location && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {note.location}
                        </p>
                      )}
                    </div>
                  )
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Заметок пока нет</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLibraryClick}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Вернуться в библиотеку"
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-sm">Библиотека</span>
            </button>
            <button
              onClick={() => setShowBookmarks(!showBookmarks)}
              className={`flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg ${
                bookmarks.includes(currentPage) ? 'text-emerald-600 dark:text-emerald-400' : ''
              }`}
              title="Закладки"
            >
              <Bookmark className="w-5 h-5" />
              <span className="text-sm">Закладки</span>
            </button>
            <button
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Настройки"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm">Настройки</span>
            </button>
            <button
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative"
              title="Заметки"
              onClick={() => setShowNotes(!showNotes)}
            >
              <StickyNote className="w-5 h-5" />
              <span className="text-sm">Заметки</span>
              {book.notes && book.notes.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {book.notes.length}
                </span>
              )}
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Страница {currentPage} из {totalPages}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          {book.format === 'epub' && epubFile ? (
            <div style={{ position: 'relative', height: '100%' }}>
              <ReactReader
                location={location || undefined}
                locationChanged={handleLocationChanged}
                url={epubFile}
                getRendition={getRendition}
                epubOptions={{
                  flow: "paginated",
                  manager: "default"
                }}
                swipeable
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
                <button
                  onClick={() => handlePageChange('prev')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Предыдущая страница"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm dark:text-white">
                  Страница {currentPage} из {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange('next')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Следующая страница"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : book.format === 'pdf' ? (
            <>
              <div 
                ref={containerRef} 
                className="h-full"
                style={{ fontSize: `${Math.round(baseFontSize * (fontSize / 100))}px` }}
              />
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
                <button
                  onClick={() => handlePageChange('prev')}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                  title="Предыдущая страница"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <span className="text-sm dark:text-white">
                  Страница {currentPage} из {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange('next')}
                  disabled={currentPage === totalPages}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                  title="Следующая страница"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">Загрузка...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};