import * as Tooltip from '@radix-ui/react-tooltip';

function OTooltip({ children, name }: { children: React.ReactElement, name: string }) {
    return (
        <Tooltip.Provider delayDuration={100}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    { children }
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content className="TooltipContent" sideOffset={25} side="right">
                        <div className="bg-gray-700 p-2 px-4 rounded-md font-medium text-gray-200">
                            { name }
                        </div>
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    )
}

export default OTooltip