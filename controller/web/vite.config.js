import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	server: {
		host: true, // Makes it accessible on LAN (e.g. from phone)
		port: 5173, // Can be any open port
		strictPort: true,
	},
});
