import { ProjectTree } from "../../panels/ProjectTree";
import { WelcomePanel } from "../../panels/WelcomePanel";
import { WorkspaceCreationView } from "../../panels/WorkspaceCreation";
import { selectOnboardingActive, useAppStore } from "../../store";

export function MobileProjectHome() {
	const onboarding = useAppStore(selectOnboardingActive);
	const activeCreation = useAppStore((s) =>
		s.activeCreationId ? s.workspaceCreations[s.activeCreationId] : undefined,
	);
	if (activeCreation) return <WorkspaceCreationView creation={activeCreation} />;
	if (onboarding) return <WelcomePanel />;
	return <ProjectTree />;
}
