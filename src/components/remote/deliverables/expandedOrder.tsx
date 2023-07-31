import { useAtom, useAtomValue } from "jotai"

import { 
    deliverablesStateChangeAtom,
    deliverablesActiveOrderAtom, 
    deliverablesMenuStateAtom
} from "@atoms/deliverables";
import { mobileLowModeAtom } from "@atoms/openpos"
import { useWindowSize } from "@hooks/useWindowSize"
import OrderView from "../orderView"

export function ExpandedOrder() {
    const menuState = useAtomValue(deliverablesMenuStateAtom)
    const stateChange = useAtomValue(deliverablesStateChangeAtom)
    const activeOrder = useAtomValue(deliverablesActiveOrderAtom)
    const lowModeCartOn = useAtomValue(mobileLowModeAtom)

    const windowSize = useWindowSize()
    
    // Don't show on specific situations
    if (
        !(
            menuState == null && 
            stateChange == null && 
            (
                (
                    (windowSize.width ?? 0) < 640 
                    && lowModeCartOn
                ) 
                || 
                (
                    (windowSize.width ?? 0) >= 640
                )
            )
        )
    ) {
        return <></>
    }

    return (
        <div className="bg-gray-900 p-6 flex flex-col h-full overflow-y-scroll" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
            {
                activeOrder != null ? 
                    <OrderView orderAtom={deliverablesActiveOrderAtom} /> 
                : 
                    <div className="h-full flex flex-col items-center justify-center flex-1">
                        <p className="text-gray-400 text-center self-center">
                            Please <strong>view</strong> an order to begin.
                        </p>
                    </div>
            }
        </div>
    )
}