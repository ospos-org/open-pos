import { useAtomValue } from "jotai"
import Image from "next/image"

import { ordersAtom } from "@atoms/transaction"
import { Order } from "@utils/stockTypes"

interface OrderTitleProps {
    currentOrder: Order,
    index: number
}

export function OrderTitle({ currentOrder, index }: OrderTitleProps) {
    const orderState = useAtomValue(ordersAtom)

    if (orderState.length !== 1) {
        return (
            <div className={`flex select-none flex-row w-full justify-between gap-2 ${index == 0 ? "" : "mt-4"}`}>
                <div className="flex flex-col gap-1">
                    <div className="flex flex-row items-center gap-2 select-none">
                        {
                            currentOrder.order_type == "pickup" ?
                            <Image src="/icons/building-02.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                            :
                            currentOrder.order_type == "quote" ?
                            <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                            :
                            currentOrder.order_type == "shipment" ?
                            <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                            :
                            <Image src="/icons/shopping-bag-01-filled.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                        }

                        <div className="text-white font-semibold flex flex-row items-center gap-2">
                            { currentOrder.order_type == "pickup" ? currentOrder.destination?.contact?.name : currentOrder.order_type == "direct" ? "Instore Purchase" : currentOrder?.origin?.contact?.name} 

                            {
                                currentOrder.order_type !== "pickup" && currentOrder.order_type !== "direct" && currentOrder.order_type !== "quote" ?
                                <p className="text-gray-400"> -&gt; {currentOrder.destination?.contact.address.street}</p>
                                :
                                <></>
                            }
                        </div>
                    </div>
                    
                    { 
                        currentOrder.order_type == "pickup" ? 
                        <p className="text-gray-400">{currentOrder.destination?.contact.address.street}, {currentOrder.destination?.contact.address.street2}, {currentOrder.destination?.contact.address.po_code}</p>
                        :
                        currentOrder.order_type !== "direct" && currentOrder.order_type !== "quote" ?
                        <p className="text-gray-400">{currentOrder.origin?.contact.address.street}, {currentOrder.origin?.contact.address.street2}, {currentOrder.origin?.contact.address.po_code}</p>
                        :
                        <></>
                    }
                </div>
            </div>
        )
    }

    if (orderState[0].order_type !== "direct") {
       return (
            <div className={`flex select-none flex-row w-full justify-between gap-2 ${index == 0 ? "" : "mt-4"}`}>
                <div className="flex flex-col gap-1">
                    <div className="flex flex-row items-center gap-2 select-none">
                        {
                            currentOrder.order_type == "pickup" ?
                            <Image src="/icons/building-02.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                            :
                            currentOrder.order_type == "quote" ?
                            <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                            :
                            currentOrder.order_type == "shipment" ?
                            <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                            :
                            <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                        }

                        <div className="text-white font-semibold flex flex-row items-center gap-2">
                            { currentOrder.order_type == "pickup" ? currentOrder.destination?.contact?.name : currentOrder.origin?.contact?.name} 
                            {/* <p className="text-gray-400">({ currentOrder.order_type == "pickup" ? currentOrder.destination?.store_code : currentOrder.origin?.store_code})</p>  */}
                            
                            {
                                currentOrder.order_type !== "pickup" ?
                                <p className="text-gray-400"> -&gt; {currentOrder.destination?.contact.address.street}</p>
                                :
                                <></>
                            }
                        </div>
                    </div>
                    
                    { 
                        currentOrder.order_type == "pickup" ? 
                        <p className="text-gray-400">{currentOrder.destination?.contact.address.street}, {currentOrder.destination?.contact.address.street2}, {currentOrder.destination?.contact.address.po_code}</p>
                        :
                        <p className="text-gray-400">{currentOrder.origin?.contact.address.street}, {currentOrder.origin?.contact.address.street2}, {currentOrder.origin?.contact.address.po_code}</p>
                    } 
                </div>
            </div>
       )
    }

    return <></>
}