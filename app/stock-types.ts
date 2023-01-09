export type KioskState = {
    customer: string | null,
    transaction_type: string | null,
    products: Order[] | null,
    order_total: number | null,
    payment: {
        payment_method: "cash" | "card" | string | null,
        fulfillment_date: string | null,
        amount: number | null
    }[],
    order_date: string | null,
    order_notes: string[] | null,
    order_history: string[] | null,
    salesperson: string | null,
    till: string | null
};

type StoreStatus = {
    item: Store;
    assigned_products: string[];
    timestamp: string;
}

export type Order = {
    id: string,
    destination: Move | null,
    origin: Move,
    products: ProductPurchase[],
    status: OrderStatus[],
    previous_failed_fulfillment_attempts: (StoreStatus[])[],
    status_history: (OrderStatus[])[],
    order_history: string[],
    order_notes: Note[],
    reference: string,
    creation_date: string,
    discount: string,
    order_type: "shipment" | "collection" | "direct"
}

export type Move = {
    code: string,
    contact: ContactInformation
}

export type ProductPurchase = {
    id: string,

    product_code: string,
    variant: string[],
    discount: DiscountValue[],

    product_cost: number,
    quantity: number,

    /// Extra information that should be removed before sending to server
    product: Product,
    variant_information: VariantInformation
}

export type DiscountValue = {
    source: "user" | "promotion" | "loyalty",
    value: string
}

export type OrderStatus = {
    status: "queued" | "transit" | "processing" | "in-store" | "fulfilled" | "failed" | string,
    assigned_products: string[],
    timestamp: string
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
        Absolute?: string,
        Percentage?: string
    },
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
    non_diminishing: boolean
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
    order_history: Order[],
    customer_notes: Note[],
    balance: number,
}

export type Employee = {
    id: string,
    name: Name,
    auth: {
        hash: string
    },
    contact: ContactInformation,
    clock_history: Attendance[],
    level: number
}

export type Name = {
    first: string,
    middle: string,
    last: string
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
    author: Employee
}