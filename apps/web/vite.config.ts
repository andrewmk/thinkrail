import { fileURLToPath } from "node:url";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

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
		plugins: [
			react(),
			babel({ presets: [reactCompilerPreset()] }),
			tailwindcss(),
			VitePWA({
				strategies: "generateSW",
				// Registration is the app's call (main.tsx): the desktop webview must never run the
				// shell through a precache, so the auto-injected registerSW script stays off.
				injectRegister: null,
				registerType: "autoUpdate",
				devOptions: { enabled: false },
				manifest: {
					name: "ThinkRail",
					short_name: "ThinkRail",
					description: "The agentic IDE that gets better every time you use it",
					id: "/",
					start_url: "/",
					scope: "/",
					display: "standalone",
					background_color: "#000000",
					theme_color: "#000000",
					icons: [
						{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
						{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
						{
							src: "/icons/icon-maskable-512.png",
							sizes: "512x512",
							type: "image/png",
							purpose: "maskable",
						},
					],
				},
				includeAssets: ["favicon.svg", "icons/*.png", "custom-icons/*.svg"],
				workbox: {
					// precache the built shell; host routes (/ws /files /blob /fonts) stay
					// network-only and are never navigation fallbacks. The local cache is disk
					// on the user's own machine, so the lazy Monaco chunk (3.3 MB) is cached too
					maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
					globPatterns: ["**/*.{js,css,html,svg,png,woff2,webmanifest}"],
					navigateFallback: "/index.html",
					navigateFallbackDenylist: [/^\/(ws|files|blob|fonts)([/?#]|$)/],
				},
			}),
		],
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
