import { atom } from "jotai";

import { applyDiscount, applyDiscountsConsiderateOfQuantity } from "@utils/discountHelpers";

import { aCustomerActiveAtom } from "@atoms/customer";
import { ordersAtomsAtom } from "@atoms/transaction";
import {Payment, PaymentAction} from "@/generated/stock/Api";
import {getDate} from "@utils/utils";
import {v4} from "uuid";
import {defaultKioskAtom} from "@atoms/kiosk";
import {activeEmployeeAtom, masterStateAtom} from "@atoms/openpos";

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

const generateIntentAtom = atom(
    undefined,
    (get, set) => {
        const newIntent: Payment = {
            id: v4(),
            amount: {
                quantity: get(probingPricePayableAtom) ?? 0,
                currency: 'NZD'
            },
            delay_action: PaymentAction.Cancel,
            delay_duration: "PT12H",
            fulfillment_date: getDate(),
            order_ids: ["?"],
            payment_method: "Card",
            processing_fee: {quantity: 0.1, currency: 'NZD'},
            processor: {
                location: get(masterStateAtom).store_id ?? "000",
                employee: get(activeEmployeeAtom)?.id ?? "000",
                software_version: 'k0.5.2',
                token: 'dec05e7e-4228-46c2-8f87-8a01ee3ed5a9'
            },
            status: {
                Complete: {
                    CardDetails: {
                        card_brand: "VISA",
                        last_4: "4025",
                        exp_month: "03",
                        exp_year: "2023",
                        fingerprint: "a20@jA928ajsf9a9828",
                        card_type: "DEBIT",
                        prepaid_type: "NULL",
                        bin: "",

                        entry_method: "PIN",
                        cvv_accepted: "TRUE",
                        avs_accepted: "TRUE",
                        auth_result_code: "YES",
                        statement_description: "DEBIT ACCEPTED",
                        card_payment_timeline: {
                            authorized_at: "",
                            captured_at: ""
                        }
                    }
                }
            }
        };

        const newIntentList = [...get(paymentIntentsAtom), newIntent]
        set(paymentIntentsAtom, newIntentList)

        return newIntentList
    }
)

export { priceAtom, generateIntentAtom, paymentIntentsAtom, probingPricePayableAtom }