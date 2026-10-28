<script setup>
import {computed, ref} from 'vue';
import {previewDocument} from '../lib/upload-history.js';

const props = defineProps({entries: {type: Array, default: () => []}});
const selectedId = ref(null);
const selected = computed(() => props.entries.find(entry => entry.id === selectedId.value) || props.entries[0]);
const documentHtml = computed(() => previewDocument(selected.value?.html || ''));
const dateLabel = value => new Date(value).toLocaleString('de-DE');
</script>

<template>
  <div class="su-split-view">
    <main class="su-split-view__main">
      <header class="extension-page-header">
        <h1 class="su-heading-2">Übertragungen</h1>
        <p class="extension-muted">HTML-Inhalte der letzten zehn erfolgreichen Datei-Uploads.</p>
      </header>
      <div class="extension-container updater-content">
        <section v-if="selected" class="su-panel">
          <div class="su-panel__header uploads-detail-header">
            <div>
              <h2 class="su-heading-3 uploads-filename">{{ selected.filename }}</h2>
              <p class="extension-muted">{{ dateLabel(selected.uploadedAt) }} · {{ selected.size.toLocaleString('de-DE') }} Bytes</p>
              <p class="extension-muted uploads-destination">{{ selected.destination }}</p>
            </div>
          </div>
          <div class="su-panel__body">
            <iframe :key="selected.id" class="uploads-preview" :srcdoc="documentHtml" sandbox="" referrerpolicy="no-referrer" :title="'Hochgeladener Inhalt: ' + selected.filename"></iframe>
            <p class="extension-muted">Vorschau des hochgeladenen HTML-Dokuments.</p>
          </div>
        </section>
        <section v-else class="su-panel">
          <div class="su-panel__body">
            <h2 class="su-heading-3">Noch keine Übertragungen gespeichert</h2>
            <p class="extension-muted">Nach dem nächsten erfolgreichen Upload erscheint der übertragene Inhalt hier.</p>
          </div>
        </section>
      </div>
    </main>
    <aside class="extension-side-panel updater-side-panel" aria-label="Letzte Übertragungen">
      <section class="su-panel">
        <div class="su-panel__header"><h2 class="su-heading-3">Letzte Übertragungen</h2><span class="extension-muted">{{ entries.length }} / 10</span></div>
        <div class="su-panel__body uploads-list">
          <p v-if="!entries.length" class="extension-muted">Noch keine Datei hochgeladen.</p>
          <button v-for="entry in entries" :key="entry.id" type="button" class="uploads-entry" :class="{'is-selected': selected?.id === entry.id}" :aria-pressed="selected?.id === entry.id" @click="selectedId = entry.id">
            <strong>{{ entry.filename }}</strong>
            <span>{{ dateLabel(entry.uploadedAt) }}</span>
          </button>
        </div>
      </section>
    </aside>
  </div>
</template>

<style scoped>
.uploads-filename, .uploads-destination { overflow-wrap: anywhere; }
.uploads-detail-header { align-items: start; }
.uploads-preview { display: block; width: 100%; height: 55vh; min-height: 280px; border: 1px solid var(--su-color-border); border-radius: var(--su-radius-control); background: white; }
.uploads-list { display: grid; gap: var(--su-space-2); max-height: 65vh; overflow-y: auto; }
.uploads-entry { display: grid; gap: 4px; width: 100%; padding: 12px; text-align: left; border: 1px solid var(--su-color-border); border-radius: var(--su-radius-control); background: var(--su-color-surface); color: var(--su-color-text); cursor: pointer; font: inherit; overflow-wrap: anywhere; }
.uploads-entry span { color: var(--su-color-muted); font-size: 12px; }
.uploads-entry:hover { background: var(--su-color-surface-soft); }
.uploads-entry.is-selected { border-color: var(--su-color-primary); background: var(--su-color-primary-soft); }
.uploads-entry:focus-visible { outline: none; box-shadow: var(--su-shadow-focus); }
</style>
