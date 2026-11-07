import { useEffect, useState } from "react";
import {
	applyFontPreference,
	DEFAULT_FONT_PREFERENCE,
	installUserFonts,
	writeFontsHint,
} from "../fonts";
import { useCoarsePointer } from "../lib";
import { NotificationPermissionPrompt, useAttentionNotifications } from "../notifications";
import { NewWorkspaceDialog } from "../panels/NewWorkspaceDialog";
import { SettingsDialog } from "../panels/SettingsDialog";
import { Toaster } from "../panels/Toaster";
import { useCreationChatHandoff } from "../panels/WorkspaceCreation";
import { SearchSettings } from "../search";
import {
	selectActiveWorkspace,
	selectContextProject,
	useAppStore,
	type WorkspaceRetryDraft,
} from "../store";
import {
	applyThemePreference,
	clearUserThemes,
	installUserThemes,
	onSystemAppearanceChange,
	readThemeHint,
	writeThemeHint,
} from "../themes";
import {
	hostUrl,
	runHostUpdate,
	supportsFonts,
	supportsHostUpdateRun,
	supportsUserThemes,
} from "../transport";
import { UpdateInstallSurfaces, UpdateSettings, useUpdates } from "../updates";
import type { UpdatesController } from "../updates/useUpdates";
import { AppShortcuts } from "./AppShortcuts";
import { DesktopChrome } from "./DesktopChrome";
import { LayoutSettings } from "./LayoutSettings";
import { useLocalLayoutState } from "./layoutState";
import { MobileShell } from "./mobile";

export function Shell() {
	useLocalLayoutState();
	useAttentionNotifications();
	const status = useAppStore((s) => s.status);
	const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
	const activeWorkspace = useAppStore(selectActiveWorkspace);
	const contextProject = useAppStore(selectContextProject);
	const hasActiveWorkspace = activeWorkspaceId != null;
	const protocolVersion = useAppStore((s) => s.protocolVersion);
	const updates = useUpdates(supportsHostUpdateRun(protocolVersion) ? runHostUpdate : null);
	const [newWorkspaceProjectId, setNewWorkspaceProjectId] = useState<string | null>(null);
	const workspaceRetryDraft = useAppStore((s) => s.workspaceRetryDraft);
	useCreationChatHandoff();

	const [themeHint] = useState(readThemeHint);
	const welcomeGeneration = useAppStore((s) => s.welcomeGeneration);
	const theme = useAppStore((s) => s.theme);
	const themeMode = useAppStore((s) => s.themeMode);
	const systemThemePair = useAppStore((s) => s.systemThemePair);
	const userThemes = useAppStore((s) => s.userThemes);
	const userThemesUnsupported = welcomeGeneration > 0 && !supportsUserThemes(protocolVersion);
	useEffect(() => {
		if (userThemes) installUserThemes(userThemes.files);
		else if (userThemesUnsupported) clearUserThemes();
		const preference =
			welcomeGeneration === 0
				? themeHint
				: { theme, themeMode, ...(systemThemePair ? { systemThemePair } : {}) };
		const apply = () => applyThemePreference(preference);
		apply();
		if (welcomeGeneration > 0) writeThemeHint(preference);
		return preference.themeMode === "system" ? onSystemAppearanceChange(apply) : undefined;
	}, [
		themeHint,
		welcomeGeneration,
		theme,
		themeMode,
		systemThemePair,
		userThemes,
		userThemesUnsupported,
	]);
	const interfaceFont = useAppStore((s) => s.interfaceFont);
	const codeFont = useAppStore((s) => s.codeFont);
	const codeFontSize = useAppStore((s) => s.codeFontSize);
	const codeLigatures = useAppStore((s) => s.codeLigatures);
	const fontWeightOffset = useAppStore((s) => s.fontWeightOffset);
	const userFonts = useAppStore((s) => s.userFonts);
	const fontsSupported = supportsFonts(protocolVersion);
	useEffect(() => {
		if (welcomeGeneration === 0) return;
		if (!fontsSupported) {
			installUserFonts([]);
			applyFontPreference(DEFAULT_FONT_PREFERENCE);
			writeFontsHint(DEFAULT_FONT_PREFERENCE, []);
			return;
		}
		const preference = { interfaceFont, codeFont, codeFontSize, codeLigatures, fontWeightOffset };
		if (userFonts) installUserFonts(userFonts.files, hostUrl);
		applyFontPreference(preference);
		if (userFonts) writeFontsHint(preference, userFonts.files);
	}, [
		welcomeGeneration,
		fontsSupported,
		interfaceFont,
		codeFont,
		codeFontSize,
		codeLigatures,
		fontWeightOffset,
		userFonts,
	]);

	const coarse = useCoarsePointer();

	if (coarse) {
		return (
			<>
				<MobileShell />
				<SharedOverlays
					updates={updates}
					newWorkspaceProjectId={newWorkspaceProjectId}
					setNewWorkspaceProjectId={setNewWorkspaceProjectId}
					workspaceRetryDraft={workspaceRetryDraft}
				/>
			</>
		);
	}

	return (
		<>
			<DesktopChrome
				status={status}
				activeWorkspaceId={activeWorkspaceId}
				activeWorkspace={activeWorkspace}
				contextProject={contextProject}
				hasActiveWorkspace={hasActiveWorkspace}
				updates={updates}
				onNewWorkspace={setNewWorkspaceProjectId}
			/>
			<SharedOverlays
				updates={updates}
				newWorkspaceProjectId={newWorkspaceProjectId}
				setNewWorkspaceProjectId={setNewWorkspaceProjectId}
				workspaceRetryDraft={workspaceRetryDraft}
			/>
			<AppShortcuts />
		</>
	);
}

function SharedOverlays({
	updates,
	newWorkspaceProjectId,
	setNewWorkspaceProjectId,
	workspaceRetryDraft,
}: {
	updates: UpdatesController | null;
	newWorkspaceProjectId: string | null;
	setNewWorkspaceProjectId: (id: string | null) => void;
	workspaceRetryDraft: WorkspaceRetryDraft | null;
}) {
	return (
		<>
			<SettingsDialog
				layoutSettings={<LayoutSettings />}
				keyboardSettings={<SearchSettings />}
				updateSettings={updates ? <UpdateSettings updates={updates} /> : undefined}
			/>
			{newWorkspaceProjectId !== null ? (
				<NewWorkspaceDialog
					open
					projectId={newWorkspaceProjectId}
					onOpenChange={(isOpen) => {
						if (!isOpen) setNewWorkspaceProjectId(null);
					}}
				/>
			) : workspaceRetryDraft !== null ? (
				<NewWorkspaceDialog
					open
					projectId={workspaceRetryDraft.projectId}
					retryDraft={workspaceRetryDraft}
					onOpenChange={(isOpen) => {
						if (!isOpen) useAppStore.getState().clearWorkspaceRetry();
					}}
				/>
			) : null}
			<NotificationPermissionPrompt />
			<Toaster />
			<UpdateInstallSurfaces updates={updates} />
		</>
	);
}
