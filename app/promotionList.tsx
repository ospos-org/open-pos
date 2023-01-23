import { useEffect } from "react"
import { fromDbDiscount, parseDiscount } from "./discount_helpers";
import { Promotion } from "./stock-types";

export default function PromotionList({
    promotions
}: {
    promotions: Promotion[] | undefined
}) {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-400">PROMOTIONS</p>

            {
                promotions?.map(k => {
                    return (
                        <div key={k.id}>
                            <p className="text-blue-200 bg-blue-800 bg-opacity-40 px-4 py-2 h-fit rounded-md w-full">{formatPromotion(k)}</p>
                        </div>
                    )
                })
            }
        </div>
    )
}

function formatPromotion(promo: Promotion) {
    let val = "Buy ";

    if(promo.buy.Any) {
        val += promo.buy.Any
    }else {
        val += ((promo.buy.Specific?.[1] ?? "") + (promo.buy.Specific?.[0] ?? ""))
    }

    val += " get "

    if(promo.get.This) {
        val += "another " + promo.get.This[0] + ", " + parseDiscount(fromDbDiscount(promo.get.This[1]))
    }else if(promo.get.Specific) {
        val += ((promo.get.Specific?.[1] ?? "") + (promo.get.Specific?.[0] ?? ""))
    }else if(promo.get.Any) {
        val += " any other " + promo.get.Any[0] + ", " + parseDiscount(fromDbDiscount(promo.get.Any[1])) + " off."
    }

    return val
}