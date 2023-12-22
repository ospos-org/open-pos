import Stripe from "stripe";
import { KioskAction } from "@atoms/kiosk";
import {
    Customer,
    ProductInstance,
    ProductPurchase,
    Promotion,
    Payment,
    Variant,
    VariantInformation,
    Order,
    Location, Product, ContactInformation, Employee, Store, Note, TransactionType,
} from "@/generated/stock/Api";

/*
*   This is a collection of types, specific to the state of the kiosk.
*
*   Types should be derived from the generated types (Api.ts) in order to retain
*   consistency, such that in the event of generated changes, there are no blindly
*   induced type errors
*/

export type DiscountSource = "user" | "promotion" | "loyalty"

export type KioskState = {
    customer: Customer | null,
    transaction_type: TransactionType | null,
    products: ContextualOrder[] | null,
    order_total: number | null,
    payment: Payment[],
    order_date: string | null,
    order_notes: Note[] | null,
    salesperson: string | null,
    kiosk: string | null,
    perf: KioskAction
};

export type MasterState = {
    store_id: string | null,
    store_code: string,
    store_contact: ContactInformation,
    store_lut: Store[],

    employee: Employee | null | undefined,

    kiosk: string,
    kiosk_id: string | null,

    activeTerminal: Stripe.Terminal.Reader | null,
    availableTerminals: Stripe.Terminal.Reader[]
}

export type ProductCategory = {
    name: string,
    // Length of instances is quantity.
    items: ProductCategoryItem[]
}

export type ProductCategoryItem = {
    name: string,
    variant: string,
    order_reference: string,
    sku: string,
    barcode: string,
    // Length of instances is quantity.
    instances: {
        product_purchase_id: string,
        transaction_id: string,
        state: ProductInstance
    }[],
}

export interface ContextualOrder extends Order {
    destination: Location | null,
    origin: Location | null,

    products: ContextualProductPurchase[],
    discount: string,
}

/// Extra information for internal referencing (caching) that should be removed before sending to server
export interface ContextualProductPurchase extends ProductPurchase {
    product: Product,
    variant_information: VariantInformation,
    active_promotions: Promotion[],
    discount: ContextualDiscountValue[],
}


export interface ContextualDiscountValue {
    source: DiscountSource,
    /** @format % or || **/
    value: string,
    // Quantity discount is applicable for, if -1, can apply for any quantity.
    applicable_quantity: number,
    promotion?: Promotion
}

export type StrictVariantCategory = {
    category: string,
    variant: Variant
}

