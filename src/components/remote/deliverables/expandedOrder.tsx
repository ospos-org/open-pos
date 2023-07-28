import { deliverablesActiveOrderAtom, deliverablesMenuStateAtom, deliverablesStateChangeAtom } from "@/src/atoms/deliverables";
import { masterStateAtom, mobileLowModeAtom } from "@/src/atoms/openpos";
import { useWindowSize } from "@/src/hooks/useWindowSize";
import { useAtom, useAtomValue } from "jotai";
import OrderView from "../orderView"

export function ExpandedOrder() {
    const menuState = useAtomValue(deliverablesMenuStateAtom)
    const masterState = useAtomValue(masterStateAtom)
    const stateChange = useAtomValue(deliverablesStateChangeAtom)
    const lowModeCartOn = useAtomValue(mobileLowModeAtom)

    const [ activeOrder, setActiveOrder ] = useAtom(deliverablesActiveOrderAtom)

    const windowSize = useWindowSize()

    if (!(menuState == null && stateChange == null && (((windowSize.width ?? 0) < 640 && lowModeCartOn) || ((windowSize.width ?? 0) >= 640)))) {
        return <></>
    }

    return (
        <div className="bg-gray-900 p-6 flex flex-col h-full overflow-y-scroll" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
            {
                activeOrder != null ? 
                    <OrderView activeOrder={activeOrder} setActiveOrder={setActiveOrder} master_state={masterState} /> 
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