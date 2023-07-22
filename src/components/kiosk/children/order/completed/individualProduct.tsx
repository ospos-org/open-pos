import { applyDiscount, findMaxDiscount } from "@/src/utils/discount_helpers"
import { Order } from "@/src/utils/stock_types"
import { PrimitiveAtom, useAtomValue } from "jotai"

export function IndividualProduct({ productAtom, customerActive }: { productAtom: PrimitiveAtom<Order>, customerActive: boolean }) {
    const order = useAtomValue(productAtom)

    return (
        <div>
            {
                order.products?.map(e => {
                    return (
                        <div key={`PRD${e.product_code}-${e.id}`} className="flex flex-row items-center gap-8">
                            <p className="text-white font-bold">{e.quantity}</p>

                            <div className="flex flex-col gap-0 flex-1">
                                <p className="text-white">{e.product.name}</p>
                                <p className="text-gray-600">{e.variant_information.name}</p>
                            </div>

                            <p className="text-white font-bold">${applyDiscount(e.variant_information.retail_price * 1.15, findMaxDiscount(e.discount, e.variant_information.retail_price, customerActive)[0].value)?.toFixed(2)}</p>
                        </div>
                    )
                })
            }
        </div>
    )
}