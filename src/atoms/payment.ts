import { atom } from "jotai";

import { applyDiscount, applyDiscountsConsiderateOfQuantity } from "@utils/discountHelpers";

import { aCustomerActiveAtom } from "@atoms/customer";
import { ordersAtomsAtom } from "@atoms/transaction";
import {Payment} from "@/generated/stock/Api";

const paymentHistoryAtom = atom<PriceModification[]>([])
const currentPaidAmountAtom = atom<number>(
    (get) => get(paymentHistoryAtom)
        .reduce((previous, modification) => previous + modification.quantity, 0)
)

interface PriceModification {
    quantity: number,
    method: "card" | "cash" | "gift-card"
} 

interface ActivePayment {
    total: number,
    tax: number,
    sub_total: number,
    non_discounted_sub_total: number,
    payable: number
}

const priceAtom = atom(
    (get) => {
        const applied_promotions = get(ordersAtomsAtom)

        // Order state has been changed. Regenerate values
        let non_discounted_sub_total = applied_promotions.reduce(
            (p,c) => 
                p + applyDiscount(
                    get(c).products.reduce(function (prev, curr) {
                        return prev + (curr.variant_information.retail_price * curr.quantity)
                    }, 0)
                , get(c).discount)
            , 0);

        let sub_total = applied_promotions.reduce(
            (p,c) => 
                p + applyDiscount(
                    get(c).products.reduce(function (prev, curr) {
                        return prev + (
                            ((curr.variant_information.retail_price) * curr.quantity) - applyDiscountsConsiderateOfQuantity(curr.quantity, curr.discount, curr.variant_information.retail_price, get(aCustomerActiveAtom))
                        )
                    }, 0)
                , get(c).discount)
            , 0)

        let total = applied_promotions.reduce(
            (p,c) => 
                p += applyDiscount(
                    get(c).products.reduce(function (prev, curr) {
                        return prev + (
                            ((curr.variant_information.retail_price * 1.15) * curr.quantity) - applyDiscountsConsiderateOfQuantity(curr.quantity, curr.discount, curr.variant_information.retail_price * 1.15, get(aCustomerActiveAtom))
                        )
                    }, 0) 
                , get(c).discount) 
            , 0);
        
        let tax = total-sub_total;
        let payable = total - get(currentPaidAmountAtom)
        
        return {
            total,
            payable,
            tax,
            sub_total,
            non_discounted_sub_total,
        } as ActivePayment
    },
    (get, set, modification: PriceModification) => {
        set(paymentHistoryAtom, [...get(paymentHistoryAtom), modification])
    }
)

/// The amount the user is trying to pay in the current instance.
const probingPricePayableAtom = atom<number | null>(null)

const paymentIntentsAtom = atom<Payment[]>([])

export { priceAtom, paymentIntentsAtom, probingPricePayableAtom }