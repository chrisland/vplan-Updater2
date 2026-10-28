<script setup>
defineProps({ model: { type: Object, required: true }, log: { type: String, default: '' } });
defineEmits([]);
</script>

<template>
<main class="su-split-view__main"><header class="extension-page-header"><div class="extension-title-row"><div><h1 class="su-heading-2">Protokoll</h1><p class="extension-muted">Aktivitäten und Meldungen der Übertragung.</p></div></div></header><div class="extension-container updater-content"><section class="su-panel"><div class="su-panel__header"><h2 class="su-heading-3">Aktivitätsprotokoll</h2><span class="extension-muted">Letzte 100 Meldungen</span></div><div class="su-panel__body updater-console" role="log" aria-label="Synchronisierungsprotokoll"><div v-if="model.konsole.length" v-html="log"></div><p v-else class="extension-muted">Noch keine Aktivitäten vorhanden.</p></div></section></div></main>
</template>
