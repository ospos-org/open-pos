import { aCustomerActiveAtom } from "@/src/atoms/customer";
import { applyDiscount, applyDiscountsConsiderateOfQuantity, findMaxDiscount, parseDiscount } from "@/src/utils/discountHelpers";
import { useAtomValue } from "jotai";
import {ContextualProductPurchase} from "@utils/stockTypes";
import {useMemo} from "react";

interface ProductPriceProps {
    product: ContextualProductPurchase
}

export function ProductPrice({ product }: ProductPriceProps) {
    const aCustomerActive = useAtomValue(aCustomerActiveAtom)

    const elementContent = useMemo(() => {
        const maxDiscount = findMaxDiscount(product.discount, product.variant_information.retail_price, aCustomerActive)[0];

        const priceAlreadyDiscounted =
            applyDiscount(product.variant_information.retail_price, maxDiscount.value)
            == product.variant_information.retail_price

        if (priceAlreadyDiscounted) {
            return (
                <p>${(product.variant_information.retail_price * product.quantity * 1.15).toFixed(2)}</p>
            )
        }

        return (
            <>
                <div className={`
                    text-gray-500 text-sm ${
                        maxDiscount.source == "loyalty" 
                            ? "text-gray-500" 
                            : maxDiscount.source == "promotion" 
                                ? "text-blue-500 opacity-75" 
                                : "text-red-500"
                    } flex flex-row items-center gap-2`}
                >
                    <p className="line-through">
                        {(product.transaction_type === "In" ? "-" : "")}
                        ${(product.variant_information.retail_price * product.quantity * 1.15).toFixed(2)}
                    </p>

                    {parseDiscount(maxDiscount.value)}
                </div>

                <p className={maxDiscount.source == "loyalty" ? "text-gray-300" : ""}>
                    {(product.transaction_type === "In" ? "-" : "")}
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
                    }
                </p>
            </>
        )
    }, [aCustomerActive, product])

    return (
        <div className="min-w-[75px] flex flex-col items-center">
            {elementContent}
        </div>
    )
}