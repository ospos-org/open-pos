import { atomWithReset, RESET } from "jotai/utils";
import { createRef, RefObject } from "react";
import { customAlphabet } from "nanoid";
import { atom } from "jotai";
import { v4 } from "uuid";

import { Customer, KioskState, Order, Product, ProductPurchase, Transaction, TransactionInput, TransactionType, VariantInformation } from "@utils/stockTypes";
import { OPEN_STOCK_URL } from "@utils/environment";
import { PAD_MODES } from "@utils/kioskTypes";

import { paymentIntentsAtom, priceAtom } from "@atoms/payment";
import { ordersAtom } from "@atoms/transaction";
import { computeDatabaseOrderFormat } from "@atoms/conversion";
import { masterStateAtom } from "@atoms/openpos";
import { customerAtom } from "@atoms/customer";
import { getDate } from "../utils/utils";
import { inspectingProductAtom } from "./product";
import { fromDbDiscount } from "../utils/discountHelpers";

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
        // Clear all payment intents (no spillover)
        set(paymentIntentsAtom, [])

        // Unset the active (selected) customer
        set(customerAtom, null)

        // Clear all orders, new kiosk session
        set(ordersAtom, [])

        // Set back to the primary panel
        set(kioskPanelLogAtom, "cart")

        // Reset transaction type to default.
        set(transactionTypeAtom, "Out")
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
        order_total: get(priceAtom).total
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

const addToCartAtom = atom(undefined, (get, set, orderProducts: ProductPurchase[]) => {
    const { activeProduct: product, activeProductPromotions: promotions, activeProductVariant: variant } = get(inspectingProductAtom)

    const existing_product = orderProducts.find(k => k.product_code == variant?.barcode ); // && isEqual(k.variant, variant?.variant_code)
    let new_order_products_state: ProductPurchase[] = [];

    if(existing_product && variant && product) {
        const matching_product = orderProducts.find(e => e.product_code == variant?.barcode); // && (applyDiscount(1, findMaxDiscount(e.discount, e.variant_information.retail_price, false).value) == 1)
        
        if(matching_product) {
            const total_stock = matching_product.variant_information.stock.reduce((p, c) => p += (c.quantity.quantity_sellable), 0);
            // If a matching product exists; apply emendation
            new_order_products_state = orderProducts.map(e => {
                if(total_stock <= e.quantity) return e;

                return e.product_code == variant.barcode ? { ...e, quantity: e.quantity+1 } : e  //  && (applyDiscount(1, findMaxDiscount(e.discount, e.variant_information.retail_price, false).value) == 1)
            });
        }else {
            const po: ProductPurchase = {
                id: v4(),
                product_code: variant.barcode ?? product.sku ?? "",
                discount: [{
                    source: "loyalty",
                    value: fromDbDiscount(variant.loyalty_discount),
                    applicable_quantity: -1
                }],
                product_cost: variant?.retail_price ?? 0,
                product_name: product.company + " " + product.name,
                product_variant_name: variant.name,
                product_sku: product.sku,
                quantity: 1,
                transaction_type: "Out",

                product: product,
                variant_information: variant ?? product.variants[0],
                active_promotions: promotions,

                tags: product.tags 
            };

            new_order_products_state = [ ...orderProducts, po ]
        }
    }else if(product && variant){
        // Creating a new product in the order.
        const po: ProductPurchase = {
            id: v4(),
            product_code: variant.barcode ?? product.sku ?? "",
            discount: [{
                source: "loyalty",
                value: fromDbDiscount(variant.loyalty_discount),
                applicable_quantity: -1
            }],
            product_cost: variant?.retail_price ?? 0,
            product_name: product.company + " " + product.name,
            product_variant_name: variant.name,
            product_sku: product.sku,
            quantity: 1,
            transaction_type: "Out",

            product: product,
            variant_information: variant ?? product.variants[0],
            active_promotions: promotions,

            tags: product.tags
        };

        new_order_products_state = [ ...orderProducts, po ]
    }

    return new_order_products_state
})

export { 
    currentOrderAtom,
    addToCartAtom,
    parkSaleAtom, 
    generateTransactionAtom, 
    transactionTypeAtom, 
    defaultKioskAtom, 
    kioskPanelLogAtom, 
    kioskPanelAtom, 
    kioskPanelHistory, 
    selectionAtom, 
    activeDiscountAtom 
}