import { useAtomValue } from "jotai"
import Image from "next/image"

import { ordersAtom } from "@atoms/transaction"
import {ContextualOrder} from "@utils/stockTypes";
import OrderTypeIcon from "@components/kiosk/children/order/individual/orderTypeIcon";
import OrderHeader from "@components/kiosk/children/order/individual/orderHeader";
import OrderDestination from "@components/kiosk/children/order/individual/orderDestination";

interface OrderTitleProps {
    currentOrder: ContextualOrder,
    index: number
}

export function OrderTitle({ currentOrder, index }: OrderTitleProps) {
    const orderState = useAtomValue(ordersAtom)

    if (orderState.length !== 1 || orderState[0].order_type !== "direct") {
        return (
            <div className={`flex select-none flex-row w-full justify-between gap-2 ${index == 0 ? "" : "mt-4"}`}>
                <div className="flex flex-col gap-1">
                    <OrderHeader currentOrder={currentOrder} />
                    <OrderDestination currentOrder={currentOrder} />
                </div>
            </div>
        )
    }

    return <></>
}