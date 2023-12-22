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
    Location, Product,
} from "@/generated/stock/Api";

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

export type TransactionType = "In" | "Out" | "PendingIn" | "PendingOut" | "Saved" | "Quote"

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

export type PaymentIntent = {
    amount: Price
    delay_action: "Cancel" | "Complete" | "RequireFurtherAction"
    /// defaults to PT12H
    delay_duration: string 
    fulfillment_date: string
    id: string
    order_ids: string[]
    payment_method: "Card" | "Cash" | "Transfer" | { "Other" : string }
    processing_fee: Price
    processor: {
        /// Store Code
        location: string,
        /// Employee ID 
        employee: string,
        /// k: kiosk
        /// w: web
        /// c: direct entry 
        software_version: 'k0.5.2', 
        token: string
    }
    status: { Unfulfilled: string } | { Pending: string } | { Processing: string } | { Failed: Processable } | { Complete: Processable } 
}

export type Processable = { CardDetails: CardDetails } | { Anonymous: String }

export type CardDetails = {
    card_brand: string,
    last_4: string,
    exp_month: string,
    exp_year: string,
    fingerprint: string,
    card_type: string,
    prepaid_type: string,
    bin: string,

    entry_method: string,
    cvv_accepted: string,
    avs_accepted: string,
    auth_result_code: string,
    statement_description: string,
    card_payment_timeline: PaymentTimeline
}

export type PaymentTimeline = {
    authorized_at: string,
    captured_at: string
}

export type Price = {
    quantity: number,
    currency: string
}


export interface ContextualOrder extends Order {
    destination: Location | null,
    origin: Location | null,

    products: ContextualProductPurchase[],
    discount: string,
}

export type StatusHistory = {
    item: OrderStatus,
    reason: string,
    timestamp: string
}

/// Extra information for internal referencing (caching) that should be removed before sending to server
export interface ContextualProductPurchase extends ProductPurchase {
    product: Product,
    variant_information: VariantInformation,
    active_promotions: Promotion[],
    discount: ContextualDiscountValue[],
}

export type DiscountSource = "user" | "promotion" | "loyalty"

export interface ContextualDiscountValue {
    source: DiscountSource,
    /** @format % or || **/
    value: string,
    // Quantity discount is applicable for, if -1, can apply for any quantity.
    applicable_quantity: number,
    promotion?: Promotion
}

export type OrderStatusStatus = {
    type: "queued",
    value: string
} | { 
    type: "transit",
    value: TransitInformation 
} | { 
    type: "processing",
    value: string 
} | { 
    type: "instore",
    value: string 
} | { 
    type: "fulfilled",
    value: string 
} | { 
    type: "failed",
    value: string 
}

export type OrderStatus = {
    status: OrderStatusStatus,
    assigned_products: string[],
    timestamp: string
}

export type TransitInformation = {
    shipping_company: ContactInformation,
    query_url: string,
    tracking_code: string,
    assigned_products: string[]
}

export type StrictVariantCategory = {
    category: string,
    variant: Variant
}

export type StockInfo = {
    store: Store,
    quantity: Quantity
}

export type Quantity = {
    quantity_sellable: number,
    quantity_on_order: number,
    quantity_unsellable: number
}

export type Store = {
    store_code: string,
    store_id: string,
    contact: ContactInformation,
    id: string,
    code: string,
    name: string
}

export type Employee = {
    id: string,
    name: {
        first: string,
        last: string
    },
    auth: {
        hash: string
    },
    contact: ContactInformation,
    clock_history: Attendance[],
    level: number
}

export type Attendance = {
    item: Attendant,
    reason: string,
    timestamp: string
}

export type Attendant = {
    track_type: "in" | "out",
    kiosk: string
}

export type ContactInformation = {
    name: string,
    mobile: Mobile,
    email: Email,
    landline: string,
    address: Address
}

export type Address = {
    street: string,
    street2: string,
    city: string,
    country: string,
    po_code: string
    lat: number,
    lon: number
}

export type Email = {
    root: string,
    domain: string,
    full: string
}

export type Mobile = {
    valid: boolean,
    number: string
}

export type Note = {
    message: string,
    timestamp: string,
    author: string
}

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