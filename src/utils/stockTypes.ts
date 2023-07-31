export type KioskState = {
    customer: Customer | null,
    transaction_type: TransactionType | null,
    products: DbOrder[] | null,
    order_total: number | null,
    payment: PaymentIntent[],
    order_date: string | null,
    order_notes: Note[] | null,
    salesperson: string | null,
    kiosk: string | null
};

export type TransactionType = "In" | "Out" | "PendingIn" | "PendingOut" | "Saved" | "Quote"

export type Transaction = {
    id: string,

    customer: TransactionCustomer,
    transaction_type: TransactionType,
    products: DbOrder[],
    order_total: number,
    payment: PaymentIntent[],

    order_date: string,
    order_notes: Note[],

    salesperson: string,
    kiosk: string
}

export type TransactionInput = {
    customer: TransactionCustomer,
    transaction_type: TransactionType,
    products: DbOrder[],
    order_total: number,
    payment: PaymentIntent[],

    order_date: string,
    order_notes: Note[],

    salesperson: string,
    kiosk: string
}

export type TransactionCustomer = {
    customer_type: CustomerType,
    customer_id: string
}

export type CustomerType = "Store" | "Individual" | "Commercial"

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

type StoreStatus = {
    item: Store;
    assigned_products: string[];
    timestamp: string;
}

export interface Discount { 
    Absolute?: number, 
    Percentage?: number 
}

export type DbOrder = {
    id: string,
    destination: Move | null,
    origin: Move,
    products: DbProductPurchase[],
    status: OrderStatus,
    previous_failed_fulfillment_attempts: (StoreStatus[])[],
    status_history: StatusHistory[],
    order_history: string[],
    order_notes: Note[],
    reference: string,
    creation_date: string,
    discount: Discount,
    order_type: "shipment" | "pickup" | "direct" | "quote"
}

export type Order = {
    id: string,
    destination: Move | null,
    origin: Move | null,
    products: ProductPurchase[],
    status: OrderStatus,
    previous_failed_fulfillment_attempts: (StoreStatus[])[],
    status_history: StatusHistory[],
    order_history: string[],
    order_notes: Note[],
    reference: string,
    creation_date: string,
    discount: string,
    order_type: "shipment" | "pickup" | "direct" | "quote"
}

export type StatusHistory = {
    item: OrderStatus,
    reason: string,
    timestamp: string
}

export type Move = {
    store_code: string,
    store_id: string,
    contact: ContactInformation
}

export type FulfillmentStatus = {
    pick_status: PickStatus,
    pick_history: History<PickStatus>[],
    last_updated: string,
    notes: Note[]
}

export type History<T> = {
    item: T,
    reason: string,
    timestamp: string
}

export type PickStatus = "pending" | "picked" | "failed" | "uncertain" | "processing" | "other"

export type ProductPurchase = {
    id: string,

    discount: DiscountValue[],

    product_code: string,
    product_sku: string,

    product_cost: number,
    product_name: string,
    product_variant_name: string,

    quantity: number,
    transaction_type: TransactionType,

    tags: string[],
    instances?: ProductInstance[],

    /// Extra information for internal referencing (caching) that should be removed before sending to server
    product: Product,
    variant_information: VariantInformation,
    active_promotions: Promotion[]
}

export type ProductInstance = {
    id: string,
    fulfillment_status: FulfillmentStatus
}

export type DbProductPurchase = {
    discount: Discount,

    product_cost: number,
    product_code: string,
    product_sku: string,

    product_name: string,
    product_variant_name: string,
    
    quantity: number,
    id: string,

    tags: string[],

    transaction_type: TransactionType,
    instances: ProductInstance[],
}

export type DiscountValue = {
    source: "user" | "promotion" | "loyalty",
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

export type Product = {
    name: string,
    company: string,
    variant_groups: VariantCategory[],
    variants: VariantInformation[],
    sku: string,
    images: string[],
    tags: string[],
    description: string,
    specifications: (string[])[]
}

export type Promotion = {
    id: string,
    name: string,
    buy: PromotionBuy,
    get: PromotionGet,
    valid_till: string,
    timestamp: string
}

export type Allocation = {
    swap_for_any: boolean,
    promotion: Promotion,
}

export type PromotionBuy = {
    Specific?: [string, number],
    Any?: number,
    Category?: [string, number]
}

export type PromotionGet = {
    SoloThis?: Discount,
    This?: [number, Discount]
    Specific?: [string, [number, Discount]],
    Any?: [number, Discount],
    Category?: [string, [number, Discount]],
}

export type VariantInformation = {
    name: string,
    stock: StockInfo[],
    images: string[],
    retail_price: number,
    marginal_price: number,
    /// The group codes for all sub-variants; i.e. is White, Short Sleeve and Small.
    variant_code: string[],
    order_history: string[],
    /// impl! Implement this type!
    stock_information: StockInformation,
    barcode: string,
    loyalty_discount: {
        Absolute?: number,
        Percentage?: number
    },
    id: string
}

export type VariantCategory = {
    category: string,
    variants: Variant[]
}

export type StrictVariantCategory = {
    category: string,
    variant: Variant
}

export type Variant = {
    name: string,
    stock: StockInfo[],
    images: string[],
    marginal_price: number,
    retail_price: number,
    variant_code: string,
    order_history: string[],
    // impl! Flesh this type out correctly.
    stock_information: StockInformation
}

export type StockInformation = {
    stock_group: string,
    sales_group: string,
    value_stream: string,
    brand: string,
    unit: string,
    tax_code: string,
    weight: string,
    volume: string,
    max_volume: string,
    back_order: boolean,
    discontinued: boolean,
    non_diminishing: boolean,
    shippable: boolean,
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

export type Customer = {
    id: string,
    name: string,
    contact: ContactInformation,
    transactions: string,
    order_history: Order[],
    customer_notes: Note[],
    special_pricing: string,
    accepts_marketing: boolean,
    balance: number,
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
    employee: Employee | null | undefined,
    store_contact: ContactInformation,
    store_lut: Store[],
    kiosk: string,
    kiosk_id: string | null
}