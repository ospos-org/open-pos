import {ContextualProductPurchase} from "@utils/stockTypes";
import {Stock} from "@/generated/stock/Api";

interface GeneratedOrder {
    item: ContextualProductPurchase | undefined,
    store: string,
    alt_stores: Stock[],
    ship: boolean,
    quantity: number
}

export type {
    GeneratedOrder
}