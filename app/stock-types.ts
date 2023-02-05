export type KioskState = {
    customer: string | null,
    transaction_type: string | null,
    products: DbOrder[] | null,
    order_total: number | null,
    payment: PaymentIntent[],
    order_date: string | null,
    order_notes: Note[] | null,
    salesperson: string | null,
    till: string | null
};

export type Transaction = {
    id: string,

    customer: TransactionCustomer,
    transaction_type: "in" | "out",
    products: DbOrder[],
    order_total: number,
    payment: PaymentIntent[],

    order_date: string,
    order_notes: Note[],

    salesperson: string,
    till: string
}

export type TransactionInput = {
    customer: TransactionCustomer,
    transaction_type: "in" | "out",
    products: DbOrder[],
    order_total: number,
    payment: PaymentIntent[],

    order_date: string,
    order_notes: Note[],

    salesperson: string,
    till: string
}

export type TransactionCustomer = {
    customer_type: CustomerType,
    customer_id: string
}

export type CustomerType = "Store" | "Individual" | "Commercial"

export type PaymentIntent = {
    amount: Price
    delay_action: "Cancel" | "Complete" | "RequireFurtherAction"
    /// defaults to PT12H
    delay_duration: string 
    fulfillment_date: string
    id: string
    order_ids: string[]
    payment_method: "Card" | "Cash" | "Transfer"
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
    status: { Unfulfilled: string } | { Pending: string } | { Processing: string } | { Failed: CardDetails } | { Complete: CardDetails } 
}

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
    discount: { Absolute?: number, Percentage?: number },
    order_type: "Shipment" | "Pickup" | "Direct" | "Quote"
}

export type Order = {
    id: string,
    destination: Move | null,
    origin: Move,
    products: ProductPurchase[],
    status: OrderStatus,
    previous_failed_fulfillment_attempts: (StoreStatus[])[],
    status_history: StatusHistory[],
    order_history: string[],
    order_notes: Note[],
    reference: string,
    creation_date: string,
    discount: string,
    order_type: "Shipment" | "Pickup" | "Direct" | "Quote"
}

export type StatusHistory = {
    item: OrderStatus,
    reason: string,
    timestamp: string
}

export type Move = {
    code: string,
    contact: ContactInformation
}

export type ProductPurchase = {
    id: string,

    discount: DiscountValue[],

    product_code: string,
    product_cost: number,
    product_name: string,
    product_variant_name: string,

    quantity: number,

    /// Extra information for internal referencing (caching) that should be removed before sending to server
    product: Product,
    variant_information: VariantInformation,
    active_promotions: Promotion[]
}

export type DbProductPurchase = {
    discount: { Absolute?: number, Percentage?: number },

    product_cost: number,
    product_code: string,

    product_name: string,
    product_variant_name: string,
    
    quantity: number,
    id: string,
}

export type DiscountValue = {
    source: "user" | "promotion" | "loyalty",
    value: string
    promotion?: Promotion
}

export type OrderStatus = {
    status: { Queued: string } | { Transit: TransitInformation } | { Processing: string } | { InStore: string} | { Fulfilled: string} | { Failed: string },
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
    SoloThis?: { Absolute?: number, Percentage?: number },
    This?: [number, { Absolute?: number, Percentage?: number }]
    Specific?: [string, [number, { Absolute?: number, Percentage?: number }]],
    Any?: [number, { Absolute?: number, Percentage?: number }],
    Category?: [string, [number, { Absolute?: number, Percentage?: number }]],
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
    code: string,
    contact: ContactInformation,
    id: string,
    name: string
}

export type Customer = {
    id: string,
    name: string,
    contact: ContactInformation,
    transactions: string,
    order_history: Order[],
    customer_notes: Note[],
    balance: number,
}

export type Employee = {
    id: string,
    name: string,
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
    till: string
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
    region_code: string,
    root: string
}

export type Note = {
    message: string,
    timestamp: string,
    author: string
}