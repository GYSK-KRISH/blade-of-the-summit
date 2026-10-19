import {defineConfig} from 'vite';

export default defineConfig({
    base: './',
    server: {
        port: 3000,
        open: true,
    },
    build: {
        chunkSizeWarningLimit: 1500,
        assetsInlineLimit: 4096,
    },
});
