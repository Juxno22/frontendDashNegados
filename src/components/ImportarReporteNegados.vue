<template>
  <section class="import-panel">
    <div class="import-header">
      <div>
        <p class="eyebrow">Carga de información</p>
        <h2>Importar reporte de negados</h2>
        <p>
          Sube el Excel diario o mensual para alimentar el dashboard. Si el reporte ya fue cargado,
          el sistema detectará duplicados.
        </p>
      </div>

      <button class="ghost-button" :disabled="loadingImports" @click="loadImportaciones">
        {{ loadingImports ? "Cargando..." : "Actualizar historial" }}
      </button>
    </div>

    <div class="import-layout">
      <article class="panel import-card">
        <div class="panel-header">
          <div>
            <h2>Nuevo reporte</h2>
            <p>Selecciona el archivo Excel y el periodo correspondiente.</p>
          </div>
        </div>

        <div class="upload-box">
          <label class="upload-drop">
            <input
              :key="fileInputKey"
              type="file"
              accept=".xlsx,.xls"
              @change="handleFileChange"
            />

            <span class="upload-icon">📄</span>

            <strong>
              {{ selectedFile ? selectedFile.name : "Seleccionar archivo Excel" }}
            </strong>

            <small>
              Formatos permitidos: .xlsx / .xls
            </small>
          </label>

          <div class="import-form-grid">
            <div class="filter-field">
              <label>Periodo</label>
              <input v-model="periodo" type="month" />
            </div>

            <button class="primary-button" :disabled="loadingUpload || !selectedFile" @click="uploadFile">
              {{ loadingUpload ? "Importando..." : "Importar reporte" }}
            </button>
          </div>
        </div>

        <div v-if="error" class="error-box">
          {{ error }}
        </div>

        <div v-if="successMessage" class="success-box">
          {{ successMessage }}
        </div>

        <div v-if="lastResult" class="import-result-grid">
          <article class="import-result-card">
            <span>Registros</span>
            <strong>{{ formatNumber(lastResult.total_registros) }}</strong>
          </article>

          <article class="import-result-card">
            <span>Insertados</span>
            <strong>{{ formatNumber(lastResult.registros_insertados) }}</strong>
          </article>

          <article class="import-result-card warning">
            <span>Duplicados</span>
            <strong>{{ formatNumber(lastResult.registros_duplicados) }}</strong>
          </article>

          <article class="import-result-card">
            <span>Piezas negadas</span>
            <strong>{{ formatNumber(lastResult.total_piezas_negadas) }}</strong>
          </article>

          <article class="import-result-card money">
            <span>Monto 1</span>
            <strong>{{ formatMoney(lastResult.total_valor_no_surt_1) }}</strong>
          </article>

          <article class="import-result-card money">
            <span>Monto 2</span>
            <strong>{{ formatMoney(lastResult.total_valor_no_surt_2) }}</strong>
          </article>
        </div>
      </article>

      <article class="panel import-card">
        <div class="panel-header">
          <div>
            <h2>Resumen de clasificación</h2>
            <p>Resultado de la última importación.</p>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Clasificación</th>
                <th>Eventos</th>
                <th>Piezas</th>
                <th>Monto 1</th>
                <th>Monto 2</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in resumenClasificacionRows" :key="item.clasificacion">
                <td>
                  <span class="status-pill" :class="`status-${item.clasificacion}`">
                    {{ formatClasificacion(item.clasificacion) }}
                  </span>
                </td>
                <td>{{ formatNumber(item.eventos) }}</td>
                <td>{{ formatNumber(item.piezas) }}</td>
                <td>{{ formatMoney(item.valor_no_surt_1) }}</td>
                <td>{{ formatMoney(item.valor_no_surt_2) }}</td>
              </tr>

              <tr v-if="!resumenClasificacionRows.length">
                <td colspan="5" class="empty-cell">
                  Aún no hay resumen de importación.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>

    <article class="panel">
      <div class="panel-header">
        <div>
          <h2>Histórico de importaciones</h2>
          <p>Reportes cargados en el sistema.</p>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Periodo</th>
              <th>Archivo</th>
              <th>Registros</th>
              <th>Insertados</th>
              <th>Duplicados</th>
              <th>Piezas</th>
              <th>Monto 1</th>
              <th>Monto 2</th>
              <th>Fecha carga</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in importaciones" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.periodo }}</td>
              <td class="text-left">{{ item.archivo_nombre }}</td>
              <td>{{ formatNumber(item.total_registros) }}</td>
              <td>{{ formatNumber(item.registros_insertados) }}</td>
              <td>{{ formatNumber(item.registros_duplicados) }}</td>
              <td>{{ formatNumber(item.total_piezas_negadas) }}</td>
              <td>{{ formatMoney(item.total_valor_no_surt_1) }}</td>
              <td>{{ formatMoney(item.total_valor_no_surt_2) }}</td>
              <td>{{ item.creado_en }}</td>
            </tr>

            <tr v-if="!importaciones.length">
              <td colspan="10" class="empty-cell">
                Todavía no hay importaciones registradas.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { negadosApi } from "../api/negadosApi";
import {
  formatClasificacion,
  formatMoney,
  formatNumber
} from "../utils/formatters";

const emit = defineEmits(["imported"]);

const loadingUpload = ref(false);
const loadingImports = ref(false);
const error = ref("");
const successMessage = ref("");

const selectedFile = ref(null);
const periodo = ref(getCurrentPeriodo());
const fileInputKey = ref(0);

const importaciones = ref([]);
const lastResult = ref(null);

const resumenClasificacionRows = computed(() => {
  const resumen = lastResult.value?.resumen_clasificacion || {};

  return Object.entries(resumen).map(([clasificacion, values]) => ({
    clasificacion,
    eventos: values.eventos || 0,
    piezas: values.piezas || 0,
    valor_no_surt_1: values.valor_no_surt_1 || 0,
    valor_no_surt_2: values.valor_no_surt_2 || 0
  }));
});

function getCurrentPeriodo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function handleFileChange(event) {
  const file = event.target.files?.[0];

  error.value = "";
  successMessage.value = "";

  if (!file) {
    selectedFile.value = null;
    return;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!["xlsx", "xls"].includes(extension)) {
    selectedFile.value = null;
    error.value = "Solo se permiten archivos Excel .xlsx o .xls.";
    fileInputKey.value += 1;
    return;
  }

  selectedFile.value = file;
}

async function uploadFile() {
  try {
    if (!selectedFile.value) {
      error.value = "Selecciona un archivo Excel.";
      return;
    }

    loadingUpload.value = true;
    error.value = "";
    successMessage.value = "";

    const response = await negadosApi.importarReporteNegados(selectedFile.value, periodo.value);

    lastResult.value = response.data || null;

    successMessage.value = response.message || "Reporte importado correctamente.";

    selectedFile.value = null;
    fileInputKey.value += 1;

    await loadImportaciones();

    emit("imported", lastResult.value);
  } catch (err) {
    console.error(err);
    error.value = err.response?.data?.message || "No se pudo importar el reporte.";
  } finally {
    loadingUpload.value = false;
  }
}

async function loadImportaciones() {
  try {
    loadingImports.value = true;

    const data = await negadosApi.getImportacionesNegados();

    importaciones.value = data || [];
  } catch (err) {
    console.error(err);
    error.value = err.response?.data?.message || "No se pudo cargar el histórico de importaciones.";
  } finally {
    loadingImports.value = false;
  }
}

onMounted(() => {
  loadImportaciones();
});
</script>