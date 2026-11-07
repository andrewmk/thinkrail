import "./index.css";
import { useT } from "@thinkrail/locales/react";
import { TooltipProvider } from "@thinkrail/ui/tooltip";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initChatPreferencesPersistence } from "./chat/chatPreferences";
import { initModelVisibilityPersistence } from "./chat/modelVisibility";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { registerWebExtensions } from "./extensions";
import { initializeFonts } from "./fonts";
import { useLocaleSync } from "./i18n";
import { initNavigation } from "./navigation";
import { initFilesTreePersistence } from "./panels/filesTreeState";
import { initProjectExpansionPersistence } from "./panels/projectExpansion";
import { initSearchPreferences } from "./search";
import { AppResourceHost } from "./shell/AppResourceHost";
import { Shell } from "./shell/Shell";
import { applyThemePreference, initializeThemes, readThemeHint } from "./themes";
import { initTransport } from "./transport";

// The desktop webview runs the shell from the app's own bundle beside its host; a precached
// service worker there could mask an updated host after an app update, so the PWA registration
// is browser-only. The preload-injected marker is the desktop's signal (same convention as the
// other __THINKRAIL_*__ bridges).
const DESKTOP_MARKER_GLOBAL = "__THINKRAIL_DESKTOP__";
if (!Reflect.has(globalThis, DESKTOP_MARKER_GLOBAL)) {
	void import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true }));
}

initializeThemes();
applyThemePreference(readThemeHint());
initializeFonts();
initTransport();
initChatPreferencesPersistence();
initModelVisibilityPersistence();
initProjectExpansionPersistence();
initFilesTreePersistence();
initSearchPreferences();
initNavigation();
registerWebExtensions();

function App() {
	useLocaleSync();
	const t = useT();
	return (
		<ErrorBoundary label={t("app.errorBoundary.label")}>
			<TooltipProvider delayDuration={250} skipDelayDuration={400}>
				<AppResourceHost>
					<Shell />
				</AppResourceHost>
			</TooltipProvider>
		</ErrorBoundary>
	);
}

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
}
