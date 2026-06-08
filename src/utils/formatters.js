export function formatNumber(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 0
  }).format(number);
}

export function formatMoney(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2
  }).format(number);
}

export function formatPercent(value) {
  const number = Number(value || 0);

  return `${number.toFixed(2)}%`;
}

export function formatClasificacion(value) {
  const labels = {
    CON_EXISTENCIA_SUFICIENTE: "Con existencia suficiente",
    EXISTENCIA_PARCIAL_INSUFICIENTE: "Existencia parcial",
    SIN_EXISTENCIA: "Sin existencia",
    SIN_DATO_INVENTARIO: "Sin dato inventario",
    SIN_NEGADO: "Sin negado"
  };

  return labels[value] || value || "Sin clasificar";
}