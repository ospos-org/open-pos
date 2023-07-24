import { ordersAtomsAtom } from "@/src/atoms/transaction"
import { useAtomValue } from "jotai"
import { OrderElement } from "./individual/orderElement"

export function ChildPerOrder() {
    const orders = useAtomValue(ordersAtomsAtom)

    return (
        <>
            {
                orders.map((orderAtom, index) => {
                    return (
                        // eslint-disable-next-line react/jsx-key
                        <OrderElement orderAtom={orderAtom} index={index} />
                    )
                })
            }
        </>
    )
}