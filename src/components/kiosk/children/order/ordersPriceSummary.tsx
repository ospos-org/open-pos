import { useAtomValue } from "jotai"

import { priceAtom } from "@atoms/payment"
import {useMemo} from "react";

export function OrdersPriceSummary() {
    const orderInfo = useAtomValue(priceAtom)

    const totalSummary = useMemo(() => {
        if (orderInfo.sub_total !== orderInfo.non_discounted_sub_total) {
            return `(-$${(orderInfo.non_discounted_sub_total - orderInfo.sub_total).toFixed(2)})`
        }

        return "-"
    }, [orderInfo.non_discounted_sub_total, orderInfo.sub_total])

    return (
        <div className="flex flex-row items-center text-white justify-between px-2">
            <div>
                <p className="text-gray-400 font-bold">Sub Total</p>
                <p className="text-gray-600 font-bold">Tax</p>
                <p className="font-bold text-lg">Total</p>
            </div>
            
            <div className="flex flex-col gap-0">
                <p className="text-gray-400 font-bold items-end self-end">
                    ${orderInfo?.sub_total.toFixed(2)}
                    {totalSummary}
                </p>

                <p className="text-gray-600 font-bold items-end self-end">+15% (${orderInfo.tax.toFixed(2)})</p>
                <p className="font-bold text-lg items-end self-end">${orderInfo.total.toFixed(2)}</p>
            </div>
        </div>
    )
}