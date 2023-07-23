import { PrimitiveAtom, useAtomValue } from "jotai"

import { Order } from "@utils/stockTypes"

export function NoteOrderItem({ activeAtom, callback }: { activeAtom: PrimitiveAtom<Order>, callback: (orderAtom: PrimitiveAtom<Order>) => void }) {
    const order = useAtomValue(activeAtom)

    return (
        <div key={order.id} className="hover:bg-gray-600 cursor-pointer px-4 py-2 w-full text-center" onClick={() => {
            callback(activeAtom)
        }}>
            {order.order_type.toUpperCase()} - {order?.origin?.store_code}
        </div>
    )
}