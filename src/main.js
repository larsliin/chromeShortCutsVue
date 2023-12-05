import { createApp } from 'vue';
import { createPinia } from 'pinia';
import mitt from 'mitt';
import './style.css';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import App from './App.vue';
import AppPopup from './AppPopup.vue';

const emitter = mitt();

const pinia = createPinia();

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        dark: true,
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
                },
            },
            dark: {
                dark: true,
                variables: {},
                colors: {
                    primary: '#91BED4',
                    anchor: '#f00',
                    secondary: '#f00',
                },
              },
        },
    },
});

const appElement = document.getElementById('app');

if (appElement) {
    const app = createApp(App);
    app.config.globalProperties.emitter = emitter;
    app.use(pinia).use(vuetify).mount('#app');
}

const appPopupElement = document.getElementById('appPopup');

if (appPopupElement) {
    const appPopup = createApp(AppPopup);
    appPopup.config.globalProperties.emitter = emitter;
    appPopup.use(pinia).use(vuetify).mount('#appPopup');
}
