import { aCustomerActiveAtom } from "@/src/atoms/customer";
import { applyDiscount, applyDiscountsConsiderateOfQuantity, findMaxDiscount, parseDiscount } from "@/src/utils/discountHelpers";
import { ProductPurchase } from "@/src/utils/stockTypes";
import { useAtomValue } from "jotai";

interface ProductPriceProps {
    product: ProductPurchase
}

export function ProductPrice({ product }: ProductPriceProps) {
    const aCustomerActive = useAtomValue(aCustomerActiveAtom)

    return (
        <div className="min-w-[75px] flex flex-col items-center">
            {
                (() => {
                    const max_disc = findMaxDiscount(product.discount, product.variant_information.retail_price, aCustomerActive)[0];

                    return (
                        applyDiscount(product.variant_information.retail_price, findMaxDiscount(product.discount, product.variant_information.retail_price, aCustomerActive)[0].value) == product.variant_information.retail_price ?
                        <p>${(product.variant_information.retail_price * product.quantity * 1.15).toFixed(2) }</p>
                        :
                        <>
                            <div className={`text-gray-500 text-sm ${max_disc.source == "loyalty" ? "text-gray-500" : max_disc.source == "promotion" ? "text-blue-500 opacity-75" : "text-red-500"} flex flex-row items-center gap-2`}>
                                <p className="line-through">
                                    ${(product.variant_information.retail_price * product.quantity * 1.15).toFixed(2)}
                                </p> 
                                
                                {parseDiscount(max_disc.value)}
                            </div>

                            <p className={`${max_disc.source == "loyalty" ? "text-gray-300" : ""}`}>
                                ${
                                    (
                                        (
                                            (product.variant_information.retail_price * product.quantity) * 1.15
                                        ) 
                                        - 
                                        applyDiscountsConsiderateOfQuantity(
                                            product.quantity, 
                                            product.discount, 
                                            product.variant_information.retail_price * 1.15,
                                            aCustomerActive
                                        )
                                    ).toFixed(2)
                                    // ((applyDiscount((e.variant_informatiocurrentOrder.retail_price * e.quantity) * 1.15, findMaxDiscount(e.discount, e.variant_informatiocurrentOrder.retail_price, !(!customerState))[0].value) ?? 1)).toFixed(2)
                                }
                            </p>
                        </>
                    )
                })()
            }
        </div>
    )
}