import { RiChatNewLine as MessageSquarePlus } from "@remixicon/react";
import { useT } from "@thinkrail/locales/react";
import { Button } from "@thinkrail/ui/button";
import { startChatInTab } from "../../panels/openChat";
import { selectMobileActiveChat, useAppStore } from "../../store";
import { ChatResourceBody } from "../resourceBodies";

export function MobileChatView({
	workspaceId,
	onOpenFile,
}: {
	workspaceId: string;
	onOpenFile: (path: string) => void;
}) {
	const t = useT();
	const chatTab = useAppStore((state) => selectMobileActiveChat(state, workspaceId));
	const chatStarting = useAppStore((state) => (state.chatStartsByWorkspace[workspaceId] ?? 0) > 0);
	if (!chatTab) {
		return (
			<div
				data-testid="mobile-chat-empty"
				className="flex h-full flex-col items-center justify-center gap-12 px-16 text-center"
			>
				<p className="tr-text-ui text-text-muted">{t("shell.mobile.noChat")}</p>
				<Button
					variant="outline"
					size="m"
					iconLeft={MessageSquarePlus}
					loading={chatStarting}
					disabled={chatStarting}
					data-testid="mobile-start-chat"
					onClick={() => void startChatInTab(workspaceId)}
				>
					{chatStarting ? t("shell.mobile.startingChat") : t("shell.mobile.newChat")}
				</Button>
			</div>
		);
	}
	return <ChatResourceBody workspaceId={workspaceId} tab={chatTab} onOpenFile={onOpenFile} />;
}
