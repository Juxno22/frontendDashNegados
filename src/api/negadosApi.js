import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000
});

function cleanParams(params = {}) {
  const cleaned = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      cleaned[key] = value;
    }
  });

  return cleaned;
}

export const negadosApi = {
  async getFiltros() {
    const { data } = await api.get("/dashboard/filtros");
    return data.data;
  },

  async getKpis(filters) {
    const { data } = await api.get("/dashboard/kpis", {
      params: cleanParams(filters)
    });

    return data.data;
  },

  async getHistorico(filters, groupBy = "day") {
    const { data } = await api.get("/dashboard/historico", {
      params: cleanParams({
        ...filters,
        groupBy
      })
    });

    return data.data;
  },

  async getSurtidores(filters, limit = 12) {
    const { data } = await api.get("/dashboard/surtidores", {
      params: cleanParams({
        ...filters,
        limit
      })
    });

    return data.data;
  },

  async getProductos(filters, limit = 12) {
    const { data } = await api.get("/dashboard/productos", {
      params: cleanParams({
        ...filters,
        limit
      })
    });

    return data.data;
  },

  async getProductosDia(filters, limit = 20) {
    const { data } = await api.get("/dashboard/productos-dia", {
      params: cleanParams({
        ...filters,
        limit
      })
    });

    return data.data;
  },

  async getDetalle(filters, page = 1, limit = 50) {
    const { data } = await api.get("/dashboard/detalle", {
      params: cleanParams({
        ...filters,
        page,
        limit
      })
    });

    return data;
  },

  async getSurtidorDetalle(surtidor, filters) {
    const { data } = await api.get(`/dashboard/surtidor/${encodeURIComponent(surtidor)}/resumen`, {
      params: cleanParams(filters)
    });

    return data.data;
  },

  async getProductoDetalle(codigoProducto, filters) {
    const params = {
      ...filters
    };

    delete params.producto;

    const { data } = await api.get(`/dashboard/producto/${encodeURIComponent(codigoProducto)}/resumen`, {
      params: cleanParams(params)
    });

    return data.data;
  },

  async importarReporteNegados(file, periodo) {
    const formData = new FormData();

    formData.append("file", file);

    if (periodo) {
      formData.append("periodo", periodo);
    }

    const { data } = await api.post("/imports/negados", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    return data;
  },

  async getImportacionesNegados() {
    const { data } = await api.get("/imports/negados");
    return data.data;
  },

  async getResumenImportacionNegados(importId) {
    const { data } = await api.get(`/imports/negados/${importId}/resumen`);
    return data.data;
  },
};