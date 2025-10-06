// lib/pricing.ts
export const COEF = {
  LISTA: 1,
  CONTADO: 0.6645118001522601,
  DEBITO: 0.7342675389359863,
};

// .999
export const aComercial = (x: number) => {
  const abs = Math.abs(x);
  const paso = abs < 20000 ? 100 : abs < 100000 ? 1000 : 10000;
  return Math.round(Math.ceil(abs / paso) * paso - 1);
};

export function calcularPrecios(precioLista: number) {
  const lista = aComercial(precioLista);              // .999
  const contado = Math.round(precioLista * COEF.CONTADO); // EXACTO calculadora
  const debito  = Math.round(precioLista * COEF.DEBITO);  // EXACTO calculadora
  const descuento = Math.round((1 - COEF.CONTADO) * 100); // ~33%
  const recargoDeb = Math.round((COEF.DEBITO - 1) * 100); // ~7%
  return { lista, contado, debito, descuento, recargoDeb };
}
