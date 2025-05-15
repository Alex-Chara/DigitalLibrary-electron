import React from 'react';
import { useLibraryStore, useFilteredBooks } from '../store';
import { Book as BookIcon, Trash2 } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { Reader } from './Reader';
import { SearchAndSort } from './SearchAndSort';

export const BookGrid: React.FC = () => {
  const { view, selectedBook, setSelectedBook, removeBook } = useLibraryStore();
  const filteredBooks = useFilteredBooks();

  const handleDelete = (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите удалить эту книгу из библиотеки?')) {
      removeBook(bookId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Ваша библиотека ({filteredBooks.length} книг)
        </h2>
        <FileUpload />
      </div>

      <SearchAndSort />

      {filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)] text-gray-500 dark:text-gray-400">
          <BookIcon className="w-16 h-16 mb-4" />
          {useLibraryStore.getState().books.length === 0 ? (
            <>
              <p className="text-xl">Ваша библиотека пуста</p>
              <p className="mt-2 mb-4">Импортируйте книги, чтобы начать</p>
              <p className="text-sm mb-4">Вы можете импортировать отдельные файлы или целые папки</p>
            </>
          ) : (
            <>
              <p className="text-xl">Книги не найдены</p>
              <p className="mt-2">Попробуйте изменить параметры поиска или фильтры</p>
            </>
          )}
        </div>
      ) : (
        <div className={view === 'grid' ? 'grid-view' : 'list-view'}>
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer group"
              onClick={() => setSelectedBook(book)}
            >
              {view === 'grid' ? (
                <div className="aspect-[2/3] relative">
                  {book.cover ? (
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                      <BookIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <h3 className="text-white font-semibold truncate">{book.title}</h3>
                    <p className="text-gray-200 text-sm truncate">{book.author}</p>
                    {book.genre && (
                      <p className="text-gray-300 text-xs truncate mt-1">{book.genre}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, book.id)}
                    className="absolute top-2 right-2 p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Удалить книгу"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center p-4 gap-6">
                  <div className="flex-shrink-0 w-16 h-24 relative">
                    {book.cover ? (
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
                        <BookIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-1">
                      {book.author}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {book.format.toUpperCase()}
                      </span>
                      {book.genre && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            {book.genre}
                          </span>
                        </>
                      )}
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        Добавлено {new Date(book.dateAdded).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, book.id)}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                    title="Удалить книгу"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedBook && (
        <Reader book={selectedBook} onClose={() => setSelectedBook(undefined)} />
      )}
    </div>
  );
};