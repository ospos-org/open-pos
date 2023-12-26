import {splitAtom, useResetAtom} from "jotai/utils";
import { atom } from "jotai";

import { determineOptimalPromotionPathway } from "@utils/optimalPromotion";
import { discountFromPromotion, fromDbDiscount } from "@utils/discountHelpers";
import {ContextualDiscountValue, ContextualOrder} from "@utils/stockTypes";
import {Customer, Order, Store, Transaction} from "@/generated/stock/Api";

const _ordersAtom = atom<ContextualOrder[]>([])
const ordersAtomsAtom = splitAtom(_ordersAtom)

/// We build orders upon this atom, committing changes to the transactionAtom.
const ordersAtom = atom(
    (get) => get(_ordersAtom), 
    (get, set, value: ContextualOrder[]) => {
        set(_ordersAtom, value)
        
        let flat_products = get(ordersAtomsAtom).map(k => get(k).products).flatMap(k => k);

        const optimal_products = determineOptimalPromotionPathway(flat_products);
        let optimal_queue = optimal_products.filter(b => b.chosen_promotion?.promotion != null && b.chosen_promotion != null);

        const applied_promotions = get(ordersAtomsAtom).map(b => {
            return { ...get(b), products: get(b).products.map(k => {
                const dim = [];

                for(let i = 0; i < k.quantity; i++) {
                    // Find relevant in optimal list
                    const exists = optimal_queue.findIndex(n => n.reference_field.barcode == k.variant_information.barcode);

                    // console.log("::index::", exists, optimal_queue[exists]);

                    if(exists !== -1 && optimal_queue[exists].chosen_promotion != null && optimal_queue[exists].chosen_promotion?.promotion != null) {
                        // Apply discount
                        const di =  {
                            source: "promotion",
                            value: fromDbDiscount(discountFromPromotion(optimal_queue[exists].chosen_promotion!.promotion!)),
                            promotion: optimal_queue[exists].chosen_promotion!.promotion,
                            applicable_quantity: 1
                        } as ContextualDiscountValue;

                        // console.log("applying, di: ", di);
                        dim.push(di);

                        // Remove from queue
                        optimal_queue.splice(exists, 1);
                    }
                }

                return {
                    ...k,
                    discount: [...k.discount.filter(b => b.source !== "promotion"), ...dim]
                }
            })}
        });

        set(_ordersAtom, applied_promotions)
    }
)

const inspectingTransactionAtom = atom<{
    item: Transaction,
    identifier: string
} | null>(null)

const transactionMenuSelectorOpenAtom = atom(false)

const transactionViewState = {
    attachedCustomer: atom<Customer | Store | undefined>(undefined),
    selectedItems: atom<{ product_id: string, quantity: number}[]>([]),
    activeTransaction: atom<Order | undefined>(undefined)
}

export {
    ordersAtom,
    ordersAtomsAtom,
    inspectingTransactionAtom,
    transactionMenuSelectorOpenAtom,
    transactionViewState
}