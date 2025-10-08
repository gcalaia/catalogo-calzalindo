interface Producto {
  codigo?: string;
  imagen_url?: string;   // puede ser absoluta o relativa
  imagen_path?: string;  // relativo tipo: 2025/01/03/117265000001.webp
  year?: string;
  month?: string;
  day?: string;
}

const PLACEHOLDER = '/no_image.png';

function getBase(): string {
  // siempre sin / final
  return (process.env.NEXT_PUBLIC_IMAGE_SERVER_URL || '').replace(/\/+$/,'');
}

export function getImageUrl(p: Producto): string {
  // 1) absoluta
  if (p.imagen_url && /^https?:\/\//i.test(p.imagen_url)) return p.imagen_url;

  const base = getBase();
  if (!base) return PLACEHOLDER;

  // 2) path relativo (preferido)
  const rel = p.imagen_path || (p.imagen_url && p.imagen_url.replace(/^\/+/,''));
  if (rel) return `${base}/${rel}`;

  // 3) solo si vienen fechas explícitas: construyo
  if (p.codigo && p.year && p.month && p.day) {
    const m = p.month.padStart(2,'0');
    const d = p.day.padStart(2,'0');
    const filename = `${p.codigo}000001.webp`;
    return `${base}/${p.year}/${m}/${d}/${filename}`;
  }

  // 4) fallback
  return PLACEHOLDER;
}

export async function checkImageExists(url: string): Promise<boolean> {
  // Ojo: HEAD puede fallar por CORS; úsalo sólo para debug.
  try { const r = await fetch(url, { method: 'HEAD' }); return r.ok; } catch { return false; }
}

export function getMultipleImageUrls(p: Producto, maxImages = 5): string[] {
  const base = getBase();
  if (!base || !p.codigo || !p.year || !p.month || !p.day) return [getImageUrl(p)];
  const m = p.month.padStart(2,'0'), d = p.day.padStart(2,'0');
  return Array.from({length: maxImages}, (_,i) => {
    const n = String(i+1).padStart(6,'0'); // 000001…
    return `${base}/${p.year}/${m}/${d}/${p.codigo}${n}.webp`;
  });
}

export const getThumbnailUrl = getImageUrl;
