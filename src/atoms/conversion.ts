import { atom } from "jotai";

import { DbOrder, DbProductPurchase, StatusHistory } from "@utils/stockTypes";
import { findMaxDiscount, toDbDiscount } from "@utils/discountHelpers";
import { getDate } from "@utils/utils";

import { transactionTypeAtom } from "@atoms/kiosk";
import { masterStateAtom } from "@atoms/openpos";
import { customerAtom } from "@atoms/customer";
import { ordersAtom } from "@atoms/transaction";

const computeDatabaseOrderFormat = atom((get) => {
    const date = getDate()
    const orderState = get(ordersAtom)
    const masterState = get(masterStateAtom)
    const customerState = get(customerAtom)
    const transactionType = get(transactionTypeAtom)

    const new_state: DbOrder[] = orderState.map(e => {
        if(e.order_type == "direct") {
            return {
                ...e,
                discount: toDbDiscount(e.discount),
                origin: {
                    store_code: masterState.store_code,
                    store_id: masterState.store_id ?? "",
                    contact: masterState.store_contact
                },
                destination: {
                    store_code: "000",
                    store_id: customerState?.id ?? "",
                    contact: customerState?.contact ?? masterState.store_contact
                },
                products: e.products.map(k => { 
                    return { 
                        discount: toDbDiscount(findMaxDiscount(k.discount, k.variant_information.retail_price * 1.15, !(!customerState))[0].value), 
                        product_cost: k.variant_information.retail_price * 1.15, 
                        product_code: k.product_code, 
                        product_name: k.product.company + " " + k.product.name, 
                        product_variant_name: k.variant_information.name, 
                        product_sku: k.product_sku,
                        quantity: k.quantity, 
                        id: k.id,
                        transaction_type: k.transaction_type,
                        tags: k.tags
                    } as DbProductPurchase
                }) as DbProductPurchase[],
                status: (transactionType == "Saved" || transactionType == "Quote" ? {   
                    status: {
                        type: "fulfilled",
                        value: date
                    },
                    assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                    timestamp: date
                }  : {   
                    status: {
                        type: "queued",
                        value: date
                    },
                    assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                    timestamp: date
                }),
                status_history: 
                !(transactionType == "Saved" || transactionType == "Quote") ? 

                [
                    ...e.status_history as StatusHistory[],
                    {
                        item: {   
                            status: {
                                type: "queued",
                                value: date
                            },
                            assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                            timestamp: date
                        },
                        reason: "Payment Intent Created",
                        timestamp: date
                    } as StatusHistory,
                    {
                        item: {   
                            status: {
                                type: "fulfilled",
                                value: date
                            },
                            assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                            timestamp: date
                        },
                        reason: "Instore Purchase",
                        timestamp: date
                    } as StatusHistory
                ]

                    :

                [
                    ...e.status_history as StatusHistory[],
                    {
                        item: {   
                            status: {
                                type: "queued",
                                value: date
                            },
                            assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                            timestamp: date
                        },
                        reason: "Queued Purchase",
                        timestamp: date
                    }
                ]
            } as DbOrder
        }else {
            return {
                ...e,
                discount: toDbDiscount(e.discount),
                status: {   
                    status: {
                        type: "queued",
                        value: date
                    },
                    assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                    timestamp: date
                },
                products: e.products.map(k => { 
                    return { 
                        discount: toDbDiscount(findMaxDiscount(k.discount, k.variant_information.retail_price * 1.15, !(!customerState))[0].value), 
                        product_cost: k.variant_information.retail_price * 1.15, 
                        product_code: k.product_code, 
                        product_name: k.product.company + " " + k.product.name, 
                        product_variant_name: k.variant_information.name, 
                        quantity: k.quantity, 
                        product_sku: k.product_sku,
                        id: k.id,
                        tags: k.tags,
                        transaction_type: k.transaction_type,
                    }
                }) as DbProductPurchase[],
                status_history: [
                    {
                        item: {   
                            status: {
                                type: "queued",
                                value: date
                            },
                            assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                            timestamp: date
                        },
                        reason: "Queued indirect purchase",
                        timestamp: date
                    }
                ]
            } as DbOrder
        }
    });

    return new_state;
})

export { computeDatabaseOrderFormat }