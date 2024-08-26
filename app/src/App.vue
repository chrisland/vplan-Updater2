<script>

//import Greet from "./components/Greet.vue";
import {open} from '@tauri-apps/plugin-dialog';
import {Store} from '@tauri-apps/plugin-store';
import {BaseDirectory, readDir} from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';

const store = new Store('store.bin');

export default {
  components: {},
  data() {
    return {
      folder: "",
      folderPrefixTeacher: "lz_",
      folderPrefixPupil: "aula_",
      apiUrl: "https://www.schule-intern.de/rest.php/vplan/updater",
      apiKey: ""
    };
  },
  created() {
    this.load();
  },
  methods: {

    async load() {

      this.folder = await store.get('folder');
      console.log('val', this.folder)
      if (this.folder) {
        this.watchFolder();
      }

    },
    async handlerFolder() {

      const file = await open({
        multiple: false,
        directory: true,
      });
      if (file) {
        this.folder = file;
        await store.set('folder', {value: this.folder.value});
        await store.save();
        this.watchFolder();
      }

    },
    getFolderNames (name) {
      return [ this.folderPrefixTeacher+'heute', this.folderPrefixTeacher+'morgen', this.folderPrefixPupil+'heute', this.folderPrefixPupil+'morgen' ];
    },
    async watchFolder() {

      if (this.folder && this.folder.value) {
        console.log('watch-', this.folder.value)

        if (this.apiUrl) {
          const response = await fetch(this.apiUrl, {
            method: 'GET',
          });
          console.log(response)
        }


        readDir(this.folder.value,{baseDir: BaseDirectory.Home}).then((folders) => {

          folders.forEach((folder) => {
            if (folder.isDirectory) {

              if ( this.getFolderNames().includes(folder.name) ) {

                readDir(this.folder.value+'/'+folder.name,{baseDir: BaseDirectory.Home}).then((files) => {

                  files.forEach((file) => {
                    if (file.isFile) {
                      console.log(folder.name,file.name)


                    }
                  })
                });


              }
            }
          })
        });


        /*
        await watch(
            this.folder.value,
            (event) => {
              console.log('app.log event', event);
            },
            {
              baseDir: BaseDirectory.AppLog,
              recursive: true,
            }
        );
        */


      }

    }
  },
};


</script>

<template>
  <div class="container">
    <div class="container-home">
    </div>
    <div class="container-settings">
      <ul>
        <li>
          <label>Folder</label>
          <input v-model="folder" readonly>
          <button @click="handlerFolder">Folder</button>
        </li>
        <li>
          <label>folderPrefixTeacher:</label>
          <input v-model="folderPrefixTeacher">
        </li>
        <li>
          <label>folderPrefixPupil:</label>
          <input v-model="folderPrefixPupil">
        </li>
        <li>
          <label>apiUrl:</label>
          <input v-model="apiUrl">
        </li>
        <li>
          <label>apiKey:</label>
          <input v-model="apiKey">
        </li>
      </ul>
    </div>

  </div>
</template>

<style scoped>

</style>
