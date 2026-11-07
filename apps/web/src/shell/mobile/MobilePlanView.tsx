import { useT } from "@thinkrail/locales/react";
import { Suspense } from "react";
import { QuietScrollArea } from "../../components/QuietScrollArea";
import { selectRailPlanSessionId, useAppStore } from "../../store";
import { MissingResource, PlanRailPane } from "../resourceBodies";

export function MobilePlanView({ workspaceId }: { workspaceId: string }) {
	const t = useT();
	const planSessionId = useAppStore((state) => selectRailPlanSessionId(state, workspaceId));
	if (!planSessionId) {
		return (
			<div
				data-testid="mobile-plan-empty"
				className="flex h-full items-center justify-center px-16 text-center"
			>
				<p className="tr-text-ui text-text-muted">{t("shell.mobile.noPlan")}</p>
			</div>
		);
	}
	return (
		<QuietScrollArea
			data-testid="mobile-plan"
			surface="sidebar"
			axis="vertical"
			className="h-full"
			viewportClassName="px-12 py-12"
		>
			<Suspense fallback={<MissingResource kind="plan" />}>
				<PlanRailPane workspaceId={workspaceId} sessionId={planSessionId} />
			</Suspense>
		</QuietScrollArea>
	);
}
