import { toPng, toJpeg } from 'html-to-image';

// Captures a DOM node as a downloadable PNG/JPEG. Rendered at 2x for crisp
// placement in slide decks.
export async function downloadNodeAsImage(
  node: HTMLElement,
  filename: string,
  format: 'png' | 'jpeg' = 'png'
): Promise<void> {
  const options = {
    pixelRatio: 2,
    backgroundColor: format === 'jpeg' ? '#0d0d0f' : undefined,
    cacheBust: true,
  };

  const dataUrl =
    format === 'png' ? await toPng(node, options) : await toJpeg(node, { ...options, quality: 0.95 });

  const link = document.createElement('a');
  link.download = `${filename}.${format === 'jpeg' ? 'jpg' : 'png'}`;
  link.href = dataUrl;
  link.click();
}
