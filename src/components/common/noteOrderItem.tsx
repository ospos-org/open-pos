import { PrimitiveAtom, useAtomValue } from "jotai"

import { Order } from "@utils/stockTypes"

export function NoteOrderItem({ order, callback }: { order: Order, callback: (orderAtom: Order) => void }) {
    return (
        <div key={order.id} className="hover:bg-gray-600 cursor-pointer px-4 py-2 w-full text-center" onClick={() => {
            callback(order)
        }}>
            {order.order_type.toUpperCase()} - {order?.origin?.store_code}
        </div>
    )
}