import { createApp } from "vue";
import App from "./App.vue";

//import { TrayIcon } from '@tauri-apps/api/tray';

//console.log(TrayIcon)
//const tray =  TrayIcon.new({ tooltip: 'awesome tray tooltip' });
//console.log(tray)
//tray.setIconAsTemplate();
//tray.set_tooltip('new tooltip');
import { exists, BaseDirectory } from '@tauri-apps/plugin-fs';

createApp(App).mount("#app");


