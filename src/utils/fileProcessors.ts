import { v4 as uuidv4 } from 'uuid';
import { Book } from '../types';
import * as PDFJS from 'pdfjs-dist';
import ePub from 'epubjs';

// Set up PDF.js worker
PDFJS.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export async function processEpub(file: File): Promise<Book> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const book = ePub(buffer);
        
        await book.loaded.metadata;
        const metadata = book.package.metadata;
        const coverUrl = await book.coverUrl();

        const bookData: Book = {
          id: uuidv4(),
          title: metadata.title || 'Unknown Title',
          author: metadata.creator || 'Unknown Author',
          cover: coverUrl || '',
          format: 'epub',
          dateAdded: new Date(),
          progress: 0,
          tags: [],
          file: URL.createObjectURL(file)
        };

        resolve(bookData);
      } catch (error) {
        reject(new Error(`Error processing EPUB file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => reject(new Error('Error reading EPUB file'));
    reader.readAsArrayBuffer(file);
  });
}

export async function processPdf(file: File): Promise<Book> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
    const metadata = await pdf.getMetadata().catch(() => ({}));
    
    // Get the first page for thumbnail
    const firstPage = await pdf.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1.0 });
    
    // Create canvas for thumbnail
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await firstPage.render({
      canvasContext: context!,
      viewport: viewport
    }).promise;
    
    // Generate thumbnail URL
    const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.5);

    const book: Book = {
      id: uuidv4(),
      title: metadata?.info?.Title || file.name.replace('.pdf', ''),
      author: metadata?.info?.Author || 'Unknown Author',
      cover: thumbnailUrl,
      format: 'pdf',
      dateAdded: new Date(),
      progress: 0,
      tags: [],
      file: URL.createObjectURL(file)
    };

    return book;
  } catch (error) {
    throw new Error(`Error processing PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}