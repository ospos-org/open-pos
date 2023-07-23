import { Promotion } from "./stockTypes"

export type PAD_MODES = "cart" | "customer" | "related-orders" | "customer-create" | "inv-transaction" | "select-payment-method" | "await-debit" | "await-cash" | "completed" | "discount" | "note" | "ship-to-customer" | "pickup-from-store"

export type ProductAnalysis = {
    id: string,
    reference_field: {
        barcode: string
    },
    chosen_promotion: {
        // Is the promotion from an external source
        external: boolean, 
        promotion: Promotion | null,
        saving: number
    } | null,
    promotion_list: Promotion[],
    promotion_sim: [Promotion, number][],
    tags: string[],
    // Is this product being used as a part of an external products promotion requirements?
    utilized: { 
        utilizer: string,
        saving: number,
        promotion: Promotion
    } | null,
    is_joined: boolean,
}