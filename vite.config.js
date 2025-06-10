/*
 * @Author: zi.yang
 * @Date: 2025-06-09 19:48:21
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-06-10 14:54:28
 * @Description: 
 * @FilePath: /short-link/vite.config.js
 */
import { fileURLToPath, URL } from 'node:url';

import AutoImport from 'unplugin-auto-import/vite';
import { ArcoResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';

import { vitePluginForArco } from '@arco-plugins/vite-vue';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ArcoResolver()],
    }),
    Components({
      resolvers: [
        ArcoResolver({
          sideEffect: true
        })
      ]
    }),
    vitePluginForArco({
      style: 'css'
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/u': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})