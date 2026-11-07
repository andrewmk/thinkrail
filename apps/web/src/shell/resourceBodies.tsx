import type { MessageKey } from "@thinkrail/locales";
import { useT } from "@thinkrail/locales/react";
import { Button } from "@thinkrail/ui/button";
import { LoadingRegion } from "@thinkrail/ui/skeleton";
import { lazy, Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { preloadedLazy } from "../components/preloadedLazy";
import { layoutResourceIdentity } from "../lib";
import { DiffPane } from "../panels/DiffPane";
import { FilePane } from "../panels/FilePane";
import { type EditorTab, toast, useAppStore } from "../store";
import { errorText } from "../transport";
import { currentChatDestination, hydrateChatResource } from "./chatReconciliation";
import type { LayoutCenterTab } from "./layout";

export const ChatView = preloadedLazy(() => import("../chat/ChatView"));
export const PlanPane = lazy(() => import("../panels/PlanPane"));
const ChangesReviewPane = lazy(() =>
	import("../panels/ChangesReviewPane").then((module) => ({ default: module.ChangesReviewPane })),
);
export const PlanRailPane = lazy(() => import("../panels/PlanRailPane"));

export const RESTORING_LABEL = {
	file: "shell.workbench.restoring.file",
	changes: "shell.workbench.restoring.changes",
	diff: "shell.workbench.restoring.diff",
	editor: "shell.workbench.restoring.editor",
	chat: "shell.workbench.restoring.chat",
	plan: "shell.workbench.restoring.plan",
	terminal: "shell.workbench.restoring.terminal",
} satisfies Record<string, MessageKey>;

export function MissingResource({ kind }: { kind: keyof typeof RESTORING_LABEL }) {
	const t = useT();
	return (
		<LoadingRegion
			rows={12}
			label={t(RESTORING_LABEL[kind])}
			className="h-full overflow-hidden p-16"
		/>
	);
}

type EditorResourceTab = Extract<LayoutCenterTab, { kind: "file" | "diff" | "changes" }>;
type EditorResource = Extract<EditorTab, { kind: "file" | "diff" | "changes" }>;

function isEditorResource(tab: EditorTab): tab is EditorResource {
	return tab.kind === "file" || tab.kind === "diff" || tab.kind === "changes";
}

export const NO_EDITOR_TABS: EditorTab[] = [];

function findEditorResource(
	tabs: readonly EditorTab[],
	id: string,
	identity: string,
): EditorResource | undefined {
	const exact = tabs.find((candidate) => candidate.id === id);
	if (exact && isEditorResource(exact) && layoutResourceIdentity(exact) === identity) return exact;
	return tabs.find(
		(candidate): candidate is EditorResource =>
			isEditorResource(candidate) && layoutResourceIdentity(candidate) === identity,
	);
}

export function EditorResourceBody({
	workspaceId,
	tab,
}: {
	workspaceId: string;
	tab: EditorResourceTab;
}) {
	const t = useT();
	const identity = layoutResourceIdentity(tab);
	const editor = useAppStore((state) =>
		findEditorResource(state.tabsByWorkspace[workspaceId] ?? NO_EDITOR_TABS, tab.id, identity),
	);
	if (!editor) {
		return <MissingResource kind={tab.kind} />;
	}
	return (
		<ErrorBoundary label={t("shell.workbench.panel.editor")} resetKeys={[workspaceId, tab.id]}>
			<Suspense fallback={<MissingResource kind="editor" />}>
				{editor.kind === "file" ? (
					<FilePane tab={editor} />
				) : editor.kind === "diff" ? (
					<DiffPane tab={editor} />
				) : (
					<ChangesReviewPane tab={editor} />
				)}
			</Suspense>
		</ErrorBoundary>
	);
}

const CHAT_RETRY_DELAY_MS = 4000;

export function ChatResourceBody({
	workspaceId,
	tab,
	onOpenFile,
}: {
	workspaceId: string;
	tab: Extract<LayoutCenterTab, { kind: "chat" }>;
	onOpenFile: (path: string) => void;
}) {
	const t = useT();
	const available = useAppStore((state) => state.sessions[tab.sessionId] !== undefined);
	const [stalled, setStalled] = useState(false);
	useEffect(() => {
		if (available) return;
		setStalled(false);
		const timer = setTimeout(() => setStalled(true), CHAT_RETRY_DELAY_MS);
		return () => clearTimeout(timer);
	}, [available, tab.sessionId]);
	if (available) {
		return (
			<ErrorBoundary label={t("shell.workbench.panel.chat")} resetKeys={[workspaceId, tab.id]}>
				<Suspense fallback={<MissingResource kind="chat" />}>
					<ChatView sessionId={tab.sessionId} workspaceId={workspaceId} onOpenFile={onOpenFile} />
				</Suspense>
			</ErrorBoundary>
		);
	}
	const retry = () => {
		void hydrateChatResource(workspaceId, tab.sessionId)
			.then((installed) => {
				if (installed) return;
				const { state, current } = currentChatDestination(workspaceId, tab, undefined);
				if (
					current &&
					!state.removedWorkspaceIds[workspaceId] &&
					!state.deletedSessionsByWorkspace[workspaceId]?.[tab.sessionId]
				) {
					toast.error(
						t("shell.workbench.chatRestoreFailed"),
						t("shell.workbench.chatRestoreFailedTitle"),
					);
				}
			})
			.catch((error) => {
				const { state, current } = currentChatDestination(workspaceId, tab, undefined);
				if (
					current &&
					!state.removedWorkspaceIds[workspaceId] &&
					!state.deletedSessionsByWorkspace[workspaceId]?.[tab.sessionId]
				) {
					toast.error(errorText(error), t("shell.workbench.chatRestoreFailedTitle"));
				}
			});
	};
	if (!stalled) return <MissingResource kind="chat" />;
	return (
		<div className="flex h-full flex-col items-center justify-center gap-8 text-text-muted">
			<span className="tr-text-ui">{t("shell.workbench.chatRestoreSlow")}</span>
			<Button variant="outline" size="m" onClick={retry}>
				{t("common.retry")}
			</Button>
		</div>
	);
}
