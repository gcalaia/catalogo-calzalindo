// lib/pricing.ts
export const COEF = {
  LISTA: 1,
  CONTADO: 0.667, // tu calculadora
  DEBITO: 0.735,
};

export const aComercial = (x: number) => {
  const abs = Math.abs(x);
  const paso = abs < 20000 ? 100 : abs < 100000 ? 1000 : 10000;
  return Math.round(Math.ceil(abs / paso) * paso - 1); // termina en .999
};

export function calcularPrecios(precioLista: number) {
  const lista   = aComercial(precioLista * COEF.LISTA);
  const contado = aComercial(precioLista * COEF.CONTADO);
  const debito  = aComercial(precioLista * COEF.DEBITO);
  const descuento = Math.round((1 - COEF.CONTADO / COEF.LISTA) * 100); // ~33%
  const recargoDeb = Math.round((COEF.DEBITO / COEF.LISTA - 1) * 100); // ~+?%
  return { lista, contado, debito, descuento, recargoDeb };
}
