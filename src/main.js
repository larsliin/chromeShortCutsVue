import { createApp } from 'vue';
import { createPinia } from 'pinia';
import mitt from 'mitt';
const emitter = mitt();
import './style.css';
import '@mdi/font/css/materialdesignicons.css'
import App from './App.vue';

import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

const pinia = createPinia();

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'light',
      }
});

const app = createApp(App);

app.config.globalProperties.emitter = emitter;

app.use(pinia).use(vuetify).mount('#app');
