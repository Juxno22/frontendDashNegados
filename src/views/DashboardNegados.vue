<template>
  <div class="dashboard-page">
    <header class="dashboard-header">
      <div>
        <p class="eyebrow">Gerente de Operacion</p>
        <h1>Dashboard de faltantes</h1>
        <p class="header-description">
          Seguimiento de faltantes por existencia, surtidor, producto y tendencia histórica.
        </p>
      </div>

      <button class="primary-button" :disabled="loading" @click="loadDashboard">
        {{ loading ? "Cargando..." : "Actualizar dashboard" }}
      </button>
    </header>

    <section class="filters-panel">
      <div class="filter-field">
        <label>Periodo</label>
        <select v-model="filters.periodo">
          <option value="">Todos</option>
          <option v-for="periodo in filtrosDisponibles.periodos" :key="periodo" :value="periodo">
            {{ periodo }}
          </option>
        </select>
      </div>

      <div class="filter-field">
        <label>Desde</label>
        <input v-model="filters.from" type="date" />
      </div>

      <div class="filter-field">
        <label>Hasta</label>
        <input v-model="filters.to" type="date" />
      </div>

      <div class="filter-field">
        <label>Surtidor</label>
        <select v-model="filters.surtidor">
          <option value="">Todos</option>
          <option v-for="surtidor in filtrosDisponibles.surtidores" :key="surtidor" :value="surtidor">
            {{ surtidor }}
          </option>
        </select>
      </div>

      <div class="filter-field">
        <label>Clasificación</label>
        <select v-model="filters.clasificacion">
          <option value="">Todas</option>
          <option v-for="clasificacion in filtrosDisponibles.clasificaciones" :key="clasificacion"
            :value="clasificacion">
            {{ formatClasificacion(clasificacion) }}
          </option>
        </select>
      </div>

      <div class="filter-field">
        <label>Producto / código</label>
        <input v-model="filters.producto" type="text" placeholder="Buscar producto..." />
      </div>

      <div class="filter-field">
        <label>Agrupación</label>
        <select v-model="groupBy">
          <option value="day">Día</option>
          <option value="week">Semana</option>
          <option value="month">Mes</option>
        </select>
      </div>

      <button class="secondary-button" :disabled="loading" @click="aplicarFiltros">
        Aplicar filtros
      </button>

      <button class="ghost-button" :disabled="loading" @click="clearFilters">
        Limpiar
      </button>
    </section>

    <div v-if="error" class="error-box">
      {{ error }}
    </div>

    <section class="kpi-grid">
      <KpiCard title="Eventos negados" :value="formatNumber(kpis.total_eventos)"
        :subtitle="`${formatNumber(kpis.total_piezas_negadas)} piezas negadas`" icon="📦" tone="blue" />

      <KpiCard title="Monto negado" :value="formatMoney(kpis.total_valor_no_surt_1)"
        subtitle="Valor no surtido principal" icon="💰" tone="red" />

      <KpiCard title="Con existencia suficiente" :value="formatNumber(kpis.eventos_con_existencia_suficiente)"
        :subtitle="`${formatPercent(kpis.porcentaje_eventos_con_existencia_suficiente)} de eventos`" icon="⚠️"
        tone="orange" />

      <KpiCard title="Sin existencia" :value="formatNumber(kpis.eventos_sin_existencia)"
        :subtitle="`${formatPercent(kpis.porcentaje_eventos_sin_existencia)} de eventos`" icon="🚫" tone="dark" />

      <KpiCard title="Productos distintos" :value="formatNumber(kpis.productos_distintos)"
        :subtitle="`${formatNumber(kpis.dias_con_negados)} días con negados`" icon="🏷️" tone="purple" />

      <KpiCard title="Alertas de calidad" :value="formatNumber(alertasCalidad)"
        :subtitle="`Sin fecha: ${formatNumber(kpis.registros_sin_fecha)} · Sin surtidor: ${formatNumber(kpis.registros_sin_surtidor)}`"
        icon="🧾" tone="yellow" />
    </section>

    <nav class="dashboard-tabs">
      <button v-for="section in dashboardSections" :key="section.key" type="button" class="dashboard-tab"
        :class="{ active: activeSection === section.key }" @click="setActiveSection(section.key)">
        <span>{{ section.icon }}</span>
        {{ section.label }}
      </button>
    </nav>

    <section v-if="activeSection === 'resumen'" class="dashboard-section">
      <section class="dashboard-grid">
        <article class="panel panel-large">
          <div class="panel-header">
            <div>
              <h2>Histórico de negados</h2>
              <p>Eventos por {{ groupByLabel }}</p>
            </div>
          </div>

          <div class="chart-box">
            <Line :data="historicoChartData" :options="lineOptions" />
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <h2>Distribución</h2>
              <p>Eventos por clasificación</p>
            </div>
          </div>

          <div class="chart-box">
            <Doughnut :data="clasificacionChartData" :options="doughnutOptions" />
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <h2>Ranking surtidores</h2>
              <p>Con existencia suficiente</p>
            </div>
          </div>

          <div class="chart-box">
            <Bar :data="surtidoresChartData" :options="barOptions" />
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <h2>Productos más negados</h2>
              <p>Top visual por número de eventos</p>
            </div>
          </div>

          <div class="chart-box">
            <Bar :data="productosChartData" :options="barOptions" />
          </div>
        </article>
      </section>
      <section class="monto-clasificacion-grid">
        <article class="panel">
          <div class="panel-header">
            <div>
              <h2>Monto por tipo de negado</h2>
              <p>Suma del valor no surtido agrupado por clasificación.</p>
            </div>
          </div>

          <div class="chart-box">
            <Bar :data="montoClasificacionChartData" :options="barOptions" />
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <h2>Resumen monetario por categoría</h2>
              <p>Eventos, piezas y monto acumulado por tipo de negado.</p>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Eventos</th>
                  <th>Piezas</th>
                  <th>Monto 1</th>
                  <th>Monto 2</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="item in montoPorClasificacionRows" :key="item.clasificacion">
                  <td>
                    <span class="status-pill" :class="`status-${item.clasificacion}`">
                      {{ item.label }}
                    </span>
                  </td>
                  <td>{{ formatNumber(item.eventos) }}</td>
                  <td>{{ formatNumber(item.piezas) }}</td>
                  <td>{{ formatMoney(item.monto_1) }}</td>
                  <td>{{ formatMoney(item.monto_2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </section>

    <section v-if="activeSection === 'surtidor'" class="dashboard-section">
      <SurtidorDetallePanel v-if="filters.surtidor" :surtidor="filters.surtidor" :filters="activeFilters" />

      <section v-else class="panel select-surtidor-panel">
        <div>
          <p class="eyebrow">Análisis individual</p>
          <h2>Selecciona un surtidor</h2>
          <p>
            Usa el filtro superior de surtidor o el botón Analizar en la tabla de detalle para abrir su vista
            individual.
          </p>
        </div>
      </section>
    </section>

    <section v-if="activeSection === 'producto'" class="dashboard-section">
      <ProductoDetallePanel v-if="selectedProducto" :codigo-producto="selectedProducto" :filters="activeFilters" />

      <section v-else class="panel select-producto-panel">
        <div>
          <p class="eyebrow">Análisis por producto</p>
          <h2>Selecciona un producto</h2>
          <p>
            Da clic en Analizar dentro de la carta de todos los productos para ver su histórico, surtidores, montos y
            acumulado diario.
          </p>
        </div>
      </section>

      <article class="panel">
        <div class="panel-header">
          <div>
            <h2>Todos los productos negados</h2>
            <p>
              Listado amplio según filtros activos. La gráfica del resumen solo muestra el top visual.
              Total cargado: {{ formatNumber(productosFiltrados.length) }} productos.
            </p>
          </div>

          <div class="pagination-actions">
            <button class="ghost-button" :disabled="productosPage <= 1" @click="changeProductosPage(-1)">
              Anterior
            </button>
            <button class="ghost-button" :disabled="productosPage >= productosTotalPages"
              @click="changeProductosPage(1)">
              Siguiente
            </button>
          </div>
        </div>

        <div class="filters-panel products-inline-filter">
          <div class="filter-field">
            <label>Buscar en productos cargados</label>
            <input v-model="productosSearch" type="text" placeholder="Código o descripción..."
              @input="productosPage = 1" />
          </div>

          <div class="filter-field">
            <label>Página</label>
            <select v-model.number="productosPage">
              <option v-for="page in productosTotalPages" :key="page" :value="page">
                {{ page }} de {{ productosTotalPages }}
              </option>
            </select>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Eventos</th>
                <th>Piezas</th>
                <th>Con existencia</th>
                <th>Sin existencia</th>
                <th>Parcial</th>
                <th>Monto</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in productosPaginados" :key="`${item.codigo_producto}-${item.producto}`">
                <td>{{ item.codigo_producto }}</td>
                <td class="text-left">{{ item.producto }}</td>
                <td>{{ formatNumber(item.eventos) }}</td>
                <td>{{ formatNumber(item.piezas_negadas) }}</td>
                <td>{{ formatNumber(item.eventos_con_existencia_suficiente) }}</td>
                <td>{{ formatNumber(item.eventos_sin_existencia) }}</td>
                <td>{{ formatNumber(item.eventos_existencia_parcial) }}</td>
                <td>{{ formatMoney(item.valor_no_surt_1) }}</td>
                <td>
                  <button class="mini-action-button" @click="seleccionarProducto(item.codigo_producto)">
                    Analizar
                  </button>
                </td>
              </tr>

              <tr v-if="!productosPaginados.length">
                <td colspan="9" class="empty-cell">Sin productos para mostrar.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section v-if="activeSection === 'detalle'" class="dashboard-section">
      <section class="tables-grid">
        <article class="panel">
          <div class="panel-header">
            <div>
              <h2>Productos negados por día</h2>
              <p>Acumulado diario del mismo producto</p>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Veces</th>
                  <th>Piezas</th>
                  <th>Monto</th>
                  <th>Surtidores</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in productosDia" :key="`${item.fecha}-${item.codigo_producto}`">
                  <td>{{ item.fecha }}</td>
                  <td>{{ item.codigo_producto }}</td>
                  <td class="text-left">{{ item.producto }}</td>
                  <td>{{ formatNumber(item.veces_negado_en_dia) }}</td>
                  <td>{{ formatNumber(item.piezas_negadas_en_dia) }}</td>
                  <td>{{ formatMoney(item.valor_no_surt_1) }}</td>
                  <td>{{ formatNumber(item.surtidores_involucrados) }}</td>
                </tr>

                <tr v-if="!productosDia.length">
                  <td colspan="7" class="empty-cell">Sin datos para mostrar.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <h2>Ranking por surtidor</h2>
              <p>Histórico grupal filtrado</p>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Surtidor</th>
                  <th>Eventos</th>
                  <th>Piezas</th>
                  <th>Con existencia</th>
                  <th>% con existencia</th>
                  <th>Monto</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in surtidores" :key="item.surtidor">
                  <td>{{ item.surtidor }}</td>
                  <td>{{ formatNumber(item.eventos) }}</td>
                  <td>{{ formatNumber(item.piezas_negadas) }}</td>
                  <td>{{ formatNumber(item.eventos_con_existencia_suficiente) }}</td>
                  <td>{{ formatPercent(item.porcentaje_eventos_con_existencia_suficiente) }}</td>
                  <td>{{ formatMoney(item.valor_no_surt_1) }}</td>
                  <td>
                    <button class="mini-action-button" @click="seleccionarSurtidor(item.surtidor)">
                      Analizar
                    </button>
                  </td>
                </tr>

                <tr v-if="!surtidores.length">
                  <td colspan="7" class="empty-cell">Sin datos para mostrar.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section class="panel detail-panel">
        <div class="panel-header">
          <div>
            <h2>Detalle de negados</h2>
            <p>
              Página {{ detallePagination.page }} de {{ detallePagination.total_pages }}
              · {{ formatNumber(detallePagination.total) }} registros
            </p>
          </div>

          <div class="pagination-actions">
            <button class="ghost-button" :disabled="detallePage <= 1 || loading" @click="changeDetallePage(-1)">
              Anterior
            </button>
            <button class="ghost-button" :disabled="detallePage >= detallePagination.total_pages || loading"
              @click="changeDetallePage(1)">
              Siguiente
            </button>
          </div>
        </div>

        <div class="table-wrap detail-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Surtidor</th>
                <th>Código</th>
                <th>Producto</th>
                <th>A surtir</th>
                <th>Surtido</th>
                <th>A deber</th>
                <th>Inventario</th>
                <th>Monto 1</th>
                <th>Monto 2</th>
                <th>Clasificación</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in detalle" :key="item.id">
                <td>{{ item.fecha_texto || "SIN FECHA" }}</td>
                <td>{{ item.surtidor }}</td>
                <td>{{ item.codigo_producto }}</td>
                <td class="text-left">{{ item.producto }}</td>
                <td>{{ formatNumber(item.a_surtir) }}</td>
                <td>{{ formatNumber(item.surtido) }}</td>
                <td>{{ formatNumber(item.a_deber) }}</td>
                <td>{{ formatNumber(item.inventario_anterior) }}</td>
                <td>{{ formatMoney(item.valor_no_surt_1) }}</td>
                <td>{{ formatMoney(item.valor_no_surt_2) }}</td>
                <td>
                  <span class="status-pill" :class="`status-${item.clasificacion}`">
                    {{ formatClasificacion(item.clasificacion) }}
                  </span>
                </td>
              </tr>

              <tr v-if="!detalle.length">
                <td colspan="11" class="empty-cell">Sin datos para mostrar.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <section v-if="activeSection === 'carga'" class="dashboard-section">
      <ImportarReporteNegados @imported="handleReporteImportado" />
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler
} from "chart.js";
import { Bar, Doughnut, Line } from "vue-chartjs";
import KpiCard from "../components/KpiCard.vue";
import SurtidorDetallePanel from "../components/SurtidorDetallePanel.vue";
import ProductoDetallePanel from "../components/ProductoDetallePanel.vue";
import ImportarReporteNegados from "../components/ImportarReporteNegados.vue";
import { negadosApi } from "../api/negadosApi";
import {
  formatClasificacion,
  formatMoney,
  formatNumber,
  formatPercent
} from "../utils/formatters";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler
);

const activeSection = ref("resumen");

const dashboardSections = [
  {
    key: "resumen",
    label: "Resumen ejecutivo",
    icon: "📊"
  },
  {
    key: "surtidor",
    label: "Surtidor",
    icon: "👤"
  },
  {
    key: "producto",
    label: "Producto",
    icon: "🏷️"
  },
  {
    key: "detalle",
    label: "Detalle",
    icon: "📋"
  },
  {
    key: "carga",
    label: "Carga de reportes",
    icon: "⬆️"
  }
];

function setActiveSection(section) {
  activeSection.value = section;
}

const selectedProducto = ref("");
const productosSearch = ref("");
const productosPage = ref(1);
const productosPageSize = 25;

function seleccionarProducto(codigoProducto) {
  selectedProducto.value = codigoProducto;
  activeSection.value = "producto";
}

function seleccionarSurtidor(surtidor) {
  filters.surtidor = surtidor;
  activeSection.value = "surtidor";
}

const colors = {
  red: "#ff192f",
  orange: "#f8805c",
  yellow: "#eee56e",
  blue: "#022e7a",
  purple: "#d20772",
  green: "#16a34a",
  gray: "#64748b",
  dark: "#111827"
};

const loading = ref(false);
const error = ref("");

const groupBy = ref("day");
const detallePage = ref(1);

const filtrosDisponibles = reactive({
  periodos: [],
  surtidores: [],
  clasificaciones: []
});

const filters = reactive({
  periodo: "",
  from: "",
  to: "",
  surtidor: "",
  clasificacion: "",
  producto: ""
});

const kpis = ref({});
const historico = ref([]);
const surtidores = ref([]);
const productos = ref([]);
const productosDia = ref([]);
const detalle = ref([]);

const montoPorClasificacionRows = computed(() => [
  {
    clasificacion: "CON_EXISTENCIA_SUFICIENTE",
    label: "Con existencia suficiente",
    eventos: Number(kpis.value.eventos_con_existencia_suficiente || 0),
    piezas: Number(kpis.value.piezas_con_existencia_suficiente || 0),
    monto_1: Number(kpis.value.valor_1_con_existencia_suficiente || 0),
    monto_2: Number(kpis.value.valor_2_con_existencia_suficiente || 0)
  },
  {
    clasificacion: "EXISTENCIA_PARCIAL_INSUFICIENTE",
    label: "Existencia parcial",
    eventos: Number(kpis.value.eventos_existencia_parcial || 0),
    piezas: Number(kpis.value.piezas_existencia_parcial || 0),
    monto_1: Number(kpis.value.valor_1_existencia_parcial || 0),
    monto_2: Number(kpis.value.valor_2_existencia_parcial || 0)
  },
  {
    clasificacion: "SIN_EXISTENCIA",
    label: "Sin existencia",
    eventos: Number(kpis.value.eventos_sin_existencia || 0),
    piezas: Number(kpis.value.piezas_sin_existencia || 0),
    monto_1: Number(kpis.value.valor_1_sin_existencia || 0),
    monto_2: Number(kpis.value.valor_2_sin_existencia || 0)
  },
  {
    clasificacion: "SIN_DATO_INVENTARIO",
    label: "Sin dato inventario",
    eventos: Number(kpis.value.eventos_sin_dato_inventario || 0),
    piezas: Number(kpis.value.piezas_sin_dato_inventario || 0),
    monto_1: Number(kpis.value.valor_1_sin_dato_inventario || 0),
    monto_2: Number(kpis.value.valor_2_sin_dato_inventario || 0)
  }
]);

const montoClasificacionChartData = computed(() => ({
  labels: montoPorClasificacionRows.value.map((item) => item.label),
  datasets: [
    {
      label: "Monto negado",
      data: montoPorClasificacionRows.value.map((item) => item.monto_1),
      backgroundColor: [
        colors.orange,
        colors.purple,
        colors.blue,
        colors.gray
      ],
      borderRadius: 8
    }
  ]
}));

const detallePagination = reactive({
  page: 1,
  limit: 50,
  total: 0,
  total_pages: 1
});

const alertasCalidad = computed(() => {
  return (
    Number(kpis.value.registros_sin_fecha || 0) +
    Number(kpis.value.registros_sin_surtidor || 0) +
    Number(kpis.value.registros_sin_inventario || 0)
  );
});

const groupByLabel = computed(() => {
  const labels = {
    day: "día",
    week: "semana",
    month: "mes"
  };

  return labels[groupBy.value] || "día";
});

const activeFilters = computed(() => ({
  periodo: filters.periodo,
  from: filters.from,
  to: filters.to,
  surtidor: filters.surtidor,
  clasificacion: filters.clasificacion,
  producto: filters.producto
}));

const productosFiltrados = computed(() => {
  const search = productosSearch.value.trim().toLowerCase();

  if (!search) {
    return productos.value;
  }

  return productos.value.filter((item) => {
    const codigo = String(item.codigo_producto || "").toLowerCase();
    const descripcion = String(item.producto || "").toLowerCase();

    return codigo.includes(search) || descripcion.includes(search);
  });
});

const productosTotalPages = computed(() => {
  return Math.max(1, Math.ceil(productosFiltrados.value.length / productosPageSize));
});

const productosPaginados = computed(() => {
  const safePage = Math.min(Math.max(productosPage.value, 1), productosTotalPages.value);
  const start = (safePage - 1) * productosPageSize;

  return productosFiltrados.value.slice(start, start + productosPageSize);
});

const historicoChartData = computed(() => ({
  labels: historico.value.map((item) => item.periodo),
  datasets: [
    {
      label: "Con existencia suficiente",
      data: historico.value.map((item) => Number(item.eventos_con_existencia_suficiente || 0)),
      borderColor: colors.orange,
      backgroundColor: "rgba(248, 128, 92, 0.18)",
      tension: 0.35,
      fill: true
    },
    {
      label: "Sin existencia",
      data: historico.value.map((item) => Number(item.eventos_sin_existencia || 0)),
      borderColor: colors.blue,
      backgroundColor: "rgba(2, 46, 122, 0.12)",
      tension: 0.35,
      fill: true
    },
    {
      label: "Existencia parcial",
      data: historico.value.map((item) => Number(item.eventos_existencia_parcial || 0)),
      borderColor: colors.purple,
      backgroundColor: "rgba(210, 7, 114, 0.10)",
      tension: 0.35,
      fill: true
    }
  ]
}));

const clasificacionChartData = computed(() => ({
  labels: [
    "Con existencia suficiente",
    "Existencia parcial",
    "Sin existencia",
    "Sin dato inventario"
  ],
  datasets: [
    {
      data: [
        Number(kpis.value.eventos_con_existencia_suficiente || 0),
        Number(kpis.value.eventos_existencia_parcial || 0),
        Number(kpis.value.eventos_sin_existencia || 0),
        Number(kpis.value.eventos_sin_dato_inventario || 0)
      ],
      backgroundColor: [
        colors.orange,
        colors.purple,
        colors.blue,
        colors.gray
      ],
      borderWidth: 0
    }
  ]
}));

const surtidoresChartData = computed(() => ({
  labels: surtidores.value.slice(0, 8).map((item) => item.surtidor),
  datasets: [
    {
      label: "Con existencia suficiente",
      data: surtidores.value
        .slice(0, 8)
        .map((item) => Number(item.eventos_con_existencia_suficiente || 0)),
      backgroundColor: colors.orange,
      borderRadius: 8
    }
  ]
}));

const productosChartData = computed(() => ({
  labels: productos.value.slice(0, 8).map((item) => item.codigo_producto),
  datasets: [
    {
      label: "Eventos negados",
      data: productos.value.slice(0, 8).map((item) => Number(item.eventos || 0)),
      backgroundColor: colors.blue,
      borderRadius: 8
    }
  ]
}));

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false
  },
  plugins: {
    legend: {
      position: "bottom"
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: "rgba(148, 163, 184, 0.20)"
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: "rgba(148, 163, 184, 0.20)"
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "62%",
  plugins: {
    legend: {
      position: "bottom"
    }
  }
};

async function handleReporteImportado(result) {
  await loadFiltros();

  if (result?.periodo) {
    filters.periodo = result.periodo;
  }

  detallePage.value = 1;

  await loadDashboard();

  activeSection.value = "resumen";
}

async function loadFiltros() {
  const data = await negadosApi.getFiltros();

  filtrosDisponibles.periodos = data.periodos || [];
  filtrosDisponibles.surtidores = data.surtidores || [];
  filtrosDisponibles.clasificaciones = data.clasificaciones || [];

  if (!filters.periodo && filtrosDisponibles.periodos.length) {
    filters.periodo = filtrosDisponibles.periodos[0];
  }
}

async function loadDashboard() {
  try {
    loading.value = true;
    error.value = "";

    const [
      kpisData,
      historicoData,
      surtidoresData,
      productosData,
      productosDiaData,
      detalleData
    ] = await Promise.all([
      negadosApi.getKpis(activeFilters.value),
      negadosApi.getHistorico(activeFilters.value, groupBy.value),
      negadosApi.getSurtidores(activeFilters.value, 200),
      negadosApi.getProductos(activeFilters.value, 5000),
      negadosApi.getProductosDia(activeFilters.value, 100),
      negadosApi.getDetalle(activeFilters.value, detallePage.value, 50)
    ]);

    kpis.value = kpisData || {};
    historico.value = historicoData || [];
    surtidores.value = surtidoresData || [];
    productos.value = productosData || [];
    productosDia.value = productosDiaData || [];
    detalle.value = detalleData.data || [];

    productosPage.value = 1;

    detallePagination.page = detalleData.pagination?.page || 1;
    detallePagination.limit = detalleData.pagination?.limit || 50;
    detallePagination.total = detalleData.pagination?.total || 0;
    detallePagination.total_pages = detalleData.pagination?.total_pages || 1;
  } catch (err) {
    console.error(err);
    error.value = err.response?.data?.message || "No se pudo cargar el dashboard.";
  } finally {
    loading.value = false;
  }
}

async function aplicarFiltros() {
  detallePage.value = 1;
  productosPage.value = 1;
  await loadDashboard();
}

async function clearFilters() {
  filters.from = "";
  filters.to = "";
  filters.surtidor = "";
  filters.clasificacion = "";
  filters.producto = "";
  productosSearch.value = "";
  selectedProducto.value = "";
  groupBy.value = "day";
  detallePage.value = 1;
  productosPage.value = 1;
  activeSection.value = "resumen";

  await loadDashboard();
}

function changeProductosPage(direction) {
  const nextPage = productosPage.value + direction;
  productosPage.value = Math.min(Math.max(nextPage, 1), productosTotalPages.value);
}

async function changeDetallePage(direction) {
  detallePage.value += direction;

  if (detallePage.value < 1) {
    detallePage.value = 1;
  }

  await loadDashboard();
}

onMounted(async () => {
  try {
    loading.value = true;
    await loadFiltros();
    await loadDashboard();
  } catch (err) {
    console.error(err);
    error.value = err.response?.data?.message || "No se pudo inicializar el dashboard.";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.products-inline-filter {
  grid-template-columns: minmax(260px, 1fr) minmax(150px, 180px);
  margin-bottom: 14px;
  box-shadow: none;
}

@media (max-width: 760px) {
  .products-inline-filter {
    grid-template-columns: 1fr;
  }
}
</style>
