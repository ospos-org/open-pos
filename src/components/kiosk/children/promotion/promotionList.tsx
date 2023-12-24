import { fromDbDiscount, parseDiscount } from "@utils/discountHelpers";
import moment from "moment";
import {Promotion} from "@/generated/stock/Api";

interface PromotionListProps {
    promotions: Promotion[] | undefined
}

export default function PromotionList({ promotions }: PromotionListProps) {
    return (
        <div className="flex flex-col gap-2 max-h-42 overflow-auto">
            <p className="text-sm text-gray-400">PROMOTIONS</p>

            {
                promotions
                    ?.filter((promotion) => new Date(promotion.valid_till).getTime() > new Date().getTime())
                    ?.map((promotion) => {
                        return (
                            <div key={promotion.id}>
                                <div className="text-blue-200 bg-blue-800 bg-opacity-40 px-4 py-2 h-fit rounded-md w-full flex flex-row justify-between">
                                    <p>{formatPromotion(promotion)}</p>
                                    <p>Expires {moment(promotion.valid_till).fromNow()}</p>
                                </div>
                            </div>
                        )
                    })
            }
        </div>
    )
}

function formatPromotion(promo: Promotion) {
    if(promo.get.type === "solothis") {
        return `${promo.name} - Get ${parseDiscount(fromDbDiscount(promo.get.value)) + " off."}`
    }

    let val = "Buy ";

    if(promo.buy.type === "any") {
        val += promo.buy.value
    }else {
        val += ((promo.buy.value?.[1] ?? "") + (promo.buy.value?.[0] ?? ""))
    }

    val += " get "

    if(promo.get.type === "this") {
        val += "another " + promo.get.value[0] + ", " + parseDiscount(fromDbDiscount(promo.get.value[1]))
    }else if(promo.get.type === "specific") {
        val = promo.name;
        // val += ((promo.get.Specific?.[1] ?? "") + (promo.get.Specific?.[0] ?? ""))
    }else if(promo.get.type === "any") {
        val += " any " + promo.get.value[0] + ", " + parseDiscount(fromDbDiscount(promo.get.value[1])) + " off."
    }else if(promo.get.type === "category") {
        val += " any " + + promo.get.value[1][0] +" other " + promo.get.value[0] + ", " + parseDiscount(fromDbDiscount(promo.get.value[1][1])) + " off."
    }

    return val
}