import { Check } from "react-feather"
import { useAtomValue } from "jotai"
import moment from "moment"

import { Order, PickStatus } from "@utils/stockTypes"
import { deliverablesAtom } from "@atoms/deliverables"
import { useWindowSize } from "@hooks/useWindowSize"

interface OrderGroupViewProps {
    setActiveCallback: (newActiveOrder: Order) => void
}

export function OrderGroupView({ setActiveCallback }: OrderGroupViewProps) {
    const deliverables = useAtomValue(deliverablesAtom)

    const windowSize = useWindowSize()

    return (
        <div className="overflow-y-scroll py-4">
            {
                deliverables.length <= 0 ?
                <div className="flex items-center justify-center h-full pt-4">
                    <p className="text-gray-400">No Deliverables</p>
                </div>
                :
                <div className="flex flex-col gap-4">
                    {
                        deliverables.map((b, indx) => {
                            let total_products = 0
                            let completed = 0;

                            b.products.map(v => {
                                total_products += v.quantity
                                v?.instances?.map(k => {
                                    if(k.fulfillment_status.pick_status.toLowerCase() == "picked") {
                                        completed += 1
                                    }
                                })
                            })

                            const pairings = new Map()

                            b.products.map(n => {
                                n?.instances?.map(l => {
                                    if(pairings.get(l.fulfillment_status.pick_status) == undefined){
                                        pairings.set(l.fulfillment_status.pick_status, 1)
                                    }else {
                                        pairings.set(l.fulfillment_status.pick_status, pairings.get(l.fulfillment_status.pick_status)+1)
                                    }
                                })
                            })

                            const mapped = Array.from(pairings, ([name, value]) => ({ name, value }));
                            mapped.sort((a, b) => {
                                if (a.name < b.name) {
                                    return -1;
                                }else if (a.name > b.name) {
                                    return 1;
                                }else {
                                    return 0;
                                }
                            });

                            return (
                                <>
                                    <div
                                        onClick={() => {
                                            if ((windowSize?.width ?? 0) < 640) {
                                                setActiveCallback(b)
                                            }
                                        }} 
                                        className="grid grid-flow-row gap-y-4 gap-x-2 items-center px-2" style={{ gridTemplateColumns: (windowSize?.width ?? 0) < 640 ? "1fr 1fr" : ".5fr 1fr 250px 117px" }}>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-row gap-2">
                                                {
                                                    (b.status.status?.type === "transit" || b.status.status?.type === "instore" || b.status.status.type === "fulfilled") ?
                                                        <p className="text-white font-mono font-bold px-2 bg-blue-600 rounded-md py-1"><Check color="white" size={18}/></p>
                                                    :
                                                    completed === total_products ? 
                                                        <p className="text-white font-mono font-bold px-2 bg-green-600 rounded-md">{completed}/{total_products}</p>
                                                    :
                                                        <p className="text-white font-mono font-bold px-2 bg-gray-700 rounded-md">{completed}/{total_products}</p>
                                                }
                                                <p className="text-white font-semibold not-italic md:visible hidden">Products Picked</p>
                                            </div>
                                            
                                            <div className="flex flex-row items-center gap-2">
                                                <div className="flex flex-row items-center justify-between gap-2">
                                                    {
                                                        mapped.map((status: { name: PickStatus, value: number }) => {
                                                            return (
                                                                <div
                                                                    key={JSON.stringify(status)} 
                                                                    className={"flex flex-row items-center bg-gray-700 rounded-full max-h-4 pr-2 gap-1 justify-between w-full flex-1"}>
                                                                    {(() => {
                                                                        switch(status.name.toLowerCase()) {
                                                                            case "picked":
                                                                                return (
                                                                                    <div className="border-green-400 bg-green-700 border-2 h-4 w-4 min-w-[16px] min-h-[16px] rounded-full"></div>
                                                                                )
                                                                            case "pending":
                                                                                return (
                                                                                    <div className="border-gray-400 bg-gray-700 border-2 h-4 w-4 min-w-[16px] min-h-[16px] rounded-full"></div>
                                                                                )
                                                                            case "failed":
                                                                                return (
                                                                                    <div className="border-red-400 bg-red-700 border-2 h-4 w-4 min-w-[16px] min-h-[16px] rounded-full"></div>
                                                                                )
                                                                            case "uncertain":
                                                                                return (
                                                                                    <div className="border-orange-400 bg-orange-700 border-2 h-4 w-4 min-w-[16px] min-h-[16px] rounded-full"></div>
                                                                                )
                                                                            case "processing":
                                                                                return (
                                                                                    <div className="border-blue-400 bg-blue-700 border-2 h-4 w-4 min-w-[16px] min-h-[16px] rounded-full"></div>
                                                                                )
                                                                            default:
                                                                                return <></>
                                                                        }
                                                                    })()}
                                                                    
                                                                    <p className="text-gray-200 text-sm">{status.value}</p>
                                                                </div>
                                                            )
                                                            
                                                        })
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {
                                            (windowSize?.width ?? 0) > 640 
                                            ?
                                            <p className="text-white opacity-40 overflow-ellipsis overflow-hidden whitespace-nowrap">
                                                {
                                                    b.products.map(k => k.product_name).join(", ")
                                                }
                                            </p>
                                            :
                                            <></>
                                        }
                                        

                                        <div className="flex flex-col md:flex-row items-end sm:items-start md:gap-4">
                                            <p className="text-white font-mono font-bold">{b.reference}</p>
                                            <p className="text-white text-opacity-50">{moment(b.status.timestamp).format('D/MM/yy')}</p>
                                        </div>

                                        {
                                            (windowSize?.width ?? 0) > 640 
                                            ?
                                            <p 
                                                onClick={() => { setActiveCallback(b) }}
                                                className="bg-gray-100 text-sm text-end w-fit rounded-md place-center self-center items-center text-gray-800 font-bold px-4 justify-self-end hover:cursor-pointer">
                                                <i className="md:visible invisible not-italic text-sm">{(windowSize?.width ?? 0) > 640 ? "View " : ""}</i>-{">"}
                                            </p> 
                                            :
                                            <></>
                                        }
                                    </div>

                                    {
                                        indx == deliverables.length-1 ? <></> : <hr className="border-gray-700" />
                                    }
                                </>
                            )
                        })
                    }
                </div>
            }
        </div>
    )
}