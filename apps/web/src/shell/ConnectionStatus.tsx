import { RiCircleLine as Circle, RiCircleFill } from "@remixicon/react";
import type { MessageKey } from "@thinkrail/locales";
import { useT } from "@thinkrail/locales/react";
import { cn } from "@thinkrail/ui/utils";
import type { ConnectionStatus } from "../transport";

const STATUS_LABEL: Record<ConnectionStatus, MessageKey> = {
	connected: "shell.connection.connected",
	connecting: "shell.connection.connecting",
	disconnected: "shell.connection.disconnected",
};

const STATUS_DOT: Record<ConnectionStatus, string> = {
	connected: "text-feedback-success",
	connecting: "text-feedback-warning",
	disconnected: "text-feedback-error",
};

export function ConnectionStatusIndicator({ status }: { status: ConnectionStatus }) {
	const t = useT();
	const StatusDot = status === "connected" ? RiCircleFill : Circle;
	return (
		<span
			data-testid="connection-status"
			data-status={status}
			role="status"
			aria-label={t(STATUS_LABEL[status])}
			className="inline-flex items-center gap-8 tr-text-ui text-text-muted"
		>
			<StatusDot
				aria-hidden="true"
				className={cn("size-8 shrink-0 fill-current", STATUS_DOT[status])}
			/>
			<span aria-hidden="true" className="hidden sm:inline">
				{t(STATUS_LABEL[status])}
			</span>
		</span>
	);
}
