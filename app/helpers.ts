import { customAlphabet } from "nanoid";
import { v4 } from "uuid";
import { findMaxDiscount, toDbDiscount } from "./discount_helpers";
import { getDate, sortDbOrders } from "./kiosk";
import { Customer, DbOrder, DbProductPurchase, KioskState, MasterState, Order, OrderStatus, PaymentIntent, StatusHistory, TransactionInput, TransactionType } from "./stock-types";
import {useEffect, useState} from "react";

export const OPEN_STOCK_URL = "178.128.97.146:8000";

export const fileTransaction = (
    payment_intents: PaymentIntent[], 
    setKioskState: Function, kioskState: KioskState,
    setCurrentTransactionPrice: Function,
    setPadState: Function,
    orderState: Order[],
    master_state: MasterState,
    customerState: Customer | null
): TransactionInput | null => {
    setKioskState({
        ...kioskState,
        payment: payment_intents
    });

    const qua = payment_intents.reduce(function (prev, curr) {
        return prev + (curr.amount.quantity ?? 0)
    }, 0);

    if(qua < (kioskState.order_total ?? 0) && kioskState.transaction_type != "Quote") {
        setCurrentTransactionPrice((kioskState.order_total ?? 0) - qua)
        setPadState("select-payment-method")

        return null;
    }else {
        const date = getDate();

        // Following state change is for an in-store purchase, modifications to status and destination are required for shipments
        // Fulfil the orders taken in-store and leave the others as open.
        const new_state = computeOrder(kioskState.transaction_type ?? "Out", orderState, master_state, customerState);
        // setOrderState(sortDbOrders(new_state));

        const transaction = {
            ...kioskState,
            customer: customerState ? {
                customer_id: customerState?.id,
                customer_type: "Individual"
            } : {
                customer_id: master_state.store_id,
                customer_type: "Store"
            },
            payment: payment_intents,
            products: sortDbOrders(new_state),
            order_date: date,
            salesperson: master_state.employee?.id ?? "",
            till: master_state.kiosk
        } as TransactionInput;

        return transaction;
    }
}

export const computeOrder = (transaction_type: TransactionType, orderState: Order[], master_state: MasterState, customerState: Customer | null): DbOrder[] => {
    const date = getDate();

    const new_state: DbOrder[] = orderState.map(e => {
        if(e.order_type == "Direct") {
            return {
                ...e,
                discount: toDbDiscount(e.discount),
                origin: {
                    code: master_state.store_id,
                    contact: master_state.store_contact
                },
                destination: {
                    code: "000",
                    contact: customerState?.contact ?? master_state.store_contact
                },
                products: e.products.map(k => { 
                    return { 
                        discount: toDbDiscount(findMaxDiscount(k.discount, k.variant_information.retail_price * 1.15, !(!customerState)).value), 
                        product_cost: k.variant_information.retail_price * 1.15, 
                        product_code: k.product_code, 
                        product_name: k.product.company + " " + k.product.name, 
                        product_variant_name: k.variant_information.name, 
                        product_sku: k.product_sku,
                        quantity: k.quantity, 
                        id: k.id,
                        transaction_type: k.transaction_type,
                    }
                }) as DbProductPurchase[],
                status: (transaction_type == "Saved" || transaction_type == "Quote" ? {   
                    status: {
                        Fulfilled: date
                    },
                    assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                    timestamp: date
                }  : {   
                    status: {
                        Queued: date
                    },
                    assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                    timestamp: date
                }) as OrderStatus,
                status_history: 
                !(transaction_type == "Saved" || transaction_type == "Quote") ? 

                [
                    ...e.status_history as StatusHistory[],
                    {
                        item: {   
                            status: {
                                Queued: date
                            },
                            assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                            timestamp: date
                        } as OrderStatus,
                        reason: "Payment Intent Created",
                        timestamp: date
                    } as StatusHistory,
                    {
                        item: {   
                            status: {
                                Fulfilled: date
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
                                Queued: date
                            },
                            assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                            timestamp: date
                        },
                        reason: "Queued Purchase",
                        timestamp: date
                    } as StatusHistory
                ]
            }
        }else {
            return {
                ...e,
                discount: toDbDiscount(e.discount),
                status: {   
                    status: {
                        Queued: date
                    },
                    assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                    timestamp: date
                } as OrderStatus,
                products: e.products.map(k => { 
                    return { 
                        discount: toDbDiscount(findMaxDiscount(k.discount, k.variant_information.retail_price * 1.15, !(!customerState)).value), 
                        product_cost: k.variant_information.retail_price * 1.15, 
                        product_code: k.product_code, 
                        product_name: k.product.company + " " + k.product.name, 
                        product_variant_name: k.variant_information.name, 
                        quantity: k.quantity, 
                        product_sku: k.product_sku,
                        id: k.id,
                        transaction_type: k.transaction_type,
                    }
                }) as DbProductPurchase[],
                status_history: [
                    ...e.status_history as StatusHistory[],
                    {
                        item: {   
                            status: {
                                Queued: date
                            },
                            assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                            timestamp: date
                        } as OrderStatus,
                        reason: "Queued indirect purchase",
                        timestamp: date
                    } as StatusHistory
                ]
            }
        }
    });

    return new_state;
}

export const resetOrder = (setKioskState: Function, setOrderState: Function, setCustomerState: Function, setPadState: Function, master_state: MasterState) => {
    setKioskState({
        customer: null,
        transaction_type: "Out",
        products: [],
        order_total: null,
        payment: [],
        order_date: null,
        order_notes: [],
        salesperson: null,
        till: null
    })
    
    setOrderState([{
        id: v4(),
        destination: null,
        origin: {
            contact: master_state.store_contact,
            code: master_state.store_id
        },
        products: [],
        status: {
            status: {
                Queued: getDate()
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
        order_type: "Direct",
        previous_failed_fulfillment_attempts: []
    }])
    
    setCustomerState(null)

    setPadState("cart")
}

export const parkSale = (orderState: Order[], setTriggerRefresh: Function, triggerRefresh: string[], master_state: MasterState, customerState: Customer | null, setKioskState: Function, setOrderState: Function, setCustomerState: Function, setPadState: Function, kioskState: KioskState) => {
    if((orderState?.reduce((p, c) => p + c.products.length, 0) ?? 0) >= 1) {
        const new_state = computeOrder("Saved", orderState, master_state, customerState);

        const transaction = {
            ...kioskState,
            products: new_state,
            customer: customerState ? {
                customer_id: customerState?.id,
                customer_type: "Individual"
            } : {
                customer_id: master_state.store_id,
                customer_type: "Store"
            },
            order_total: 0.00,
            transaction_type: "Saved",
            payment: [],
            order_date: getDate(),
            salesperson: master_state.employee?.id ?? "",
            till: master_state.kiosk
        } as TransactionInput;

        fetch('${OPEN_STOCK_URL}/transaction', {
            method: "POST",
            body: JSON.stringify(transaction),
            credentials: "include",
            redirect: "follow"
        }).then(async k => {
            if(k.ok) {
                setTriggerRefresh([...triggerRefresh]);
                resetOrder(setKioskState, setOrderState, setCustomerState, setPadState, master_state);
            }else {
                alert("Something went horribly wrong")
            }
        })
    }
}

export function useWindowSize() {
    // Initialize state with undefined width/height so server and client renders match
    // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
    const [windowSize, setWindowSize] = useState<{
        width: number | undefined,
        height: number | undefined
    }>({
        width: undefined,
        height: undefined,
    });

    useEffect(() => {
        // Handler to call on window resize
        function handleResize() {
            // Set window width/height to state
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }
        // Add event listener
        window.addEventListener("resize", handleResize);
        // Call handler right away so state gets updated with initial window size
        handleResize();
        // Remove event listener on cleanup
        return () => window.removeEventListener("resize", handleResize);
        }, []); // Empty array ensures that effect is only run on mount
    return windowSize;
}