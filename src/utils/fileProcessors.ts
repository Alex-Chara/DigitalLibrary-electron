import { v4 as uuidv4 } from 'uuid';
import { Book } from '../types';
import * as PDFJS from 'pdfjs-dist';
import ePub from 'epubjs';
const fs = window.require('fs');
const path = window.require('path');

PDFJS.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export async function processEpub(filePath: string): Promise<Book> {
  return new Promise((resolve, reject) => {
    try {
      const buffer = fs.readFileSync(filePath);
      const book = ePub(buffer);
      
      book.loaded.metadata.then(async () => {
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
          file: filePath,
          notes: []
        };

        resolve(bookData);
      }).catch(reject);
    } catch (error) {
      reject(new Error(`Error processing EPUB file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

export async function processPdf(filePath: string): Promise<Book> {
  try {
    const buffer = fs.readFileSync(filePath);
    const pdf = await PDFJS.getDocument(new Uint8Array(buffer)).promise;
    const metadata = await pdf.getMetadata().catch(() => ({}));
    
    const firstPage = await pdf.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1.0 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await firstPage.render({
      canvasContext: context!,
      viewport: viewport
    }).promise;
    
    const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.5);

    const book: Book = {
      id: uuidv4(),
      title: metadata?.info?.Title || path.basename(filePath, '.pdf'),
      author: metadata?.info?.Author || 'Unknown Author',
      cover: thumbnailUrl,
      format: 'pdf',
      dateAdded: new Date(),
      progress: 0,
      tags: [],
      file: filePath,
      notes: []
    };

    return book;
  } catch (error) {
    throw new Error(`Error processing PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}