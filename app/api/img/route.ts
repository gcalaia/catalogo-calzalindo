export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const EXT = process.env.IMG_BASE_EXTERNAL!;
const INT = process.env.IMG_BASE_INTERNAL!;
const PLACEHOLDER = process.env.NEXT_PUBLIC_IMG_PLACEHOLDER || '/no_image.png';

async function tryFetch(u: string, ms = 2500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(u, { signal: ctrl.signal });
    if (!r.ok) throw new Error('bad status');
    const buf = Buffer.from(await r.arrayBuffer());
    const ct = r.headers.get('content-type') || 'image/jpeg';
    return new NextResponse(buf, {
      headers: { 'content-type': ct, 'cache-control': 'public, max-age=86400' },
    });
  } finally {
    clearTimeout(t);
  }
}

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('p'); // ej: imagenes_macroges/0001AR....jpg
  if (!path) return NextResponse.json({ error: 'missing p' }, { status: 400 });

  const urls = [`${EXT}/${path}`, `${INT}/${path}`];

  for (const u of urls) {
    try { return await tryFetch(u); } catch {}
  }
  return NextResponse.redirect(PLACEHOLDER, { status: 302 });
}
