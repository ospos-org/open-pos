import {Promotion} from "@/generated/stock/Api";
import {fromDbDiscount, parseDiscount} from "@utils/discountHelpers";

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

export { formatPromotion }