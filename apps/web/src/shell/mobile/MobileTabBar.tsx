import type { RemixiconComponentType } from "@remixicon/react";
import {
	RiChat2Fill,
	RiChat2Line,
	RiFileFill,
	RiFileLine,
	RiTaskFill,
	RiTaskLine,
} from "@remixicon/react";
import type { MessageKey } from "@thinkrail/locales";
import { useT } from "@thinkrail/locales/react";
import { buttonDataAttributes, buttonVariants } from "@thinkrail/ui/button";

export type MobileTab = "chat" | "files" | "plan";

type MobileTabEntry = {
	id: MobileTab;
	Line: RemixiconComponentType;
	Fill: RemixiconComponentType;
	label: MessageKey;
};

const TABS: readonly MobileTabEntry[] = [
	{
		id: "chat",
		Line: RiChat2Line,
		Fill: RiChat2Fill,
		label: "shell.mobile.tab.chat",
	},
	{
		id: "files",
		Line: RiFileLine,
		Fill: RiFileFill,
		label: "shell.mobile.tab.files",
	},
	{
		id: "plan",
		Line: RiTaskLine,
		Fill: RiTaskFill,
		label: "shell.mobile.tab.plan",
	},
];

const TAB_BUTTON_CLASS = buttonVariants({
	variant: "ghost",
	size: "m",
	className: "flex h-full flex-1 flex-col items-center justify-center gap-2",
});

export function MobileTabBar({
	tab,
	onChange,
}: {
	tab: MobileTab;
	onChange: (tab: MobileTab) => void;
}) {
	const t = useT();
	return (
		<nav
			data-testid="mobile-tabbar"
			className="flex h-48 border-t border-border-default bg-container-header-bg pb-[env(safe-area-inset-bottom)]"
		>
			{TABS.map(({ id, Line, Fill, label }) => {
				const active = tab === id;
				const Icon = active ? Fill : Line;
				return (
					<button
						key={id}
						type="button"
						data-testid={`mobile-tab-${id}`}
						aria-label={t(label)}
						aria-pressed={active}
						{...buttonDataAttributes({
							variant: "ghost",
							size: "m",
							iconOnly: false,
							selected: active,
						})}
						onClick={() => onChange(id)}
						className={TAB_BUTTON_CLASS}
					>
						<Icon className="size-20" />
						<span className="tr-text-ui">{t(label)}</span>
					</button>
				);
			})}
		</nav>
	);
}
