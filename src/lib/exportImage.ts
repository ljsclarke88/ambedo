import { toPng, toJpeg } from 'html-to-image';

// Captures a DOM node as a downloadable PNG/JPEG, at the node's own natural
// CSS pixel size — no upscaling.
//
// This used to render at 2x for crisper slide-deck placement, via
// html-to-image's pixelRatio/canvasWidth/canvasHeight options. Those ask the
// browser to draw the captured <svg><foreignObject> image onto an enlarged
// canvas via a single scaled drawImage call, which is where this app's
// months-long "chart renders oversized and gets cropped to the top-left
// corner" bug actually lived: direct testing (rendering the same captured
// SVG, and even an already-rasterized, verified-correct canvas, at
// increasing scales) showed Chrome intermittently mis-rasterizing any
// drawImage call that scales this specific foreignObject-heavy content —
// confirmed non-deterministic (identical code, identical DOM state,
// clean on some runs and corrupted on others). Every variant tried —
// canvas-level upscaling, and even asking the *SVG itself* to scale via
// width/height vs. viewBox (which sidesteps canvas scaling entirely) —
// reproduced the corruption on a large fraction of runs. The one thing
// that was reliable across dozens of repeated runs, with zero exceptions,
// was capturing at 1:1 — no scale factor anywhere in the pipeline. That
// reliability is worth more than retina crispness, so this no longer
// requests any multiplier.
export async function downloadNodeAsImage(
  node: HTMLElement,
  filename: string,
  format: 'png' | 'jpeg' = 'png'
): Promise<void> {
  // JPEG has no alpha channel, so html-to-image needs an opaque fallback for
  // any transparent pixel (mainly rounded-corner anti-aliasing fringe, since
  // every export already paints its own full-bleed background). Every
  // export tab is white/cream, so '#ffffff' is the correct fallback.
  const options = {
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
