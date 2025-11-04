import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Intentando conectar a la base de datos...');
    
    // Intentar conectar
    await prisma.$connect();
    const connectTime = Date.now() - startTime;
    console.log(`✅ Conectado en ${connectTime}ms`);
    
    // Intentar una query simple
    const queryStart = Date.now();
    const count = await prisma.productos.count();
    const queryTime = Date.now() - queryStart;
    console.log(`✅ Query ejecutada en ${queryTime}ms`);
    
    return NextResponse.json({ 
      success: true, 
      message: '✅ Conexión exitosa a PostgreSQL',
      data: {
        productos_count: count,
        connection_time_ms: connectTime,
        query_time_ms: queryTime,
        total_time_ms: Date.now() - startTime,
        database_host: '200.58.109.125',
        database_name: 'clz_productos',
        database_user: 'guille',
      }
    });
    
  } catch (error: any) {
    const errorTime = Date.now() - startTime;
    
    console.error('❌ Error de conexión:', error);
    
    return NextResponse.json({ 
      success: false,
      message: '❌ Error de conexión a PostgreSQL',
      error: {
        message: error.message,
        code: error.code,
        meta: error.meta,
        time_until_error_ms: errorTime,
      },
      debug: {
        database_url_format: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'),
        node_env: process.env.NODE_ENV,
        vercel: process.env.VERCEL ? 'true' : 'false',
      }
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}
