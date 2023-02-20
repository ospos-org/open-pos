import { useEffect } from "react"
import { applyPromotion, fromDbDiscount, parseDiscount } from "./discount_helpers";
import { Order, ProductPurchase, Promotion } from "./stock-types";

export default function PromotionList({
    promotions, cart
}: {
    promotions: Promotion[] | undefined,
    cart: Order[]
}) {
    return (
        <div className="flex flex-col gap-2 max-h-32 overflow-auto ">
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
    if(promo.get.SoloThis) {
        return `${promo.name} - Get ${parseDiscount(fromDbDiscount(promo.get.SoloThis)) + " off."}`
    }

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
        val = promo.name;
        // val += ((promo.get.Specific?.[1] ?? "") + (promo.get.Specific?.[0] ?? ""))
    }else if(promo.get.Any) {
        val += " any other " + promo.get.Any[0] + ", " + parseDiscount(fromDbDiscount(promo.get.Any[1])) + " off."
    }else if(promo.get.Category) {
        val += " any " + + promo.get.Category[1][0] +" other " + promo.get.Category[0] + ", " + parseDiscount(fromDbDiscount(promo.get.Category[1][1])) + " off."
    }

    return val
}