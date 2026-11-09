import type { SessionStats } from "@thinkrail/contracts";
import type { ReactNode } from "react";
import { useCoarsePointer } from "../lib";
import { SessionStatsBar } from "./SessionStatsBar";
import { SkillsButton } from "./SkillsButton";

export function ChatHeader({
	stats,
	statusEntries,
	resources,
	onOpenSkills,
	skillsStale,
}: {
	stats: SessionStats | null;
	statusEntries: [string, string][];
	resources?: ReactNode;
	onOpenSkills?: () => void;
	skillsStale?: boolean;
}) {
	const coarse = useCoarsePointer();
	const statusCluster = (
		<div className="flex min-w-0 items-center justify-end gap-12 overflow-clip">
			{statusEntries.map(([key, text]) => (
				<span key={key} className="min-w-0 truncate text-text-muted tr-text-metadata">
					{text}
				</span>
			))}
			<SessionStatsBar stats={stats} />
		</div>
	);
	const actions = (
		<>
			{resources}
			{onOpenSkills ? (
				<SkillsButton onOpen={onOpenSkills} testId="open-skills" stale={skillsStale ?? false} />
			) : null}
		</>
	);
	if (!coarse) {
		return (
			<div
				data-testid="chat-toolbar"
				className="flex h-panel-header-row shrink-0 items-center gap-12 overflow-clip border-border-muted border-b bg-container-workspace-bg px-12"
			>
				<div className="min-w-0 flex-1" />
				{statusCluster}
				{actions}
			</div>
		);
	}
	return (
		<div data-testid="chat-toolbar" className="shrink-0 bg-container-workspace-bg">
			<div className="flex h-panel-header-row items-center gap-12 overflow-clip border-border-muted border-b px-12">
				<div className="min-w-0 flex-1" />
				{statusCluster}
			</div>
			<div className="flex h-panel-header-row items-center justify-end gap-12 overflow-clip border-border-muted border-b px-12">
				{actions}
			</div>
		</div>
	);
}
