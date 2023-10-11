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
        defaultTheme: 'light',
      },
});

const app = createApp(App);
app.config.globalProperties.emitter = emitter;
app.use(pinia).use(vuetify).mount('#app');

const appPopup = createApp(AppPopup);
appPopup.config.globalProperties.emitter = emitter;
appPopup.use(pinia).use(vuetify).mount('#appPopup');
