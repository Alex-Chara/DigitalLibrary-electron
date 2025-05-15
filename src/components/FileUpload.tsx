import React, { useCallback } from 'react';
import { Upload, Folder } from 'lucide-react';
import { useLibraryStore } from '../store';
import { processEpub, processPdf } from '../utils/fileProcessors';
import * as PDFJS from 'pdfjs-dist';

PDFJS.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;

export const FileUpload: React.FC = () => {
  const { addBook } = useLibraryStore();

  const processFiles = async (files: FileList) => {
    for (const file of files) {
      try {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        let bookData;
        
        if (fileExtension === 'epub') {
          bookData = await processEpub(file);
        } else if (fileExtension === 'pdf') {
          bookData = await processPdf(file);
        } else {
          continue;
        }

        if (bookData) {
          addBook(bookData);
        }
      } catch (error) {
        console.error('Ошибка обработки файла:', error);
        alert(`Ошибка обработки ${file.name}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      }
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    await processFiles(files);
    event.target.value = '';
  }, [addBook]);

  const handleFolderUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    await processFiles(files);
    event.target.value = '';
  }, [addBook]);

  return (
    <div className="flex gap-2">
      <div className="relative">
        <input
          type="file"
          accept=".epub,.pdf"
          multiple
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <Upload className="w-5 h-5" />
          <span>Импорт файлов</span>
        </button>
      </div>

      <div className="relative">
        <input
          type="file"
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFolderUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <Folder className="w-5 h-5" />
          <span>Импорт папки</span>
        </button>
      </div>
    </div>
  );
};