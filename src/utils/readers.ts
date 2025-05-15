import * as PDFJS from 'pdfjs-dist';
import ePub from 'epubjs';

// Set up PDF.js worker
PDFJS.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export async function renderEpub(
  fileUrl: string,
  container: HTMLDivElement,
  currentPage: number
): Promise<{ total: number }> {
  // Create a new book instance
  const book = ePub(fileUrl);
  
  // Create rendition with dynamic sizing
  const rendition = book.renderTo(container, {
    width: '100%',
    height: '100%',
    spread: 'none',
    flow: 'paginated',
    minSpreadWidth: 800,
  });

  // Set up event listeners for content
  rendition.hooks.content.register((contents: any) => {
    // Add text selection and copy support
    contents.window.addEventListener('mouseup', () => {
      const selection = contents.window.getSelection();
      if (selection && selection.toString().length > 0) {
        // Handle text selection
        console.log('Selected text:', selection.toString());
      }
    });
  });

  // Display the current page (EPUB uses 0-based indexing)
  await rendition.display(currentPage - 1);

  // Generate locations for better page tracking
  await book.ready;
  
  if (!book.locations.length()) {
    await book.locations.generate(1024);
  }

  // Get total pages
  const total = book.locations.length();

  // Set up keyboard navigation
  rendition.on('keyup', (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      rendition.prev();
    }
    if (event.key === 'ArrowRight') {
      rendition.next();
    }
  });

  // Enable text selection
  container.style.userSelect = 'text';
  container.style.webkitUserSelect = 'text';

  return { total };
}

// Cache for PDF documents
const pdfCache = new Map<string, PDFJS.PDFDocumentProxy>();

export async function renderPdf(
  fileUrl: string,
  container: HTMLDivElement,
  currentPage: number
): Promise<{ total: number }> {
  try {
    // Clear container
    container.innerHTML = '';

    // Create a wrapper for the page
    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'pdf-page-wrapper';
    pageWrapper.style.cssText = 'height: 100%; width: 100%; display: flex; align-items: center; justify-content: center; position: relative;';
    container.appendChild(pageWrapper);

    // Get cached PDF document or load new one
    let pdf = pdfCache.get(fileUrl);
    if (!pdf) {
      const loadingTask = PDFJS.getDocument(fileUrl);
      pdf = await loadingTask.promise;
      pdfCache.set(fileUrl, pdf);
    }
    
    const total = pdf.numPages;

    // Get the page
    const page = await pdf.getPage(currentPage);
    const viewport = page.getViewport({ scale: 1.0 });

    // Create canvas with device pixel ratio consideration
    const canvas = document.createElement('canvas');
    canvas.className = 'pdf-page';
    const pixelRatio = window.devicePixelRatio || 1;
    const scaledViewport = page.getViewport({ scale: pixelRatio });
    
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    
    pageWrapper.appendChild(canvas);

    // Use a high-performance canvas context
    const context = canvas.getContext('2d', {
      alpha: false,
      willReadFrequently: false
    });

    if (!context) {
      throw new Error('Could not get canvas context');
    }

    // Render the page with optimized settings
    await page.render({
      canvasContext: context,
      viewport: scaledViewport,
      enableWebGL: true,
      renderInteractiveForms: false
    }).promise;

    // Create text layer with optimized rendering
    const textContent = await page.getTextContent();
    const textLayer = document.createElement('div');
    textLayer.className = 'pdf-text-layer';
    textLayer.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: ${viewport.width}px;
      height: ${viewport.height}px;
      user-select: text;
      pointer-events: auto;
    `;
    pageWrapper.appendChild(textLayer);

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Batch text layer rendering
    textContent.items.forEach((item: any) => {
      const tx = PDFJS.Util.transform(
        PDFJS.Util.transform(viewport.transform, item.transform),
        [1, 0, 0, -1, 0, 0]
      );

      const textDiv = document.createElement('div');
      textDiv.style.cssText = `
        position: absolute;
        left: ${tx[4]}px;
        top: ${tx[5]}px;
        font-size: ${Math.sqrt((tx[0] * tx[0]) + (tx[1] * tx[1])) * 100}%;
        font-family: ${textContent.styles[item.fontName]?.fontFamily || 'sans-serif'};
      `;
      textDiv.textContent = item.str;
      fragment.appendChild(textDiv);
    });

    // Append all text elements at once
    textLayer.appendChild(fragment);

    return { total };
  } catch (error) {
    console.error('Error rendering PDF:', error);
    throw error;
  }
}