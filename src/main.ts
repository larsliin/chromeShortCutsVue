import { createApp } from 'vue';
import { createPinia } from 'pinia';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import App from './App.vue';
import AppPopup from './AppPopup.vue';

const pinia = createPinia();

const vuetify = createVuetify({
    components,
    directives,
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
        },
    },
    theme: {
        defaultTheme: 'dark',
        themes: {
            light: {
                colors: {
                    primary: '#003354',
                    secondary: '#91BED4',
                    accent: '#82B1FF',
                    error: '#FF5252',
                    info: '#2196F3',
                    success: '#4CAF50',
                    warning: '#FB8C00',
                    'bookmark-surface': '#e0e6ea',
                },
            },
            dark: {
                dark: true,
                colors: {
                    primary: '#91BED4',
                    anchor: '#f00',
                    secondary: '#f00',
                    'bookmark-surface': '#575757',
                },
            },
        },
    },
});

const appElement = document.getElementById('app');

if (appElement) {
    createApp(App).use(pinia).use(vuetify).mount('#app');
}

const appPopupElement = document.getElementById('appPopup');

if (appPopupElement) {
    createApp(AppPopup).use(pinia).use(vuetify).mount('#appPopup');
}
