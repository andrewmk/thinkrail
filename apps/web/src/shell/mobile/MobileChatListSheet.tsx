import { RiChatNewLine as ChatNew, RiLoader4Line as Loader } from "@remixicon/react";
import { useT } from "@thinkrail/locales/react";
import { Button } from "@thinkrail/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@thinkrail/ui/dialog";
import { menuItemClass } from "@thinkrail/ui/menu-styles";
import { cn } from "@thinkrail/ui/utils";
import { useNow } from "../../components/useNow";
import { chatLabel, relativeTime } from "../../lib";
import { openChatInTab, startChatInTab } from "../../panels/openChat";
import { selectMobileActiveChat, useAppStore } from "../../store";

// Full-screen list of the workspace's chats, newest first (the catalog hook's
// session.list summaries); a row tap switches through openChatInTab.
export function MobileChatListSheet({
	workspaceId,
	open,
	onOpenChange,
	onSwitched,
}: {
	workspaceId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSwitched: () => void;
}) {
	const t = useT();
	const now = useNow();
	const summaries = useAppStore((s) => s.sessionSummariesByWorkspace[workspaceId]);
	const chatStarting = useAppStore((s) => (s.chatStartsByWorkspace[workspaceId] ?? 0) > 0);
	const activeSessionId = useAppStore(
		(s) => selectMobileActiveChat(s, workspaceId)?.sessionId ?? null,
	);
	const sorted = summaries ? [...summaries].sort((a, b) => b.updatedAt - a.updatedAt) : null;
	const switchTo = (sessionId: string) => {
		const navigation = useAppStore.getState().beginCenterNavigation(workspaceId);
		onOpenChange(false);
		onSwitched();
		void openChatInTab(workspaceId, sessionId, navigation);
	};
	const startNew = () => {
		onOpenChange(false);
		onSwitched();
		void startChatInTab(workspaceId);
	};
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-w-none flex-col p-0" data-testid="mobile-chats-sheet">
				<DialogHeader>
					<DialogTitle>{t("shell.mobile.chats")}</DialogTitle>
				</DialogHeader>
				{sorted === null ? (
					<div className="flex flex-1 items-center justify-center">
						<Loader
							data-testid="mobile-chats-loading"
							className="size-24 animate-spin text-text-muted motion-reduce:animate-none"
						/>
					</div>
				) : (
					<div className="flex min-h-0 flex-1 flex-col">
						<Button
							variant="outline"
							size="m"
							iconLeft={ChatNew}
							loading={chatStarting}
							disabled={chatStarting}
							data-testid="mobile-new-chat"
							onClick={startNew}
							className="mx-12 my-8"
						>
							{chatStarting ? t("shell.mobile.startingChat") : t("shell.mobile.newChat")}
						</Button>
						{sorted.length === 0 ? (
							<p
								data-testid="mobile-chats-empty"
								className="px-24 py-24 text-center tr-text-ui text-text-muted"
							>
								{t("shell.mobile.noChats")}
							</p>
						) : (
							<div className="min-h-0 flex-1 overflow-y-auto px-12 pb-24">
								{sorted.map((summary) => {
									const active = summary.sessionId === activeSessionId;
									const label = chatLabel(t, summary.title, summary.firstPrompt);
									return (
										<button
											key={summary.sessionId}
											type="button"
											data-testid="mobile-chat-row"
											data-session-id={summary.sessionId}
											{...(active ? { "data-active": "true" } : {})}
											onClick={() => switchTo(summary.sessionId)}
											className={cn(
												menuItemClass,
												"w-full min-w-0 gap-8 data-[active=true]:bg-control-bg-selected",
											)}
										>
											<span
												className="min-w-0 flex-1 truncate"
												data-title-source={label.source}
												title={label.tooltip}
											>
												{label.text}
											</span>
											<span className="shrink-0 tr-text-metadata text-text-muted">
												{relativeTime(t, summary.updatedAt, now)}
											</span>
										</button>
									);
								})}
							</div>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
