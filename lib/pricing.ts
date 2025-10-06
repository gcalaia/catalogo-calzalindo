// lib/pricing.ts
export const COEF = {
  LISTA: 1,
  CONTADO: 0.6645118001522601, // -33.55%
  DEBITO: 0.7342675389359863,  // -26.57%
};

// 🔹 Redondeo comercial (termina en .999)
export const aComercial = (x: number) => {
  const abs = Math.abs(x);
  const paso = abs < 20000 ? 100 : abs < 100000 ? 1000 : 10000;
  const redondeado = Math.ceil(abs / paso) * paso - 1; // fuerza .999
  return Math.round(redondeado);
};

// 🔹 Cálculo de precios comerciales uniformes
export function calcularPrecios(precioLista: number) {
  const lista   = aComercial(precioLista);
  const contado = aComercial(precioLista * COEF.CONTADO);
  const debito  = aComercial(precioLista * COEF.DEBITO);

  const offContado = Math.round((1 - COEF.CONTADO) * 100);
  const offDebito  = Math.round((1 - COEF.DEBITO) * 100);

  return { lista, contado, debito, offContado, offDebito };
}
