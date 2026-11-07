import { RiArrowLeftSLine } from "@remixicon/react";
import { useT } from "@thinkrail/locales/react";
import { IconButton } from "@thinkrail/ui/button";
import { useEffect, useState } from "react";
import { FilesPanel } from "../../panels/FilesPanel";
import { selectAttentionCenterTab, useAppStore } from "../../store";
import { layoutTabName } from "../layout";
import { EditorResourceBody } from "../resourceBodies";

export function MobileFilesView({ workspaceId }: { workspaceId: string }) {
	const t = useT();
	const attentionTab = useAppStore((state) => selectAttentionCenterTab(state, workspaceId));
	const isDetail =
		attentionTab !== null &&
		(attentionTab.kind === "file" ||
			attentionTab.kind === "diff" ||
			attentionTab.kind === "changes");
	const [tree, setTree] = useState(!isDetail);
	useEffect(() => {
		if (isDetail) setTree(false);
	}, [isDetail, attentionTab?.id]);
	if (isDetail && !tree) {
		return (
			<div className="flex h-full min-h-0 flex-col">
				<header
					data-testid="mobile-files-header"
					className="flex h-panel-header-row shrink-0 items-center gap-4 border-b border-border-default bg-container-header-bg pl-4 pr-8"
				>
					<IconButton
						variant="ghost"
						size="m"
						icon={RiArrowLeftSLine}
						label={t("shell.mobile.back")}
						data-testid="mobile-files-back"
						onClick={() => setTree(true)}
					/>
					<span
						data-testid="mobile-files-title"
						className="min-w-0 truncate tr-text-ui text-text-default"
					>
						{layoutTabName(t, attentionTab)}
					</span>
				</header>
				<div className="min-h-0 flex-1">
					<EditorResourceBody workspaceId={workspaceId} tab={attentionTab} />
				</div>
			</div>
		);
	}
	return (
		<div className="h-full" data-testid="mobile-files-tree">
			<FilesPanel workspaceId={workspaceId} />
		</div>
	);
}
