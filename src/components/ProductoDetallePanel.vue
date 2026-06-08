<template>
  <section class="producto-panel">
    <div class="producto-panel-header">
      <div>
        <p class="eyebrow">Análisis por producto</p>
        <h2>{{ productoInfo.codigo_producto }}</h2>
        <p>{{ productoInfo.producto }}</p>
      </div>

      <button class="ghost-button" :disabled="loading" @click="loadData">
        {{ loading ? "Cargando..." : "Actualizar producto" }}
      </button>
    </div>

    <div v-if="error" class="error-box">
      {{ error }}
    </div>

    <div class="surtidor-summary-grid">
      <article class="surtidor-micro-card">
        <span>Eventos</span>
        <strong>{{ formatNumber(data.kpis.total_eventos) }}</strong>
        <small>{{ formatNumber(data.kpis.total_piezas_negadas) }} piezas</small>
      </article>

      <article class="surtidor-micro-card danger">
        <span>Con existencia</span>
        <strong>{{ formatNumber(data.kpis.eventos_con_existencia_suficiente) }}</strong>
        <small>{{ formatPercent(data.kpis.porcentaje_eventos_con_existencia_suficiente) }}</small>
      </article>

      <article class="surtidor-micro-card blue">
        <span>Sin existencia</span>
        <strong>{{ formatNumber(data.kpis.eventos_sin_existencia) }}</strong>
        <small>{{ formatPercent(data.kpis.porcentaje_eventos_sin_existencia) }}</small>
      </article>

      <article class="surtidor-micro-card purple">
        <span>Monto negado</span>
        <strong>{{ formatMoney(data.kpis.total_valor_no_surt_1) }}</strong>
        <small>Valor no surtido</small>
      </article>

      <article class="surtidor-micro-card">
        <span>Surtidores</span>
        <strong>{{ formatNumber(data.kpis.surtidores_distintos) }}</strong>
        <small>{{ formatNumber(data.kpis.dias_con_negados) }} días afectados</small>
      </article>
    </div>

    <div class="producto-grid">
      <article class="panel">
        <div class="panel-header">
          <div>
            <h2>Histórico diario del producto</h2>
            <p>Eventos por clasificación</p>
          </div>
        </div>

        <div class="chart-box">
          <Line :data="historicoChartData" :options="lineOptions" />
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <div>
            <h2>Distribución del producto</h2>
            <p>Tipo de negado</p>
          </div>
        </div>

        <div class="chart-box">
          <Doughnut :data="clasificacionChartData" :options="doughnutOptions" />
        </div>
      </article>
    </div>

    <div class="tables-grid">
      <article class="panel">
        <div class="panel-header">
          <div>
            <h2>Surtidores que negaron este producto</h2>
            <p>Ranking individual del producto seleccionado</p>
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
                <th>Sin existencia</th>
                <th>% con existencia</th>
                <th>Monto</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in data.surtidores" :key="item.surtidor">
                <td>{{ item.surtidor }}</td>
                <td>{{ formatNumber(item.eventos) }}</td>
                <td>{{ formatNumber(item.piezas_negadas) }}</td>
                <td>{{ formatNumber(item.eventos_con_existencia_suficiente) }}</td>
                <td>{{ formatNumber(item.eventos_sin_existencia) }}</td>
                <td>{{ formatPercent(item.porcentaje_con_existencia) }}</td>
                <td>{{ formatMoney(item.valor_no_surt_1) }}</td>
              </tr>

              <tr v-if="!data.surtidores.length">
                <td colspan="7" class="empty-cell">Sin surtidores para mostrar.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <div>
            <h2>Acumulado diario del producto</h2>
            <p>Veces que se negó por día</p>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Veces</th>
                <th>Piezas</th>
                <th>Surtidores</th>
                <th>Con existencia</th>
                <th>Sin existencia</th>
                <th>Monto</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in data.productos_dia" :key="item.fecha">
                <td>{{ item.fecha }}</td>
                <td>{{ formatNumber(item.veces_negado_en_dia) }}</td>
                <td>{{ formatNumber(item.piezas_negadas_en_dia) }}</td>
                <td>{{ formatNumber(item.surtidores_involucrados) }}</td>
                <td>{{ formatNumber(item.eventos_con_existencia_suficiente) }}</td>
                <td>{{ formatNumber(item.eventos_sin_existencia) }}</td>
                <td>{{ formatMoney(item.valor_no_surt_1) }}</td>
              </tr>

              <tr v-if="!data.productos_dia.length">
                <td colspan="7" class="empty-cell">Sin acumulado diario.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>

    <article class="panel">
      <div class="panel-header">
        <div>
          <h2>Detalle del producto</h2>
          <p>Últimos registros del producto seleccionado</p>
        </div>
      </div>

      <div class="table-wrap detail-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Surtidor</th>
              <th>A surtir</th>
              <th>Surtido</th>
              <th>A deber</th>
              <th>Inventario</th>
              <th>Inventario después</th>
              <th>Monto 1</th>
              <th>Monto 2</th>
              <th>Clasificación</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in data.detalle" :key="item.id">
              <td>{{ item.fecha_texto || "SIN FECHA" }}</td>
              <td>{{ item.surtidor }}</td>
              <td>{{ formatNumber(item.a_surtir) }}</td>
              <td>{{ formatNumber(item.surtido) }}</td>
              <td>{{ formatNumber(item.a_deber) }}</td>
              <td>{{ formatNumber(item.inventario_anterior) }}</td>
              <td>{{ formatNumber(item.inventario_despues_ticket) }}</td>
              <td>{{ formatMoney(item.valor_no_surt_1) }}</td>
              <td>{{ formatMoney(item.valor_no_surt_2) }}</td>
              <td>
                <span class="status-pill" :class="`status-${item.clasificacion}`">
                  {{ formatClasificacion(item.clasificacion) }}
                </span>
              </td>
            </tr>

            <tr v-if="!data.detalle.length">
              <td colspan="10" class="empty-cell">Sin registros para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler
} from "chart.js";
import { Doughnut, Line } from "vue-chartjs";
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
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler
);

const props = defineProps({
  codigoProducto: {
    type: String,
    required: true
  },
  filters: {
    type: Object,
    required: true
  }
});

const colors = {
  orange: "#f8805c",
  blue: "#022e7a",
  purple: "#d20772",
  gray: "#64748b"
};

const loading = ref(false);
const error = ref("");

const productoInfo = reactive({
  codigo_producto: "",
  producto: ""
});

const data = reactive({
  kpis: {},
  historico: [],
  surtidores: [],
  productos_dia: [],
  detalle: []
});

const historicoChartData = computed(() => ({
  labels: data.historico.map((item) => item.periodo),
  datasets: [
    {
      label: "Con existencia",
      data: data.historico.map((item) => Number(item.eventos_con_existencia_suficiente || 0)),
      borderColor: colors.orange,
      backgroundColor: "rgba(248, 128, 92, 0.18)",
      fill: true,
      tension: 0.35
    },
    {
      label: "Sin existencia",
      data: data.historico.map((item) => Number(item.eventos_sin_existencia || 0)),
      borderColor: colors.blue,
      backgroundColor: "rgba(2, 46, 122, 0.12)",
      fill: true,
      tension: 0.35
    },
    {
      label: "Parcial",
      data: data.historico.map((item) => Number(item.eventos_existencia_parcial || 0)),
      borderColor: colors.purple,
      backgroundColor: "rgba(210, 7, 114, 0.10)",
      fill: true,
      tension: 0.35
    }
  ]
}));

const clasificacionChartData = computed(() => ({
  labels: ["Con existencia", "Parcial", "Sin existencia", "Sin dato"],
  datasets: [
    {
      data: [
        Number(data.kpis.eventos_con_existencia_suficiente || 0),
        Number(data.kpis.eventos_existencia_parcial || 0),
        Number(data.kpis.eventos_sin_existencia || 0),
        Number(data.kpis.eventos_sin_dato_inventario || 0)
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

async function loadData() {
  try {
    if (!props.codigoProducto) {
      return;
    }

    loading.value = true;
    error.value = "";

    const response = await negadosApi.getProductoDetalle(props.codigoProducto, props.filters);

    productoInfo.codigo_producto = response.producto?.codigo_producto || props.codigoProducto;
    productoInfo.producto = response.producto?.producto || "";

    data.kpis = response.kpis || {};
    data.historico = response.historico || [];
    data.surtidores = response.surtidores || [];
    data.productos_dia = response.productos_dia || [];
    data.detalle = response.detalle || [];
  } catch (err) {
    console.error(err);
    error.value = err.response?.data?.message || "No se pudo cargar el análisis del producto.";
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.codigoProducto, JSON.stringify(props.filters)],
  () => {
    loadData();
  }
);

onMounted(() => {
  loadData();
});
</script>