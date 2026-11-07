import { RiHistoryLine as History } from "@remixicon/react";
import { useT } from "@thinkrail/locales/react";
import { Button, IconButton } from "@thinkrail/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@thinkrail/ui/dialog";
import { useState } from "react";
import { QuietScrollArea } from "../../components/QuietScrollArea";
import { ProjectTree } from "../../panels/ProjectTree";
import { selectActiveWorkspace, selectContextProject, useAppStore } from "../../store";
import { BrandLogo } from "../BrandLogo";
import { ConnectionStatusIndicator } from "../ConnectionStatus";

export function MobileTopbar({ onOpenChats }: { onOpenChats?: () => void }) {
	const t = useT();
	const status = useAppStore((s) => s.status);
	const contextProject = useAppStore(selectContextProject);
	const activeWorkspace = useAppStore(selectActiveWorkspace);
	const [locationOpen, setLocationOpen] = useState(false);
	return (
		<header
			data-testid="mobile-topbar"
			className="flex h-topbar-row min-w-0 items-center gap-8 border-b border-border-default bg-container-header-bg pl-12 pr-16"
		>
			<BrandLogo />
			{contextProject ? (
				<Button
					variant="ghost"
					size="m"
					data-testid="mobile-project-chip"
					onClick={() => setLocationOpen(true)}
					className="max-w-[160px] shrink"
				>
					<span className="truncate">{contextProject.name}</span>
				</Button>
			) : null}
			{contextProject && activeWorkspace ? (
				<Button
					variant="ghost"
					size="m"
					data-testid="mobile-workspace-chip"
					onClick={() => setLocationOpen(true)}
					className="max-w-[160px] shrink"
				>
					<span className="truncate">{activeWorkspace.name}</span>
				</Button>
			) : null}
			{contextProject && activeWorkspace ? (
				<span data-testid="mobile-branch" className="min-w-0 truncate text-text-subtle tr-text-ui">
					{activeWorkspace.branch}
				</span>
			) : null}
			<div className="ml-auto flex shrink-0 items-center gap-8">
				{activeWorkspace && onOpenChats ? (
					<IconButton
						variant="ghost"
						size="m"
						icon={History}
						label={t("shell.mobile.chatList")}
						tooltip={t("shell.mobile.chatList")}
						data-testid="mobile-chats"
						onClick={() => onOpenChats()}
						className="shrink-0"
					/>
				) : null}
				<ConnectionStatusIndicator status={status} />
			</div>
			<Dialog open={locationOpen} onOpenChange={setLocationOpen}>
				<DialogContent className="max-w-none p-0" data-testid="mobile-projects-sheet">
					<DialogHeader>
						<DialogTitle>{t("shell.mobile.location")}</DialogTitle>
					</DialogHeader>
					<QuietScrollArea
						data-testid="mobile-projects"
						viewportClassName="px-12"
						className="size-full"
					>
						<ProjectTree />
					</QuietScrollArea>
				</DialogContent>
			</Dialog>
		</header>
	);
}
