import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	server: {
		host: true, // allows access via LAN IP (0.0.0.0)
		port: 5173, // or whatever port you prefer
		strictPort: true,
	},
});
