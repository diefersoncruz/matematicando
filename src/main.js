import { createApp } from "vue";
import App from "./App.vue";
import "./assets/css/style.css";
import router from "./router.js";

const app = createApp(App);

// Use o Vue Router
app.use(router);

app.mount("#app");
