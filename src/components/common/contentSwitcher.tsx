import { useAtomValue } from "jotai"

import Deliverables from "@components/remote/deliverables"
import { pageAtom } from "@atoms/openpos"
import Receivables from "@components/remote/receivables"
import Inventory from "@components/inventory/inventory"
import Kiosk from "@components/kiosk/kiosk"
import Job from "@components/job/job"

export function ContentSwitcher() {
    const page = useAtomValue(pageAtom)

    return (
        <div className="bg-gray-800 flex flex-1 overflow-hidden">
            {
                (() => {
                    switch(page) {
                        case 0:
                            return <Kiosk />
                        case 1:
                            return <Inventory />
                        case 2:
                            return <Job />
                        case 3:
                            return <Deliverables />
                        case 4:
                            return <Receivables />
                        case 5:
                            return <></>
                        default:
                            return <Kiosk />
                    }
                })()
            }
        </div>
    )
}