import { mount } from "svelte";
import App from "./App.svelte";

const target = document.getElementById("app");
const app = target ? mount(App, { target }) : null;
if (!app) console.error("Style Advisor: #app root element not found");
export default app;
