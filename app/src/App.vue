<script>


import {Store} from '@tauri-apps/plugin-store';
import {BaseDirectory, readDir, readFile, writeFile, remove} from '@tauri-apps/plugin-fs';
import {tempDir, join} from '@tauri-apps/api/path';
import {appendUpload, decodeHtml} from './lib/upload-history.js';
import UploadsView from './views/UploadsView.vue';
import {upload} from '@tauri-apps/plugin-upload';
import {open} from '@tauri-apps/plugin-dialog';

import OverviewView from './views/OverviewView.vue';
import ProtocolView from './views/ProtocolView.vue';
import SettingsView from './views/SettingsView.vue';

const store = new Store('store.bin');

export default {
  components: { OverviewView, ProtocolView, SettingsView, UploadsView },
  data() {
    return {
      page: "home",
      interval: false,
      intervalToggle: 0,
      intervalTime: 5000,
      lastUpload: '',

      intervalMin: '',
      folder: "",
      apiUrl: "",
      apiKey: "",
      power: false,
      uploadHistory: [],
      historyWrite: Promise.resolve(),
      konsole: []
    };
  },
  created() {
    this.load();

  },
  computed: {
    getKonsole() {
      if (this.konsole.length > 100) {
        this.konsole = this.konsole.slice(this.konsole.length - 100, this.konsole.length);
      }
      return this.konsole.join('<br>');
    }
  },
  methods: {

    async load() {
      await this.historyWrite.catch(() => {});

      this.uploadHistory = (await store.get('uploadHistory') || []).slice(0, 10);
      this.folder = await store.get('folder');
      this.power = await store.get('power');
      this.apiUrl = await store.get('apiUrl');
      this.apiKey = await store.get('apiKey');
      this.intervalMin = await store.get('intervalMin');
      this.intervalTime = await store.get('intervalTime');
      this.lastUpload = await store.get('lastUpload');

      this.watchFolder();

    },
    async handlerFolder() {

      const file = await open({
        multiple: false,
        directory: true,
      });
      if (file) {
        this.folder = file;
        await store.set('folder', file);
        await store.save();
      }

    },
    async watchFolder() {

      if (this.power) {
        this.konsole.push(' Synchronisierung gestartet...');
        if (this.folder && this.apiUrl && this.apiKey && this.intervalTime) {
          console.log(this.intervalTime)
          this.interval = setInterval(this.handlerInterval, this.intervalTime);
          console.log('Interval:',this.interval);
          this.konsole.push('Überwache Ordner: <i>' + this.folder + '</i> alle ' + this.intervalMin + ' Minuten');
        } else {
          this.handlerPage('settings');
        }
      } else {
        this.konsole.push('Synchronisierung ausgeschaltet');
        if (this.interval) {
          clearInterval(this.interval);
        }
      }

    },

    async sendData( file) {

      const filepath = this.folder + '/' + file;
      if (!filepath) {
        return false;
      }

      
      console.log('sendData:', filepath)
      this.intervalToggle++;

      let res;
      let snapshotPath;
      let bytes;
      const destination = this.apiUrl + '/' + file;
      try {
        bytes = await readFile(filepath);
        snapshotPath = await join(await tempDir(), 'vplan-upload-' + crypto.randomUUID() + '.htm');
        await writeFile(snapshotPath, bytes);
        // Upload the same immutable snapshot that is retained in the history.
        res = await upload(destination, snapshotPath, undefined, {
          'Content-Type': 'text/plain',
          'auth-app': this.apiKey,
          'auth-session': 'false'
        });
      } catch (error) {
        console.error('Upload fehlgeschlagen:', error);
        this.konsole.push('Upload fehlgeschlagen: ' + file);
        this.intervalToggle--;
        return;
      } finally {
        if (snapshotPath) {
          await remove(snapshotPath).catch(error => console.error('Temporäre Upload-Datei konnte nicht entfernt werden:', error));
        }
      }
      const entry = {
        id: crypto.randomUUID(),
        filename: file,
        uploadedAt: new Date().toISOString(),
        destination,
        size: bytes.byteLength,
        html: decodeHtml(bytes)
      };
      this.uploadHistory = appendUpload(this.uploadHistory, entry);
      const history = JSON.parse(JSON.stringify(this.uploadHistory));
      // Serialize writes so simultaneous uploads cannot overwrite newer entries.
      this.historyWrite = this.historyWrite.catch(() => {}).then(async () => {
        await store.set('uploadHistory', history);
        await store.save();
      });
      this.historyWrite.catch(error => {
        console.error('Upload-Verlauf konnte nicht gespeichert werden:', error);
        this.konsole.push('Upload-Verlauf konnte nicht lokal gespeichert werden.');
      });
      console.log('-----   upload:', res)
      //console.log(res)
      {

        if (this.intervalToggle > 0) {
          this.intervalToggle--;
          this.lastUpload = this.getCurrentTimeInGermanFormat();
          store.set('lastUpload', this.lastUpload);
          this.konsole.push('Upload beendet: <i>' + filepath+'</i>');
          if (this.intervalToggle == 0) {
            this.konsole.push('<span style="color:green">Alle Daten übertragen.</span>');
            
            // Push
            this.konsole.push('Server verarbeitet Daten...');
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open( "POST", this.apiUrl + '/parseUpload', false ); // false for synchronous request
            xmlHttp.setRequestHeader("auth-app", this.apiKey);
            xmlHttp.setRequestHeader("auth-session", false);
            xmlHttp.send( null );
            console.log( '--------Server ------', xmlHttp.responseText );
            let ret = JSON.parse(xmlHttp.responseText);
            if (ret.error && ret.error != false) {
              this.konsole.push('<span style="color:red">Fehler bei der Verarbeitung auf dem Server.</span>' );
            } else {
              this.konsole.push('<span style="color:green">Daten erfolgreich auf dem Server verarbeitet.</span>' );
            }
            //this.konsole.push('Server verarbeitet Daten...' );
            

            }
        }
      }
      




    },

    getCurrentTimeInGermanFormat() {
      const now = new Date();

      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Monate sind 0-indexiert
      const year = now.getFullYear();

      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      //return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
      return `${day}.${month}. ${hours}:${minutes}`;
    },
    handlerInterval() {

      console.log('handlerInterval');  
      if (this.power) {

        console.log('power on');
        this.konsole.push(this.getCurrentTimeInGermanFormat()+' Ordner scannen... ');
        /*readDir(this.folder, {baseDir: BaseDirectory.Home}).then((folders) => {
          
          folders.forEach((folder) => {
            console.log('found folder:', folder.name);
            if (folder.isDirectory) {
              console.log('found folder to check:', folder.name,'in', this.getFolderNames());
              
              if (this.getFolderNames().includes(folder.name)) {
                this.konsole.push('Ordner gefunden: <i>' + folder.name+'</i>');
*/
                readDir(this.folder , {baseDir: BaseDirectory.Home}).then((files) => {
                  console.log('found files in folder:',  files);
                  files.forEach(async (file) => {
                    if (file.name && file.isFile && file.name.indexOf('.htm') > -1 ) {
                      this.konsole.push('Datei gefunden: ' + file.name);
                      console.log('found file to upload:', file.name);
                      this.sendData( file.name );
                    }
                  })
                });
             /* }
            }
          })
         
        }); */
      } else {
        console.log('power off');
      }

    },

    handlerSave() {

      //store.set('folderPrefixTeacher', this.folderPrefixTeacher);
      //store.set('folderPrefixPupil', this.folderPrefixPupil);
      store.set('apiUrl', this.apiUrl);
      store.set('apiKey', this.apiKey);
      store.set('intervalMin', this.intervalMin);
      if (this.intervalMin) {
        this.intervalTime = this.intervalMin * 60 * 1000;
        store.set('intervalTime', this.intervalTime);
      }
      store.save();

      this.handlerPage();
      //this.handlerPower();
    },

    handlerPower() {
      this.power = !this.power;
      store.set('power', this.power);
      store.save();

      if (this.power) {
        this.load();
      } else {
        console.log('kill', this.interval)
        clearInterval(this.interval);
      }

    },

    handlerSyncNow() {
      this.handlerInterval();
    },

    handlerPage(page) {
      if (!page) {
        page = 'home';
      }
      this.page = page;
    }
  },
};


</script>

<template>
  <div class="su-theme extension-ui updater-ui">
    <header class="updater-titlebar">
      <div class="updater-brand"><img src="./assets/style/logo.png" alt="Schule-Intern Vertretungsplan-Updater 2.x" title="Schule-Intern Vertretungsplan-Updater 2.x"></div>
    </header>
    <nav class="updater-navigation su-button-group" aria-label="Hauptnavigation">
      <button v-for="item in [{id: 'home', label: 'Übersicht'}, {id: 'console', label: 'Protokoll'}, {id: 'uploads', label: 'Übertragungen'}, {id: 'settings', label: 'Einstellungen'}]" :key="item.id" class="su-button su-button-group__item" :aria-current="page === item.id ? 'page' : undefined" @click="handlerPage(item.id)">{{ item.label }}</button>
    </nav>
    <section class="updater-workspace">
      <OverviewView v-if="page === 'home'" :model="$data" @power="handlerPower" @sync="handlerSyncNow" />
      <ProtocolView v-else-if="page === 'console'" :model="$data" :log="getKonsole" />
      <UploadsView v-else-if="page === 'uploads'" :entries="uploadHistory" />
      <SettingsView v-else-if="page === 'settings'" :model="$data" @save="handlerSave" @folder="handlerFolder" />
    </section>
    <footer class="updater-footer" role="status">{{ intervalToggle > 0 ? 'Daten werden übertragen …' : power ? 'Automatische Synchronisierung aktiv' : 'Automatische Synchronisierung ausgeschaltet' }}</footer>
  </div>
</template>

<style>
@import './assets/schul-ui/schul-ui.css';
* { box-sizing: border-box; }
body { margin: 0; font-size: 14px; }
button, input { font-family: inherit; }
.updater-ui { min-height: 100vh; border: 0; display: flex; flex-direction: column; }
.updater-titlebar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 24px; background: #738b96; border-bottom: 1px solid var(--su-color-border); }
.updater-brand { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.updater-brand img { display: block; width: 174px; max-width: 100%; height: auto; }
.updater-brand > span, .updater-version { color: var(--su-color-muted); font-size: 12px; }
.updater-navigation { flex-wrap: wrap; display: flex; max-width: none; padding-left: 24px; }
.updater-workspace { flex: 1; }
.updater-workspace > .su-split-view { min-height: 100%; }
.updater-side-panel { align-self: start; padding-top: 0; padding-bottom: 24px; }
.updater-content { display: grid; gap: var(--su-space-3); }
.updater-summary { display: grid; justify-items: start; gap: 20px; }
.updater-sync-icon { padding: 16px; border-radius: var(--su-radius-panel); background: var(--su-color-surface-soft); color: var(--su-color-muted); }
.updater-sync-icon.is-active { color: var(--su-color-primary); background: var(--su-color-primary-soft); }
.updater-sync-icon svg { width: 32px; height: 32px; display: block; }
.updater-last-upload { display: grid; gap: 4px; padding-top: 16px; width: 100%; border-top: 1px solid var(--su-color-border); }
.updater-folder { overflow-wrap: anywhere; }
.updater-status { display: grid; grid-template-columns: 100px minmax(0, 1fr); gap: 6px 12px; font-size: 13px; margin: 12px 0 0; }
.updater-status dt { color: var(--su-color-muted); }
.updater-status dd { margin: 0; overflow-wrap: anywhere; font-weight: 600; }
.updater-success { color: var(--su-color-primary); }
.updater-console { min-height: 280px; max-height: 60vh; overflow: auto; overflow-wrap: anywhere; font: 12px/1.9 ui-monospace, SFMono-Regular, Consolas, monospace; }
.updater-footer { padding: 8px 24px; border-top: 1px solid var(--su-color-border); background: var(--su-color-surface-soft); color: var(--su-color-text-soft); font-size: 12px; }
@media (max-width: 960px) { .updater-side-panel { margin: 0 24px; padding-top: 0; } }
@media (max-width: 480px) { .updater-version { display: none; } .updater-titlebar { padding: 10px 24px; } .updater-navigation { padding-left: 0; } .updater-navigation .su-button { flex: 1; padding-inline: 12px; } }
</style>
