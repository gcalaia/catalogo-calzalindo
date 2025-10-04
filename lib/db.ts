// Datos mock para desarrollo local
export const productos = [
  {
    id: 1,
    codigo: 319423,
    nombre: "1900 NEGRO/NEGRO ZAPA TREKK AC COMB",
    talla: "42",
    color: "NEGRO/NEGRO",
    marca_descripcion: "SOFT",
    precio_lista: 49998.95,
    stock_disponible: 1,
    subrubro: 51,
    imagen_url: "https://evirtual.calzalindo.com.ar:58000/clz_ventas/static/images/imagenes_macroges/0001AR0000000-0000000000000319423000001.jpg"
  },
  {
    id: 2,
    codigo: 295358,
    nombre: "ACONCAGUA NEGRO/NEGRO ZAPA TREKK DET LINEAS",
    talla: "38",
    color: "NEGRO/NEGRO",
    marca_descripcion: "HEAD",
    precio_lista: 104631.58,
    stock_disponible: 1,
    subrubro: 51,
    imagen_url: "https://evirtual.calzalindo.com.ar:58000/clz_ventas/static/images/imagenes_macroges/0001AR0000000-0000000000000295358000001.jpg"
  }
];

export async function getProductos() {
  return productos;
}