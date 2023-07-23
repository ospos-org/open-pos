import { atom } from "jotai";
import { atomWithReset, RESET } from "jotai/utils";
import { customAlphabet } from "nanoid";
import { createRef, RefObject } from "react";
import { v4 } from "uuid";
import { getDate } from "../components/kiosk/kiosk";
import { discountFromPromotion, fromDbDiscount } from "../utils/discountHelpers";
import { OPEN_STOCK_URL } from "../utils/environment";
import { PAD_MODES } from "../utils/kioskTypes";
import { determineOptimalPromotionPathway } from "../utils/optimalPromotion";
import { Customer, DiscountValue, KioskState, Order, Product, Transaction, TransactionInput, TransactionType, VariantInformation } from "../utils/stockTypes";
import { computeDatabaseOrderFormat } from "./conversion";
import { customerAtom } from "./customer";
import { masterStateAtom } from "./openpos";
import { paymentIntentsAtom, priceAtom } from "./payment";
import { ordersAtom, ordersAtomsAtom } from "./transaction";

const defaultKioskAtom = atom((get) => {
    return {
        customer: get(customerAtom),
        transaction_type: get(transactionTypeAtom),
        products: get(ordersAtom),
        order_total: get(priceAtom).total,
        payment: get(paymentIntentsAtom),
        order_date: getDate(),
        order_notes: [],
        salesperson: get(masterStateAtom).employee?.id,
        till: get(masterStateAtom).kiosk_id
    } as KioskState
}, (_, set, resetKey: typeof RESET) => {
    if(resetKey === RESET) {
        set(customerAtom, null)
        set(ordersAtom, [])
        set(kioskPanelLogAtom, "cart")
    }
})

const transactionTypeAtom = atom<TransactionType>("Out")

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
        set(kioskPanelAtom, value)
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
const searchInputRefAtom = atom<RefObject<HTMLInputElement>>(createRef<HTMLInputElement>())

const generateTransactionAtom = atom((get) => {
    const customer = get(customerAtom)
    const products = get(computeDatabaseOrderFormat)

    return {
        ...get(defaultKioskAtom),
        customer: customer ? {
            customer_id: customer.id,
            customer_type: "Individual"
        } : {
            customer_id: get(masterStateAtom).store_id,
            customer_type: "Store"
        },
        products,
        // As we are saving the order, we aren't charging the customer anything.
        order_total: 0.00
    } as TransactionInput
})

const parkSaleAtom = atom(undefined, (get, set) => {
    if((get(ordersAtom)?.reduce((p, c) => p + c.products.length, 0) ?? 0) >= 1) {
        const transaction = get(generateTransactionAtom)

        fetch(`${OPEN_STOCK_URL}/transaction`, {
            method: "POST",
            body: JSON.stringify(transaction),
            credentials: "include",
            redirect: "follow"
        }).then(async k => {
            if(k.ok) {
                set(defaultKioskAtom, RESET)
            }else {
                alert("Something went horribly wrong")
            }
        })
    }
})

export { currentOrderAtom, searchInputRefAtom, parkSaleAtom, generateTransactionAtom, transactionTypeAtom, defaultKioskAtom, transactingOrderAtom, kioskPanelLogAtom, kioskPanelAtom, kioskPanelHistory, selectionAtom, activeDiscountAtom }