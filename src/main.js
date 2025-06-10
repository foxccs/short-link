/*
 * @Author: zi.yang
 * @Date: 2025-06-09 19:48:31
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-06-10 14:54:39
 * @Description: 
 * @FilePath: /short-link/src/main.js
 */
import './assets/main.css';
import '@arco-design/web-vue/dist/arco.css';

import { createApp } from 'vue';

import App from './App.vue';
import router from './router';

const app = createApp(App)

app.use(router)
app.mount('#app')