import { toPng, toJpeg } from 'html-to-image';

// Captures a DOM node as a downloadable PNG/JPEG. Rendered at 2x for crisp
// placement in slide decks.
export async function downloadNodeAsImage(
  node: HTMLElement,
  filename: string,
  format: 'png' | 'jpeg' = 'png',
  // When the caller already knows the node's exact intended CSS size (in
  // px), pass it here. html-to-image otherwise auto-detects size from the
  // node's own bounding box at capture time, which has repeatedly proven
  // unreliable for flex layouts with overflowing/non-shrinking children —
  // telling it the size directly sidesteps that detection entirely.
  size?: { width: number; height: number }
): Promise<void> {
  // JPEG has no alpha channel, so html-to-image needs an opaque fallback for
  // any transparent pixel (mainly rounded-corner anti-aliasing fringe, since
  // every export already paints its own full-bleed background). Every
  // export tab is white/cream now, so '#ffffff' is the correct fallback.
  // canvasWidth/canvasHeight (explicit output size) and pixelRatio (a
  // multiplier applied to an auto-detected size) are two different ways of
  // reaching the same 2x-crisp result — mixing them is redundant at best,
  // so when an explicit size is known, skip pixelRatio entirely rather than
  // risk the two disagreeing.
  const options = size
    ? {
        width: size.width,
        height: size.height,
        canvasWidth: size.width * 2,
        canvasHeight: size.height * 2,
        backgroundColor: format === 'jpeg' ? '#ffffff' : undefined,
        cacheBust: true,
      }
    : {
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
