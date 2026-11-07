import { useCallback, useEffect, useState } from "react";
import type { LayoutAttention } from "../../lib";
import { openFileInTab } from "../../panels/openTabs";
import { useAppStore } from "../../store";
import { useLayoutIntentProcessing } from "../layoutIntents";
import {
	applyLayoutAttention,
	commitWorkspaceLayout,
	useWorkspaceLayoutState,
} from "../layoutState";
import { syncLegacySelectionFromAttention } from "../legacySelection";
import { MobileChatView } from "./MobileChatView";
import { MobileFilesView } from "./MobileFilesView";
import { MobilePlanView } from "./MobilePlanView";
import { MobileProjectHome } from "./MobileProjectHome";
import { type MobileTab, MobileTabBar } from "./MobileTabBar";
import { MobileTopbar } from "./MobileTopbar";

// The frame document and layout intents are materialized by the same hooks the desktop
// workbench uses; without them the mobile projection has no document to read and open-tab
// intents (chat start, file links) never land in a center group.
function ignoreFocusRequest(): void {}

function MobileWorkspace({ workspaceId }: { workspaceId: string }) {
	const [tab, setTab] = useState<MobileTab>("chat");
	const document = useAppStore((s) => s.layoutDocumentsByWorkspace[workspaceId]);
	const routeChatTargetGeneration = useAppStore((s) => s.routeChatTargetGeneration);

	useWorkspaceLayoutState(workspaceId);

	useEffect(() => {
		if (useAppStore.getState().routeChatTarget) setTab("chat");
	}, [routeChatTargetGeneration]);

	const changeAttention = useCallback(
		(next: LayoutAttention) => {
			const state = useAppStore.getState();
			if (state.removedWorkspaceIds[workspaceId]) return;
			applyLayoutAttention(workspaceId, next);
			syncLegacySelectionFromAttention(workspaceId);
		},
		[workspaceId],
	);

	const commit = useCallback(
		(next: Parameters<typeof commitWorkspaceLayout>[1], nextAttention?: LayoutAttention) => {
			void commitWorkspaceLayout(workspaceId, next, {
				...(document ? { baseDocument: document } : {}),
				...(nextAttention ? { attention: nextAttention } : {}),
			}).catch(() => {});
		},
		[document, workspaceId],
	);

	useLayoutIntentProcessing(workspaceId, commit, changeAttention, ignoreFocusRequest);

	const openFileInFiles = useCallback(
		(path: string) => {
			void openFileInTab(workspaceId, path, "preview");
			setTab("files");
		},
		[workspaceId],
	);

	return (
		<div className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto]">
			<main className="relative min-h-0 min-w-0">
				<div className={tab === "chat" ? "h-full" : "hidden"}>
					<MobileChatView workspaceId={workspaceId} onOpenFile={openFileInFiles} />
				</div>
				{tab === "files" ? <MobileFilesView workspaceId={workspaceId} /> : null}
				{tab === "plan" ? <MobilePlanView workspaceId={workspaceId} /> : null}
			</main>
			<MobileTabBar tab={tab} onChange={setTab} />
		</div>
	);
}

export function MobileShell() {
	const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);

	return (
		<div
			data-testid="shell"
			data-mobile="true"
			className="grid h-full grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr]"
		>
			<MobileTopbar />
			{activeWorkspaceId ? (
				// Remounting per workspace resets the tab to chat (chat-first entry).
				<MobileWorkspace key={activeWorkspaceId} workspaceId={activeWorkspaceId} />
			) : (
				<MobileProjectHome />
			)}
		</div>
	);
}
