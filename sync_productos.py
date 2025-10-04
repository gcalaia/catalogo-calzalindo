#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pymssql
import psycopg2
from datetime import datetime
import sys

# ==========================================
# CONFIGURACIÓN
# ==========================================

# SQL Server (Macrogestion Consolidada)
MSSQL_CONFIG = {
    'server': '192.168.2.111',
    'port': 1433,
    'database': 'msgestionC',
    'user': 'am',
    'password': 'dl'
}

# PostgreSQL (Supabase)
POSTGRES_URL = "postgresql://postgres.xlgosfvhpsggkyoobtwz:zm6VKf4kYjy4Z2sN@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

# Depósitos a consultar para stock (modificá según tus depósitos)
DEPOSITOS = [0, 1, 2, 4, 6, 7, 8, 9, 15]  # Cambiar por los IDs correctos

# ==========================================
# FUNCIONES
# ==========================================

def log(mensaje):
    """Imprimir log con timestamp"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {mensaje}")

def conectar_mssql():
    """Conectar a SQL Server"""
    try:
        conn = pymssql.connect(
            server=MSSQL_CONFIG['server'],
            port=MSSQL_CONFIG['port'],
            database=MSSQL_CONFIG['database'],
            user=MSSQL_CONFIG['user'],
            password=MSSQL_CONFIG['password']
        )
        log("✓ Conectado a SQL Server")
        return conn
    except Exception as e:
        log(f"✗ Error conectando a SQL Server: {e}")
        sys.exit(1)

def conectar_postgres():
    """Conectar a PostgreSQL (Supabase)"""
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        log("✓ Conectado a Supabase")
        return conn
    except Exception as e:
        log(f"✗ Error conectando a Supabase: {e}")
        sys.exit(1)

def obtener_productos(conn_mssql):
    """Obtener productos con stock del ERP"""
    cursor = conn_mssql.cursor(as_dict=True)
    
    # Query para obtener productos con stock
    query = """
    SELECT 
        a.codigo,
        a.descripcion_1 as nombre,
        a.descripcion_5 as talla,
        a.color,
        m.descripcion as marca_descripcion,
        a.precio_1 as precio_lista,
        a.codigo_sinonimo,
        ISNULL(SUM(s.stock_actual), 0) as stock_total,
        ISNULL(o.porcentaje, 0) as descuento_oferta
    FROM 
        web_articulo a
        LEFT JOIN marcas m ON m.codigo = a.marca
        LEFT JOIN omicron_web_stock s ON s.articulo = a.codigo 
            AND s.deposito IN ({})
        LEFT JOIN tabla_ofertas o ON o.codigo = a.codigo
    GROUP BY 
        a.codigo, a.descripcion_1, a.descripcion_5, a.color,
        m.descripcion, a.precio_1, a.codigo_sinonimo, o.porcentaje
    HAVING 
        ISNULL(SUM(s.stock_actual), 0) > 0
    ORDER BY 
        a.codigo
    """.format(','.join(map(str, DEPOSITOS)))
    
    try:
        cursor.execute(query)
        productos = cursor.fetchall()
        log(f"✓ Obtenidos {len(productos)} productos con stock")
        return productos
    except Exception as e:
        log(f"✗ Error obteniendo productos: {e}")
        return []

def generar_url_imagen(codigo_sinonimo):
    """Generar URL de imagen basada en código sinónimo"""
    # Formato: 0001AR0000000-{13 ceros + codigo}000001.jpg
    codigo_str = str(codigo_sinonimo).zfill(13)
    return f"https://evirtual.calzalindo.com.ar:58000/clz_ventas/static/images/imagenes_macroges/0001AR0000000-{codigo_str}000001.jpg"

def clasificar_subrubro(nombre, marca):
    """Clasificar producto en subrubro (personalizar según necesidad)"""
    nombre_lower = nombre.lower() if nombre else ""
    marca_lower = marca.lower() if marca else ""
    
    # Ejemplo de clasificación simple
    if "zapatilla" in nombre_lower or "deportiv" in nombre_lower:
        return 1  # Deportivo
    elif "bota" in nombre_lower:
        return 2  # Botas
    elif "sandalia" in nombre_lower:
        return 3  # Sandalias
    elif "zapato" in nombre_lower:
        return 4  # Zapatos
    else:
        return 5  # Otros

def calcular_precio_final(precio_base, descuento_oferta):
    """Calcular precio final aplicando oferta si existe"""
    if descuento_oferta and descuento_oferta > 0:
        return round(precio_base * (1 - descuento_oferta / 100), 2)
    return precio_base

def sincronizar_productos(conn_postgres, productos):
    """Sincronizar productos en Supabase"""
    cursor = conn_postgres.cursor()
    
    # Limpiar tabla antes de insertar (opcional)
    # cursor.execute('DELETE FROM "Producto"')
    # log("✓ Tabla limpiada")
    
    insertados = 0
    actualizados = 0
    errores = 0
    
    for prod in productos:
        try:
            # Calcular precio final con oferta
            precio_final = calcular_precio_final(
                prod['precio_lista'], 
                prod['descuento_oferta']
            )
            
            # Generar URL de imagen
            imagen_url = generar_url_imagen(prod['codigo_sinonimo'])
            
            # Clasificar en subrubro
            subrubro = clasificar_subrubro(prod['nombre'], prod['marca_descripcion'])
            
            # Insertar o actualizar usando UPSERT
            query = """
            INSERT INTO "Producto" 
                (codigo, nombre, talla, color, marca_descripcion, 
                 precio_lista, stock_disponible, subrubro, imagen_url)
            VALUES 
                (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (codigo) 
            DO UPDATE SET
                nombre = EXCLUDED.nombre,
                talla = EXCLUDED.talla,
                color = EXCLUDED.color,
                marca_descripcion = EXCLUDED.marca_descripcion,
                precio_lista = EXCLUDED.precio_lista,
                stock_disponible = EXCLUDED.stock_disponible,
                subrubro = EXCLUDED.subrubro,
                imagen_url = EXCLUDED.imagen_url
            """
            
            cursor.execute(query, (
                prod['codigo'],
                prod['nombre'],
                prod['talla'],
                prod['color'],
                prod['marca_descripcion'],
                precio_final,
                int(prod['stock_total']),
                subrubro,
                imagen_url
            ))
            
            insertados += 1
            
        except Exception as e:
            errores += 1
            log(f"✗ Error con producto {prod['codigo']}: {e}")
    
    conn_postgres.commit()
    log(f"✓ Sincronización completada: {insertados} productos, {errores} errores")

# ==========================================
# MAIN
# ==========================================

def main():
    log("Iniciando sincronización...")
    
    # Conectar a bases de datos
    conn_mssql = conectar_mssql()
    conn_postgres = conectar_postgres()
    
    # Obtener productos del ERP
    productos = obtener_productos(conn_mssql)
    
    if productos:
        # Sincronizar con Supabase
        sincronizar_productos(conn_postgres, productos)
    else:
        log("No hay productos para sincronizar")
    
    # Cerrar conexiones
    conn_mssql.close()
    conn_postgres.close()
    
    log("Sincronización finalizada")

if __name__ == "__main__":
    main()