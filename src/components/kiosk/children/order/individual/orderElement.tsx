import { PrimitiveAtom, useAtomValue } from "jotai"

import { Order } from "@utils/stockTypes"

import { ChildPerProduct } from "./childPerProduct"
import { PromotionLabel } from "./promotionLabel"
import { OrderTitle } from "./orderTitle"

interface OrderElementProps {
    orderAtom: PrimitiveAtom<Order>,
    index: number
}

export function OrderElement({ orderAtom, index }: OrderElementProps) {
    const currentOrder = useAtomValue(orderAtom)

    return (
        <div key={currentOrder.id} className="flex flex-col gap-4">
            <OrderTitle currentOrder={currentOrder} index={index} />
            <PromotionLabel currentOrder={currentOrder} />
            <ChildPerProduct currentOrder={currentOrder} />
        </div>
    )
}