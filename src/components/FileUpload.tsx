import React, { useCallback } from 'react';
import { Upload, Folder } from 'lucide-react';
import { useLibraryStore } from '../store';
import { processEpub, processPdf } from '../utils/fileProcessors';
import * as PDFJS from 'pdfjs-dist';

const { ipcRenderer } = window.require('electron');

PDFJS.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;

export const FileUpload: React.FC = () => {
  const { addBook } = useLibraryStore();

  const processFiles = async (filePaths: string[]) => {
    for (const filePath of filePaths) {
      try {
        const fileExtension = filePath.split('.').pop()?.toLowerCase();
        let bookData;
        
        if (fileExtension === 'epub') {
          bookData = await processEpub(filePath);
        } else if (fileExtension === 'pdf') {
          bookData = await processPdf(filePath);
        } else {
          continue;
        }

        if (bookData) {
          addBook(bookData);
        }
      } catch (error) {
        console.error('Error processing file:', error);
        alert(`Error processing ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleFileUpload = useCallback(async () => {
    const filePaths = await ipcRenderer.invoke('open-file-dialog');
    if (filePaths.length > 0) {
      await processFiles(filePaths);
    }
  }, [addBook]);

  const handleFolderUpload = useCallback(async () => {
    const folderPaths = await ipcRenderer.invoke('open-folder-dialog');
    if (folderPaths.length > 0) {
      // Process all files in the selected folder
      const filePaths = await ipcRenderer.invoke('get-files-in-folder', folderPaths[0]);
      await processFiles(filePaths);
    }
  }, [addBook]);

  return (
    <div className="flex gap-2">
      <button
        onClick={handleFileUpload}
        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Upload className="w-5 h-5" />
        <span>Import Files</span>
      </button>

      <button
        onClick={handleFolderUpload}
        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Folder className="w-5 h-5" />
        <span>Import Folder</span>
      </button>
    </div>
  );
};