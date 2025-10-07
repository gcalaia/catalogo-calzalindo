export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const EXT = process.env.IMG_BASE_EXTERNAL || 'https://evirtual.calzalindo.com.ar:58000/clz_ventas/static/images';
const INT = process.env.IMG_BASE_INTERNAL || 'http://192.168.2.109/clz_ventas/static/images';
const PLACEHOLDER = process.env.NEXT_PUBLIC_IMG_PLACEHOLDER || '/no_image.png';

async function tryFetch(u: string, ms = 3000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(u, { signal: ctrl.signal });
    if (!r.ok) throw new Error('bad status');
    const buf = Buffer.from(await r.arrayBuffer());
    return new NextResponse(buf, {
      headers: {
        'content-type': r.headers.get('content-type') || 'image/jpeg',
        'cache-control': 'public, max-age=86400',
      },
    });
  } finally {
    clearTimeout(t);
  }
}

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u'); // URL completa
  const p = req.nextUrl.searchParams.get('p'); // path relativo a /static/images

  // 1) si viene URL completa
  if (u) {
    try { return await tryFetch(u); } catch {}
    return NextResponse.redirect(PLACEHOLDER, { status: 302 });
  }

  // 2) si viene path, probá externo -> interno
  if (p) {
    const urls = [`${EXT}/${p}`, `${INT}/${p}`];
    for (const url of urls) {
      try { return await tryFetch(url); } catch {}
    }
  }

  return NextResponse.redirect(PLACEHOLDER, { status: 302 });
}
