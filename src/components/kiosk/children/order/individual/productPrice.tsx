import { aCustomerActiveAtom } from "@/src/atoms/customer";
import { applyDiscount, applyDiscountsConsiderateOfQuantity, findMaxDiscount, parseDiscount } from "@/src/utils/discountHelpers";
import { useAtomValue } from "jotai";
import {ContextualProductPurchase} from "@utils/stockTypes";

interface ProductPriceProps {
    product: ContextualProductPurchase
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
                                    {(product.transaction_type === "In" ? "-" : "")}${(product.variant_information.retail_price * product.quantity * 1.15).toFixed(2)}
                                </p> 
                                
                                {parseDiscount(max_disc.value)}
                            </div>

                            <p className={`${max_disc.source == "loyalty" ? "text-gray-300" : ""}`}>
                                {(product.transaction_type === "In" ? "-" : "")}${
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
                                }
                            </p>
                        </>
                    )
                })()
            }
        </div>
    )
}