import { customAlphabet } from "nanoid";
import { v4 } from "uuid";
import { applyPromotion, discountFromPromotion, findMaxDiscount, toDbDiscount } from "./discount_helpers";
import { getDate, sortDbOrders } from "./kiosk";
import { Customer, DbOrder, DbProductPurchase, KioskState, MasterState, Order, OrderStatus, PaymentIntent, ProductPurchase, Promotion, StatusHistory, TransactionInput, TransactionType } from "./stock-types";
import {useEffect, useState} from "react";

// Change to ENV
export const OPEN_STOCK_URL = process.env.NEXT_PUBLIC_API_URL;

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
                    store_code: master_state.store_code,
                    store_id: master_state.store_id,
                    contact: master_state.store_contact
                },
                destination: {
                    store_code: "000",
                    store_id: customerState?.id ?? "",
                    contact: customerState?.contact ?? master_state.store_contact
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

        fetch(`${OPEN_STOCK_URL}/transaction`, {
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

type ProductAnalysis = {
    id: string,
    reference_field: {
        barcode: string
    },
    chosen_promotion: {
        external: boolean, // Is the promotion from an external source
        promotion: Promotion | null,
        saving: number
    } | null,
    promotion_list: Promotion[],
    promotion_sim: [Promotion, number][],
    tags: string[],
    utilized: { // Is this product being used as a part of an external products promotion requirements?
        utilizer: string,
        saving: number,
        promotion: Promotion
    } | null,
    is_joined: boolean,
    // external_carrier: { // What is the external source, if any
    //     origin: string, // ID of external source
    //     saving: number,
    //     promotion: Promotion
    // } | null
}

export const determineOptimalPromotionPathway = (products: ProductPurchase[]) => {
    // products[0].discount.push(...)
    const analysis_list: ProductAnalysis[] = [];
    const product_map = new Map<string, ProductPurchase>();

    products.map(k => {
        const pdt = product_map.get(k.product.sku);

        if(pdt) {
            product_map.set(k.product.sku, {
                ...k,
                quantity: pdt.quantity+k.quantity
            })
        }else {
            product_map.set(k.product.sku, k)
        }
    })

    products.map(b => {
        // Run promotion simulation
        const mapped: [Promotion, number][] = b.active_promotions.map(d => {
            return [d, applyPromotion(d, b, product_map)] as [Promotion, number]
        }).sort((a: [Promotion, number], b: [Promotion, number]) =>  b[1] - a[1])

        // Put all (for quantity) in list to analyze.
        for(let i = 0; i < b.quantity; i++){
            analysis_list.push({
                id: customAlphabet(`1234567890abcdef`, 10)(35),
                reference_field: {
                    barcode: b.variant_information.barcode
                },
                tags: b.product.tags,
                chosen_promotion: null,
                promotion_list: b.active_promotions,
                promotion_sim: mapped,
                utilized: null,
                is_joined: false
                // external_carrier: null
            })
        }
    });

    const product_queue = [...analysis_list.map(b => b.id)];

    //console.log("---")
    //console.log(product_queue, analysis_list);

    while(product_queue.length > 0) {
        const elem = product_queue.pop();
        const indx_of = analysis_list.findIndex(k => k.id == elem);

        //console.log(product_queue, elem, indx_of);

        let point = analysis_list[indx_of];

        //console.log("Investigating: ", { ...point });

        if(!point) continue;

        let promotional_index = 0;
        let optimal_promotion: [Promotion, number] | null = point.promotion_sim[0];
        let external_source_id: string | null = null;

        //console.log("--- WITH: ", products.find(b =>
            // b.variant_information.barcode == point.reference_field.barcode
        // ), point)

        while(true) {
            if(optimal_promotion == null) break;
            if(optimal_promotion[0].get.Category || optimal_promotion[0].get.Any || optimal_promotion[0].get.Specific) {
                // Is impacting an external source...
    
                // Find an appropriate external source by checking those remaining in the queue
                product_queue.map(ref => {
                    const indx_of_other = analysis_list.findIndex(k => 
                        k.id !== point.id   && 
                        k.id == ref         &&
                        k.utilized == null  && 
                        !k.is_joined        
                    );

                    if(indx_of_other == -1) return;

                    const val = analysis_list[indx_of_other];
    
                    if(val) {
                        // If function exists and meets criterion:

                        // If is the product bought
                        if(
                            optimal_promotion 
                            && 
                            (
                                optimal_promotion[0].buy.Any 
                                || 
                                (
                                    optimal_promotion[0].buy.Category 
                                    && 
                                    point.tags.includes(optimal_promotion[0].buy.Category?.[0])
                                )
                                || 
                                (
                                    optimal_promotion[0].buy.Specific 
                                    && 
                                    products.find(b =>
                                        b.variant_information.barcode == point.reference_field.barcode
                                    )?.product_sku 
                                    == 
                                    optimal_promotion[0].buy.Specific[0]
                                )
                            )
                        )
                            if(optimal_promotion && optimal_promotion[0].get.Category) {
                                //console.log("Matching Category?", optimal_promotion[0].get);

                                if(val.tags.includes(optimal_promotion[0].get.Category?.[0] ?? "")) {
                                    external_source_id = val.id;
                                }
                            }else if(optimal_promotion && optimal_promotion[0].get.Any) {
                                //console.log("Matching Any?", products.find(b => b.variant_information.barcode == val.reference_field.barcode)?.product.name, optimal_promotion[0].get);

                                external_source_id = val.id;
                            }else if(optimal_promotion && optimal_promotion[0].get.Specific ) {
                                const product_ref = products.findIndex(b => b.variant_information.barcode == val.reference_field.barcode);
        
                                if(product_ref !== -1) {
                                    //console.log("Matching Specific?", products[product_ref], optimal_promotion[0].get);

                                    if(products[product_ref].product_sku == optimal_promotion[0].get.Specific[0]) {
                                        // Has the *specific* product in cart
                                        external_source_id = val.id;
                                    }
                                }
                            }   
                    }
                })
    
                if(external_source_id == null) {
                    // No suitable product could be determined. Promotion will not be applied, skipping to next best.
                    promotional_index += 1;
                    if(promotional_index >= point.promotion_sim.length-1) optimal_promotion = null;
                    else optimal_promotion = point.promotion_sim[promotional_index];
                }else {
                    break;
                }
            }else {
                break;
            }
        }
        
        let should_apply = true;

        if(optimal_promotion != null && (point.utilized != null || point.is_joined)) { // && !point.is_joined
            const external_indx = analysis_list.findIndex(k => k.id == point.utilized?.utilizer);
            if(external_indx == -1) break;

            const external_ref = analysis_list[external_indx];
            
            // If the current promotion provides a greater saving than the external, replace.
            if(optimal_promotion[1] > (external_ref.chosen_promotion?.saving ?? 0)) {
                should_apply = true;

                // Recursively delete and push
                const delete_and_push = (id: string) => {
                    //console.log("DELETE EXTERN: ", id);
                    const ext = analysis_list.findIndex(k => k.id == id);
                    if(ext == -1) return;

                    // Delete Fields...
                    analysis_list[ext].utilized = null;
                    analysis_list[ext].chosen_promotion = null;

                    // Push into queue
                    product_queue.push(id);
                    
                    if(analysis_list[ext].utilized != null && analysis_list[ext]!.utilized!.utilizer !== null) 
                        delete_and_push(analysis_list[ext]!.utilized!.utilizer)
                }

                delete_and_push(external_ref.id);
            }else should_apply = false;
        }

        if(optimal_promotion && should_apply) {
            if(external_source_id != null) {
                const external_indx = analysis_list.findIndex(k => k.id == external_source_id);
                analysis_list[indx_of].is_joined = true;
                
                analysis_list[external_indx].utilized = {
                    utilizer: point.id,
                    saving: optimal_promotion[1],
                    promotion: optimal_promotion[0]
                };

                analysis_list[external_indx].chosen_promotion = {
                    external: true,
                    promotion: null,
                    saving: optimal_promotion[1]
                };

                analysis_list[external_indx].is_joined = false;
            }else point.is_joined = false;

            // --- Correctly Apply New Promotion --- // 
            point.chosen_promotion = {
                promotion: optimal_promotion[0],
                saving: optimal_promotion[1],
                external: false // Is the external unit.
            };
            point.utilized = null;

            //console.log("optimal: ", point);
        }else {
            //console.log("no optimal promotion?")
        }
        
        analysis_list[indx_of] = point;
        //console.log("EOL:", JSON.parse(JSON.stringify( analysis_list )));
    }

    //console.log("Analysis", [...analysis_list.map(k => k.chosen_promotion)]);
    return analysis_list;
}