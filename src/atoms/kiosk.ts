import { atom } from "jotai";
import { atomWithReset, RESET, useResetAtom } from "jotai/utils";
import { customAlphabet } from "nanoid";
import { v4 } from "uuid";
import { getDate } from "../components/kiosk/kiosk";
import { discountFromPromotion, fromDbDiscount } from "../utils/discount_helpers";
import { determineOptimalPromotionPathway } from "../utils/helpers";
import { PAD_MODES } from "../utils/kiosk_types";
import { Customer, Discount, DiscountValue, KioskState, Order, Product, Transaction, VariantInformation } from "../utils/stock_types";
import { masterStateAtom } from "./openpos";
import { ordersAtomsAtom } from "./transaction";

const defaultKioskAtom = atomWithReset<KioskState>({
    customer: null,
    transaction_type: "Out",
    products: [],
    order_total: null,
    payment: [],
    order_date: null,
    order_notes: [],
    salesperson: null,
    till: null
})

const currentOrderAtom = atomWithReset<Order>({
    id: v4(),
    destination: null,
    origin: null,
    products: [],
    status: {
        status: {
            type: "queued",
            value: getDate()
        },
        assigned_products: [],
        timestamp: getDate()
    },
    status_history: [],
    order_history: [],
    order_notes: [],
    reference: `RF${customAlphabet(`1234567890abcdef`, 10)(8)}`,
    creation_date: getDate(),
    discount: "a|0",
    order_type: "direct",
    previous_failed_fulfillment_attempts: []
})

/// We build orders upon this atom, committing changes to the transactionAtom.
const transactingOrderAtom = atom(
    (get) => get(currentOrderAtom), 
    (get, set) => {
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
                        } as DiscountValue;

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

        set(currentOrderAtom, { ...get(currentOrderAtom), ...applied_promotions })
    }
)

const kioskPanelAtom = atomWithReset<PAD_MODES>("cart")
const kioskPanelHistory = atomWithReset<PAD_MODES[]>([])

const kioskPanelLogAtom = atom(
    (get) => get(kioskPanelAtom), 
    (get, set, value: PAD_MODES) => {
        set(kioskPanelHistory, [...get(kioskPanelHistory), value])
    }
)

interface KioskSelections {
    product: Product | null,
    customer: Customer | null,
    transaction: Transaction | null,
}

const selectionAtom = atom<KioskSelections>({
    product: null,
    customer: null,
    transaction: null
})

export interface ActiveDiscountApplication {
    type: "absolute" | "percentage",
    product: VariantInformation | null,
    value: number,
    for: "cart" | "product",
    exclusive: boolean,
    orderId: string,
    source: "user"
}

const activeDiscountAtom = atom<ActiveDiscountApplication | null>(null)

export { currentOrderAtom, defaultKioskAtom, transactingOrderAtom, kioskPanelLogAtom, kioskPanelAtom, kioskPanelHistory, selectionAtom, activeDiscountAtom }