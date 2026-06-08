<template>
  <article class="kpi-card" :class="toneClass">
    <div class="kpi-top">
      <span class="kpi-icon">{{ icon }}</span>
      <span class="kpi-label">{{ title }}</span>
    </div>

    <strong class="kpi-value">{{ value }}</strong>

    <p v-if="subtitle" class="kpi-subtitle">
      {{ subtitle }}
    </p>
  </article>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ""
  },
  icon: {
    type: String,
    default: "●"
  },
  tone: {
    type: String,
    default: "default"
  }
});

const toneClass = computed(() => `tone-${props.tone}`);
</script>