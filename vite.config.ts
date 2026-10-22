import {defineConfig} from 'vite';

export default defineConfig({
    base: '/blade-of-the-summit/', 
    server: {
        port: 3000,
        open: true,
    },
    build: {
        chunkSizeWarningLimit: 1500,
        assetsInlineLimit: 4096,
    },
});
