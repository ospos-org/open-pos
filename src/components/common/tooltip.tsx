import { Side } from "@radix-ui/react-popper";
import * as Tooltip from "@radix-ui/react-tooltip";

function OTooltip({
	children,
	name,
	side = "right",
}: { children: React.ReactElement; name: string; side?: Side }) {
	return (
		<Tooltip.Provider delayDuration={100}>
			<Tooltip.Root>
				<Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						className="TooltipContent"
						sideOffset={25}
						side={side}
					>
						<div className="bg-gray-700 border-[1px] border-gray-600 shadow-lg shadow-gray-800 p-2 px-4 rounded-md font-medium text-gray-200">
							{name}
						</div>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		</Tooltip.Provider>
	);
}

export default OTooltip;
