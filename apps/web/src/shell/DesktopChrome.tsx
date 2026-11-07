import { RiSearchLine, RiSettings3Line as Settings } from "@remixicon/react";
import type { Project, Workspace } from "@thinkrail/contracts";
import { useT } from "@thinkrail/locales/react";
import { IconButton } from "@thinkrail/ui/button";
import { useState } from "react";
import { platformShortcutLabel } from "../lib";
import { useBranchStatus } from "../panels/useBranchStatus";
import { WorkspaceCreationView } from "../panels/WorkspaceCreation";
import { SettingsSection, useAppStore } from "../store";
import type { ConnectionStatus } from "../transport";
import { UpdateReadyButton } from "../updates";
import type { UpdatesController } from "../updates/useUpdates";
import { BrandLogo } from "./BrandLogo";
import { ConnectionStatusIndicator } from "./ConnectionStatus";
import { toggleBottomPanel, toggleLeftSide, toggleRightSide } from "./chordActions";
import { JbcentralQuotaTopbar } from "./JbcentralQuotaTopbar";
import { LocationBar } from "./locationBar";
import { NativeWindowControls } from "./NativeWindowControls";
import { PROJECT_HOME_PROJECTS_REGION_ID, ProjectHome } from "./ProjectHome";
import { SearchPaletteHost } from "./SearchPaletteHost";
import { readSettingsShortcutLabel } from "./useAppShortcuts";
import { useCollapsibleRegion } from "./useCollapsibleRegion";
import { useGlobalHotkeys } from "./useGlobalHotkeys";
import { useNativeWindowControls } from "./useNativeWindowControls";
import { WorkspaceWorkbench } from "./WorkspaceWorkbench";

export function DesktopChrome({
	status,
	activeWorkspaceId,
	activeWorkspace,
	contextProject,
	hasActiveWorkspace,
	updates,
	onNewWorkspace,
}: {
	status: ConnectionStatus;
	activeWorkspaceId: string | null;
	activeWorkspace: Workspace | null;
	contextProject: Project | null;
	hasActiveWorkspace: boolean;
	updates: UpdatesController | null;
	onNewWorkspace: (projectId: string) => void;
}) {
	const t = useT();
	const {
		review: openReview,
		url: openReviewUrl,
		status: branchFacts,
		noteOpenReview,
		refreshBranchStatus,
	} = useBranchStatus(activeWorkspace, status, { pollChecks: true });
	const windowControls = useNativeWindowControls();
	const homeProjects = useCollapsibleRegion<HTMLDivElement>(PROJECT_HOME_PROJECTS_REGION_ID);
	const [searchShortcut] = useState(() => platformShortcutLabel("K"));
	const [settingsShortcut] = useState(readSettingsShortcutLabel);
	const activeCreation = useAppStore((s) =>
		s.activeCreationId ? s.workspaceCreations[s.activeCreationId] : undefined,
	);
	useGlobalHotkeys({
		onProjects: () => toggleLeftSide(homeProjects.toggle),
		...(hasActiveWorkspace ? { onWorkspace: toggleRightSide, onBottom: toggleBottomPanel } : {}),
		...(contextProject ? { onNewWorkspace: () => onNewWorkspace(contextProject.id) } : {}),
		onSearch: () => useAppStore.getState().openSearch(),
	});
	const locationReview =
		openReview && openReviewUrl ? { ...openReview, url: openReviewUrl } : openReview;
	return (
		<div data-testid="shell" className="grid h-full grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr]">
			<header
				data-testid="topbar"
				className="relative window-drag flex h-topbar-row min-w-0 select-none items-center border-b border-border-default bg-container-header-bg px-16"
			>
				<div
					aria-hidden="true"
					data-testid="window-chrome-inset-left"
					className="w-window-chrome-inset-left shrink-0"
				/>
				<div className="flex min-w-0 flex-1 items-center gap-12 self-stretch pr-12">
					<BrandLogo />
					{contextProject ? (
						<LocationBar
							project={contextProject}
							workspace={activeWorkspace}
							review={activeWorkspace ? locationReview : null}
							branchStatus={branchFacts}
							noteOpenReview={noteOpenReview}
							refreshBranchStatus={refreshBranchStatus}
							onNewWorkspace={() => onNewWorkspace(contextProject.id)}
						/>
					) : null}
				</div>
				<div
					data-testid="topbar-actions"
					className="window-no-drag ml-auto flex shrink-0 items-center gap-12"
				>
					{updates ? (
						<UpdateReadyButton
							updates={updates}
							onOpen={() => useAppStore.getState().openSettings(SettingsSection.Updates)}
						/>
					) : null}
					<IconButton
						variant="ghost"
						size="m"
						icon={RiSearchLine}
						label={t("shell.search.open")}
						tooltip={t("shell.search.openWithShortcut", { shortcut: searchShortcut })}
						data-testid="open-search"
						onClick={() => useAppStore.getState().openSearch()}
					/>
					<JbcentralQuotaTopbar />
					<ConnectionStatusIndicator status={status} />
					<IconButton
						variant="ghost"
						size="m"
						icon={Settings}
						label={t("shell.topbar.settings")}
						tooltip={
							settingsShortcut
								? t("shell.topbar.settingsWithShortcut", { shortcut: settingsShortcut })
								: t("shell.topbar.settings")
						}
						data-testid="open-settings"
						onClick={() => useAppStore.getState().openSettings()}
					/>
				</div>
				<div
					aria-hidden="true"
					data-testid="window-chrome-inset-right"
					className="w-window-chrome-inset-right shrink-0"
				/>
				{windowControls ? (
					<NativeWindowControls
						state={windowControls.state}
						onMinimize={windowControls.minimize}
						onToggleMaximize={windowControls.toggleMaximize}
						onClose={windowControls.close}
					/>
				) : null}
			</header>
			{hasActiveWorkspace && activeWorkspaceId ? (
				<div data-testid="workspace-shell-layout" className="h-full min-h-0 min-w-0">
					<WorkspaceWorkbench workspaceId={activeWorkspaceId} />
				</div>
			) : (
				<ProjectHome
					projects={homeProjects}
					{...(activeCreation ? { main: <WorkspaceCreationView creation={activeCreation} /> } : {})}
				/>
			)}
			<SearchPaletteHost
				onNewWorkspace={onNewWorkspace}
				onToggleProjectsHome={homeProjects.toggle}
				hasUpdateSettings={updates !== null}
			/>
		</div>
	);
}
