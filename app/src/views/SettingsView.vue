<script setup>
defineProps({ model: { type: Object, required: true } });
defineEmits(['save', 'folder']);
</script>

<template>
<main class="su-split-view__main"><header class="extension-page-header"><div class="extension-title-row"><div><h1 class="su-heading-2">Einstellungen</h1><p class="extension-muted">Ordner und Verbindung zu Schule-Intern einrichten.</p></div><button type="submit" form="updater-settings" class="su-button">Speichern <span aria-hidden="true">✓</span></button></div></header><div class="extension-container updater-content"><form id="updater-settings" @submit.prevent="$emit('save')" class="su-panel">
              <div class="su-panel__body extension-grid-2">
                <div class="extension-stack">
                  <h2 class="su-heading-3">Lokale Quelle</h2>
                  <div class="su-field"><label class="su-label" for="interval">Intervall in Minuten</label><input id="interval" class="su-input" v-model="model.intervalMin" type="number" min="1" step="1" required placeholder="120"><p class="extension-muted">Zeit zwischen zwei automatischen Prüfungen.</p></div>
                  <div class="su-field"><label class="su-label" for="folder">Lokaler Ordner</label><input id="folder" class="su-input" :value="model.folder" readonly placeholder="Kein Ordner ausgewählt" aria-describedby="folder-help folder-acl-help"><div><button type="button" class="su-button su-button--secondary" @click="$emit('folder')">Ordner auswählen <span aria-hidden="true">↗</span></button></div><p id="folder-help" class="extension-muted">Quellordner der HTML-Exporte. Empfohlen: „Lehrer heute“ mit vollständigem Datenumfang.</p><p id="folder-acl-help" class="extension-muted">Ansichten und Benutzergruppen werden über die ACL-Regeln in Schule-Intern gesteuert.</p></div>
                </div>
                <div class="extension-stack">
                  <h2 class="su-heading-3">Serververbindung</h2>
                  <div class="su-field"><label class="su-label" for="api-url">API-URL</label><input id="api-url" class="su-input" v-model="model.apiUrl" type="url" required placeholder="https://schule.de/rest.php/vplan/updater" spellcheck="false"><p class="extension-muted">Adresse des V-Plan-Updater-Endpunkts.</p></div>
                  <div class="su-field"><label class="su-label" for="api-key">API-Schlüssel</label><input id="api-key" class="su-input" v-model="model.apiKey" type="text" required autocomplete="off" spellcheck="false"><p class="extension-muted">Zugangsschlüssel aus der Schulverwaltung.</p></div>
                </div>
              </div>
            </form></div></main>
</template>
