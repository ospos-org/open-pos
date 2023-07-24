import { useAtom, useAtomValue, useSetAtom } from "jotai"
import Image from "next/image"

import { applyDiscount, applyDiscountsConsiderateOfQuantity, findMaxDiscount, parseDiscount } from "@utils/discountHelpers"
import { Order, ProductPurchase } from "@utils/stockTypes"
import { inspectingProductAtom } from "@atoms/product"
import { aCustomerActiveAtom } from "@atoms/customer"
import { masterStateAtom } from "@atoms/openpos"
import { ordersAtom } from "@atoms/transaction"
import { sortOrders } from "@utils/utils"
import { ChildPerOrder } from "./ChildPerOrder"

export function CartProductsList() {
    const currentStore = useAtomValue(masterStateAtom)
    const aCustomerActive = useAtomValue(aCustomerActiveAtom)

    const setInspectingProduct = useSetAtom(inspectingProductAtom)

    const [ orderState, setOrderState ] = useAtom(ordersAtom)

    return (
        <div className="flex flex-col flex-1 h-full gap-4 overflow-auto max-h-full py-2">
            {
                (orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) ?? 0) <= 0 ?
                    <div className="flex flex-col items-center w-full">
                        <p className="text-sm text-gray-400 py-4 select-none">No products in cart</p>
                    </div>
                :
                <ChildPerOrder />
            }
        </div>
    )
}