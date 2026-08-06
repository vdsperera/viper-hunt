/**
 * Viper Hunt - Main Entry Point
 * Wires dependencies and initiates Game Loop via App Bootstrapper
 */
import { App } from './App.js';

const app = new App();
app.start().catch(err => {
    console.error("[main] Fatal Application Error:", err);
});
