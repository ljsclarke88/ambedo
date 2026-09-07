import { toPng, toJpeg } from 'html-to-image';

// Captures a DOM node as a downloadable PNG/JPEG. Rendered at 2x for crisp
// placement in slide decks.
export async function downloadNodeAsImage(
  node: HTMLElement,
  filename: string,
  format: 'png' | 'jpeg' = 'png'
): Promise<void> {
  // JPEG has no alpha channel, so html-to-image needs an opaque fallback for
  // any transparent pixel (mainly rounded-corner anti-aliasing fringe, since
  // every export already paints its own full-bleed background). Every
  // export tab is white/cream now, so '#ffffff' is the correct fallback.
  const options = {
    pixelRatio: 2,
    backgroundColor: format === 'jpeg' ? '#ffffff' : undefined,
    cacheBust: true,
  };

  const dataUrl =
    format === 'png' ? await toPng(node, options) : await toJpeg(node, { ...options, quality: 0.95 });

  const link = document.createElement('a');
  link.download = `${filename}.${format === 'jpeg' ? 'jpg' : 'png'}`;
  link.href = dataUrl;
  link.click();
}
