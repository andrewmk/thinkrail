import { fileURLToPath } from "node:url";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function envPort(name: string): number | undefined {
	const raw = process.env[name];
	if (raw === undefined) return undefined;
	const port = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
	if (port >= 0 && port <= 65535) return port;
	console.warn(`vite: ignoring invalid ${name}=${raw}`);
	return undefined;
}

const hostPort = envPort("THINKRAIL_PORT") ?? 24242;
const webPort = envPort("THINKRAIL_WEB_PORT");
const host = process.env.THINKRAIL_HOST ?? "localhost";
const proxyHost = host === "0.0.0.0" || host === "::" ? "localhost" : host;

export default defineConfig(({ mode }) => {
	const profile = mode === "profile";
	return {
		plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
		resolve: {
			alias: [
				{ find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
				...(profile ? [{ find: /^react-dom\/client$/, replacement: "react-dom/profiling" }] : []),
			],
		},
		server: {
			host,
			port: webPort ?? 24269,
			strictPort: webPort !== undefined,
			proxy: {
				"/ws": {
					target: `ws://${proxyHost}:${hostPort}`,
					ws: true,
				},
				"/files": { target: `http://${proxyHost}:${hostPort}` },
				"/blob": { target: `http://${proxyHost}:${hostPort}` },
				"/fonts": { target: `http://${proxyHost}:${hostPort}` },
			},
		},
		worker: { format: "es" },
		build: profile ? { outDir: "dist-profile", minify: false } : { outDir: "dist" },
	};
});
