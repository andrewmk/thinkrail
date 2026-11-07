import { useCallback, useEffect, useState } from "react";
import type { LayoutAttention } from "../../lib";
import { openFileInTab } from "../../panels/openTabs";
import { useAppStore } from "../../store";
import { useWorkspaceChatCatalogReconciliation } from "../chatReconciliation";
import { useLayoutIntentProcessing } from "../layoutIntents";
import {
	applyLayoutAttention,
	commitWorkspaceLayout,
	useWorkspaceLayoutState,
} from "../layoutState";
import { syncLegacySelectionFromAttention } from "../legacySelection";
import { MobileChatListSheet } from "./MobileChatListSheet";
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

function MobileWorkspace({
	workspaceId,
	tab,
	onTabChange,
}: {
	workspaceId: string;
	tab: MobileTab;
	onTabChange: (tab: MobileTab) => void;
}) {
	const document = useAppStore((s) => s.layoutDocumentsByWorkspace[workspaceId]);
	const routeChatTargetGeneration = useAppStore((s) => s.routeChatTargetGeneration);

	useWorkspaceLayoutState(workspaceId);

	useEffect(() => {
		if (useAppStore.getState().routeChatTarget) onTabChange("chat");
	}, [onTabChange, routeChatTargetGeneration]);

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
	useWorkspaceChatCatalogReconciliation(workspaceId, commit);

	const openFileInFiles = useCallback(
		(path: string) => {
			void openFileInTab(workspaceId, path, "preview");
			onTabChange("files");
		},
		[onTabChange, workspaceId],
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
			<MobileTabBar tab={tab} onChange={onTabChange} />
		</div>
	);
}

export function MobileShell() {
	const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
	const [tab, setTab] = useState<MobileTab>("chat");
	const [chatsOpen, setChatsOpen] = useState(false);

	// The tab state lives here so the topbar's chat list can switch back to it.
	useEffect(() => {
		setTab("chat");
		setChatsOpen(false);
	}, [activeWorkspaceId]);

	return (
		<div
			data-testid="shell"
			data-mobile="true"
			className="grid h-full grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr]"
		>
			<MobileTopbar {...(activeWorkspaceId ? { onOpenChats: () => setChatsOpen(true) } : {})} />
			{activeWorkspaceId ? (
				<>
					{/* Remounting per workspace resets its hooks (chat-first entry). */}
					<MobileWorkspace
						key={activeWorkspaceId}
						workspaceId={activeWorkspaceId}
						tab={tab}
						onTabChange={setTab}
					/>
					<MobileChatListSheet
						workspaceId={activeWorkspaceId}
						open={chatsOpen}
						onOpenChange={setChatsOpen}
						onSwitched={() => setTab("chat")}
					/>
				</>
			) : (
				<MobileProjectHome />
			)}
		</div>
	);
}
