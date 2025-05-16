import * as PDFJS from 'pdfjs-dist';
import ePub from 'epubjs';

PDFJS.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export async function renderEpub(
  fileUrl: string,
  container: HTMLDivElement,
  currentPage: number
): Promise<{ total: number }> {
  const book = ePub(fileUrl);
  
  const rendition = book.renderTo(container, {
    width: '100%',
    height: '100%',
    spread: 'none',
    flow: 'paginated',
    minSpreadWidth: 800,
  });

  rendition.hooks.content.register((contents: any) => {
    contents.window.addEventListener('mouseup', () => {
      const selection = contents.window.getSelection();
      if (selection && selection.toString().length > 0) {
        console.log('Selected text:', selection.toString());
      }
    });
  });

  await rendition.display(currentPage - 1);
  await book.ready;
  
  if (!book.locations.length()) {
    await book.locations.generate(1024);
  }

  const total = book.locations.length();

  rendition.on('keyup', (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      rendition.prev();
    }
    if (event.key === 'ArrowRight') {
      rendition.next();
    }
  });

  container.style.userSelect = 'text';
  container.style.webkitUserSelect = 'text';

  return { total };
}

const pdfCache = new Map<string, PDFJS.PDFDocumentProxy>();

export async function renderPdf(
  fileUrl: string,
  container: HTMLDivElement,
  currentPage: number,
  scale: number = 1.0
): Promise<{ total: number }> {
  try {
    container.innerHTML = '';

    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'pdf-page-wrapper';
    pageWrapper.style.cssText = 'height: 100%; width: 100%; display: flex; align-items: center; justify-content: center; position: relative; overflow: auto;';
    container.appendChild(pageWrapper);

    let pdf = pdfCache.get(fileUrl);
    if (!pdf) {
      const loadingTask = PDFJS.getDocument(fileUrl);
      pdf = await loadingTask.promise;
      pdfCache.set(fileUrl, pdf);
    }
    
    const total = pdf.numPages;
    const page = await pdf.getPage(currentPage);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.className = 'pdf-page';
    const pixelRatio = window.devicePixelRatio || 1;
    const scaledViewport = page.getViewport({ scale: scale * pixelRatio });
    
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    
    pageWrapper.appendChild(canvas);

    const context = canvas.getContext('2d', {
      alpha: false,
      willReadFrequently: false
    });

    if (!context) {
      throw new Error('Could not get canvas context');
    }

    await page.render({
      canvasContext: context,
      viewport: scaledViewport,
      enableWebGL: true,
      renderInteractiveForms: false
    }).promise;

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
      transform: scale(${scale});
      transform-origin: top left;
    `;
    pageWrapper.appendChild(textLayer);

    const fragment = document.createDocumentFragment();
    
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

    textLayer.appendChild(fragment);

    return { total };
  } catch (error) {
    console.error('Error rendering PDF:', error);
    throw error;
  }
}