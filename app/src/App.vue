<script>


import {Store} from '@tauri-apps/plugin-store';
import {BaseDirectory, readDir} from '@tauri-apps/plugin-fs';
import {upload} from '@tauri-apps/plugin-upload';
import {open} from '@tauri-apps/plugin-dialog';

const store = new Store('store.bin');

export default {
  components: {},
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

      //this.konsole.push('Send data....' );

      
      const res = await upload( // get on server with php://input
          this.apiUrl + '/' + file,
          filepath,
          ({progress, total, e}) => {
            console.log('upload:', `Uploaded ${progress} of ${total} bytes`)
            //this.konsole.push('Upload: ' + file + ' (' + Math.round((progress / total) * 100) + '%)');
          }, // a callback that will be called with the upload progress
          {
            'Content-Type': 'text/plain',
            "auth-app": this.apiKey,
            'auth-session': "false"
          } // optional headers to send with the request
      ).catch((error) => {
        console.log('---+++++Upload Error:', error);
        this.konsole.push('<span style="color:red">Upload Error:</span><i>' + filepath +'</i>');
        this.konsole.push('<i style="color:red">Error Code: ' + error+'</i>' );
        this.intervalToggle--;

      });
      console.log('-----   upload:', res)
      //console.log(res)
      if (res) {

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


<div>
  <div class="container container-home" v-if="page == 'home'">
    <div class="header">
      <div class="logo"></div>
    </div>
    <div class="nav">
        <button class="si-btn si-btn-icon si-btn-border icon-console" @click="handlerPage('console')"></button>
        <button class="si-btn si-btn-icon si-btn-border icon-settings" @click="handlerPage('settings')"></button>
    </div>
    <div class="main">
      
      <div class="">
        <div class="power" :class="{'active' : this.power == true}" @click="handlerPower"></div>
        <div v-if="!this.power" class="mainMain"><b>Aus</b></div>
        <div v-else-if="lastUpload" class="mainMain">Letzter Upload:<br>{{lastUpload}}</div>
      </div>
      <div @click="handlerSyncNow" class="si-btn si-btn-small si-btn-light">Sync ausführen</div>
      
    </div>
    <footer>
      <div v-if="intervalToggle > 1"><b>Status:</b> ({{intervalToggle}}) Daten werden übertragen...</div>
      <div v-else-if="power">Synchronisierung alle {{intervalMin}} Minuten</div>
      <div v-else>Synchronisierung: Aus</div>
    </footer>
  </div>

  <div class="container container-console" v-if="page == 'console'">
    <div class="header">
      <button class="si-btn si-btn-icon si-btn-border icon-back" @click="handlerPage('home')"></button>
    </div>
    <div class="nav"></div>
    <div class="main">
      <div class="console">
        <p><b>Konsole:</b></p>
        <div v-html="getKonsole"></div>
      </div>
    </div>
  </div>

  <div class="container container-settings" v-if="page == 'settings'">
    <div class="header">
      <button class="si-btn si-btn-icon si-btn-border icon-back" @click="handlerPage('home')"></button>
      <button class="si-btn si-btn-icon si-btn-green margin-l-s icon-save" @click="handlerSave"></button>
    </div>
    <div class="nav"></div>
    <div class="main">
      <ul class="noListStyle">
        <li>
          <label>Interval in Minuten</label>
          <input v-model="intervalMin" placeholder="120">
          <div class="text-small">{{intervalTime}} Millisekunden</div>
        </li>
        <li>
          <label>Lokaler Ordner</label>
          <input v-model="folder" readonly @click="handlerFolder" class="curser">
        </li>
        <!--
        <li>
          <label>Ordner Prefix Lehrer/innen</label>
          <input v-model="folderPrefixTeacher" placeholder="prefix_">
        </li>
        <li>
          <label>Ordner Prefix Schüler/innen</label>
          <input v-model="folderPrefixPupil" placeholder="prefix_">
        </li>
        -->
        <li>
          <label>API URL</label>
          <input v-model="apiUrl" placeholder="https://www.....de/rest.php/vplan/updater">
        </li>
        <li>
          <label>API Key</label>
          <input v-model="apiKey">
        </li>
      </ul>
    </div>
    <footer>
    </footer>
  </div>


</div>

</template>

<style>

@import './assets/style/grid.css';
@import './assets/style/style.css';
@import './assets/style/si-components.css';

footer {
  padding-right: 0.6rem;
  padding-left: 0.6rem;
  padding-top: 0.2rem;
  text-align: right;
  font-size: 80%;
  background: #222;
  color: #ccc;
  border-top: 1px solid #d2d6de;
}
.container {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: 3rem 2rem calc(100vh - 6.4rem) 1.4rem;

}

.container .header {
  display: flex;
  padding-right: 0.6rem;
  padding-left: 0.6rem;
  background-color: #738b96;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px;
}
.container .nav {
  background-color: #95a9b3;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px;
  display: flex;
  justify-content: flex-end;
  align-items:center;
  padding-right: 0.6rem;
  padding-left: 0.6rem;
  overflow: auto;
}
.container .nav button {
  border: none;
  border-radius: 0;
}
.container .nav button:hover {
    background-color: #81929a;

}
.container .main {
  display: grid;
  justify-items:center;
  align-items:center;
  padding: 1rem;
  overflow: auto;
}
.mainMain {
  text-align: center;
  padding-top: 1rem;
  font-size: 90%;
}

.console {
  width: 100%;
  height: 100%;
  font-size: 90%;
  display: flex;
  flex-direction: column;
}


.container-home .header {
  justify-content: space-between;
}


.logo {
  background-image: url('./assets/style/logo.png');
  background-position: left center;
  background-size: auto 100%;
  background-repeat: no-repeat;
  height: 95%;
  width: 10rem;
}

.power {
  cursor: pointer;
  align-self: center;
  background-image: url('./assets/style/icons/power-off-solid.svg');
  background-position: center;
  background-size: auto 100%;
  background-repeat: no-repeat;
  height: 30vw;
  width: 30vw;
}
.power:hover {
  opacity: 0.8;
}

.power.active {
  background-image: url('./assets/style/icons/power-off-solid_green.svg');
}

.icon-settings {
  background-image: url('./assets/style/icons/cogs-solid.svg');
  background-position: center;
  background-size: auto 45%;
  background-repeat: no-repeat;
  opacity: 0.6;
}

.icon-console {
  background-image: url('./assets/style/icons/console-solid.svg');
  background-position: center;
  background-size: auto 45%;
  background-repeat: no-repeat;
  opacity: 0.6;
}

.icon-back {
  background-image: url('./assets/style/icons/arrow-left-solid.svg');
  background-position: center;
  background-size: auto 50%;
  background-repeat: no-repeat;
}

.icon-save {
  background-image: url('./assets/style/icons/check-solid.svg');
  background-position: center;
  background-size: auto 50%;
  background-repeat: no-repeat;
}



ul {
  width: 100%;
}

ul li {
  display: flex;
  flex-direction: column;
  padding-top:0.6rem;
  padding-bottom:0.3rem;
}

ul li label {
  padding-bottom:0.2rem;

}


</style>
