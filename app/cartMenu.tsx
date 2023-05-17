import { isEqual } from "lodash";
import { customAlphabet } from "nanoid";
import Image from "next/image";
import { RefObject, useEffect, useState } from "react";
import { v4 } from "uuid";
import { applyDiscount, applyDiscountsConsiderateOfQuantity, applyPromotion, discountFromPromotion, findMaxDiscount, fromDbDiscount, isGreaterDiscount, parseDiscount, stringValueToObj } from "./discount_helpers";
import { determineOptimalPromotionPathway, parkSale } from "./helpers";
import { getDate, sortOrders } from "./kiosk";
import { Allocation, ContactInformation, Customer, DiscountValue, Employee, KioskState, MasterState, Order, ProductPurchase, Promotion } from "./stock-types";

export default function CartMenu({ 
    customerState, 
    setCustomerState, 
    orderState, 
    setOrderState, 
    setResult, 
    setSearchType, 
    master_state, 
    setActiveProduct, setActiveProductVariant,
    setActiveProductPromotions,
    setPadState,
    setTriggerRefresh, triggerRefresh,
    setDiscount,
    setKioskState,
    kioskState,
    setCurrentTransactionPrice,
    input_ref
}: { 
    customerState: Customer | null, 
    setCustomerState: Function, 
    setResult: Function, 
    setSearchType: Function, 
    setOrderState: Function, 
    orderState: Order[], 
    setActiveProduct: Function, 
    setActiveProductPromotions: Function,
    setActiveProductVariant: Function, 
    master_state: MasterState,
    setTriggerRefresh: Function, triggerRefresh: string[],
    setPadState: Function,
    setDiscount: Function,
    setKioskState: Function,
    kioskState: KioskState,
    setCurrentTransactionPrice: Function,
    input_ref: RefObject<HTMLInputElement>
}) {
    const [ orderInfo, setOrderInfo ] = useState<{
        total: number,
        sub_total: number,
        tax: number,
        non_discounted_sub_total: number,
        promotions: {
            promotion_id: string,
            affected_products: string[],
            name: string,
            discount_value: { Absolute?: number, Percentage?: number }
        }[],
        state: Order[]
    }>();

    useEffect(() => {  
        const applied_promos: {
            promotion_id: string,
            affected_products: string[],
            name: string,
            discount_value: { Absolute?: number, Percentage?: number }
        }[] = [];

        const deferred_promotions: {
            promotion_id: string,
            affected_products: string[],
            name: string,
            discount_value: { Absolute?: number, Percentage?: number }
        }[] = [];

        let flat_products = orderState.map(k => k.products).flatMap(k => k);

        const optimal_pdts = determineOptimalPromotionPathway(flat_products);
        let optimal_queue = optimal_pdts.filter(b => b.chosen_promotion?.promotion != null && b.chosen_promotion != null);

        console.log(JSON.parse(JSON.stringify( optimal_queue )));

        const applied_promotions = orderState.map(b => {
            return { ...b, products: b.products.map(k => {
                const dim = [];

                for(let i = 0; i < k.quantity; i++) {
                    // Find relevant in optimal list
                    const exists = optimal_queue.findIndex(n => n.reference_field.barcode == k.variant_information.barcode);

                    console.log("::index::", exists, optimal_queue[exists]);

                    if(exists !== -1 && optimal_queue[exists].chosen_promotion != null && optimal_queue[exists].chosen_promotion?.promotion != null) {
                        // Apply discount
                        const di =  {
                            source: "promotion",
                            value: fromDbDiscount(discountFromPromotion(optimal_queue[exists].chosen_promotion!.promotion!)),
                            promotion: optimal_queue[exists].chosen_promotion!.promotion,
                            applicable_quantity: 1
                        } as DiscountValue;

                        console.log("applying, di: ", di);
                        dim.push(di);

                        // Remove from queue
                        optimal_queue.splice(exists, 1);
                    }
                }

                return {
                    ...k,
                    discount: [...k.discount.filter(b => b.source !== "promotion"), ...dim]
                }
            })}
        });

        console.log(JSON.parse(JSON.stringify( applied_promotions )));
        
        // Order state has been changed. Regenerate values
        let non_discounted_sub_total = applied_promotions.reduce(
            (p,c) => 
                p + applyDiscount(
                    c.products.reduce(function (prev, curr) {
                        return prev + (curr.variant_information.retail_price * curr.quantity)
                    }, 0)
                , c.discount)
            , 0);

        let sub_total = applied_promotions.reduce(
            (p,c) => 
                p + applyDiscount(
                    c.products.reduce(function (prev, curr) {
                        return prev + (
                            // applyDiscount(
                            //     curr.variant_information.retail_price, 
                            //     findMaxDiscount(curr.discount, curr.variant_information.retail_price, !(!customerState))[0].value
                            // ) * curr.quantity
                            ((curr.variant_information.retail_price) * curr.quantity) - applyDiscountsConsiderateOfQuantity(curr.quantity, curr.discount, curr.variant_information.retail_price, !(!customerState))
                        )
                    }, 0)
                , c.discount)
            , 0)

        let total = applied_promotions.reduce(
            (p,c) => 
                p += applyDiscount(
                    c.products.reduce(function (prev, curr) {
                        // console.log(((curr.variant_information.retail_price * 1.15) * curr.quantity), " - ", applyDiscountsConsiderateOfQuantity(curr.quantity, curr.discount, curr.variant_information.retail_price * 1.15, !(!customerState)))
                        
                        return prev + (
                            // applyDiscount(
                            //     curr.variant_information.retail_price * 1.15, 
                            //     findMaxDiscount(curr.discount, curr.variant_information.retail_price, !(!customerState)).value
                            // ) * curr.quantity
                            ((curr.variant_information.retail_price * 1.15) * curr.quantity) - applyDiscountsConsiderateOfQuantity(curr.quantity, curr.discount, curr.variant_information.retail_price * 1.15, !(!customerState))
                        )
                    }, 0) 
                , c.discount) 
            , 0);
        
        let tax = total-sub_total;

        // DANGER: Loop
        // setOrderState(applied_promotions);

        setOrderInfo({
            sub_total,
            total,
            tax,
            non_discounted_sub_total,
            promotions: applied_promos,
            state: applied_promotions
        })
    }, [orderState, customerState])

    return (
        <div className="bg-gray-900 p-6 flex flex-col h-full" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
            <div className="flex flex-col gap-4 flex-1 max-h-full">
                {/* Order Information */}
                <div className="flex flex-row items-center justify-between max-h-screen overflow-hidden">
                    <div className="text-white">
                        {
                            customerState ?
                            <div className="flex flex-row items-center gap-2">
                                <h2 className="font-semibold text-lg">{customerState.name}</h2>

                                <Image
                                    onClick={() => {
                                        setCustomerState(null)

                                        // setOrderState({
                                        //     ...orderState,
                                        //     products: orderState.products.map(e => {
                                        //         return {
                                        //             ...e,
                                        //             discount: e.discount.filter(e => e.source !== "loyalty")
                                        //         }
                                        //     })
                                        // })
                                    }} 
                                    className="cursor-pointer" height={15} width={15} src="/icons/x-2.svg" alt="" style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }}></Image>
                            </div>
                            :
                            <div 
                                onClick={() => {
                                    setResult([]); 
                                    setSearchType("customer");    

                                    input_ref.current?.value ? input_ref.current.value = "" : {};
                                    input_ref.current?.focus()
                                }}
                                className="bg-gray-800 rounded-md px-2 py-[0.125rem] flex flex-row items-center gap-2 cursor-pointer">
                                <p>Select Customer</p>
                                <Image 
                                    className=""
                                    height={15} width={15} src="/icons/arrow-narrow-right.svg" alt="" style={{ filter: "invert(100%) sepia(5%) saturate(7417%) hue-rotate(235deg) brightness(118%) contrast(101%)" }}></Image>
                            </div>
                        }
                        <div className="text-sm text-gray-400">
                            {
                                orderInfo?.state.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) == 0
                                ? 
                                "Cart Empty" 
                                : 
                                <p>
                                    {orderInfo?.state.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0)} item{((orderInfo?.state.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) ?? 0) > 1 ? "s" : "")}
                                </p>
                            }
                        </div>
                    </div>

                    <div className="flex flex-row items-center gap-[0.75rem] bg-gray-800 p-2 px-4 rounded-md cursor-pointer">
                        <p className="text-white select-none" onClick={() => {
                            // const reduced = orderInfo.state.filter(e => e.order_type == "direct");
                            // const cleared = reduced.map(e => { return {...e, products: []} });

                            setOrderState([{
                                id: v4(),
                                destination: null,
                                origin: {
                                    code: master_state.store_id,
                                    contact: master_state.store_contact
                                },
                                products: [],
                                status: {
                                    status: "Queued",
                                    assigned_products: [],
                                    timestamp: getDate()
                                },
                                status_history: [],
                                order_history: [],
                                previous_failed_fulfillment_attempts: [],
                                order_notes: [],
                                reference: `RF${customAlphabet(`1234567890abcdef`, 10)(8)}`,
                                creation_date: getDate(),
                                discount: "a|0",
                                order_type: "Direct"
                            }])
                        }}>Clear Cart</p>
                        {/* <Image style={{ filter: "invert(100%) sepia(12%) saturate(7454%) hue-rotate(282deg) brightness(112%) contrast(114%)" }} width="25" height="25" src="/icons/x-square.svg" alt={''}></Image> */}
                    </div>
                </div>
                

                <hr className="border-gray-400 opacity-25"/>
                
                <div className="flex flex-col flex-1 h-full gap-4 overflow-auto max-h-full py-2">
                {
                    (orderInfo?.state.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) ?? 0) <= 0 ?
                    <div className="flex flex-col items-center w-full">
                        <p className="text-sm text-gray-400 py-4 select-none">No products in cart</p>
                    </div>
                    :
                    sortOrders(orderInfo?.state ?? []).map((n, indx) => {
                        return (
                            <div key={n.id} className="flex flex-col gap-4">
                                {
                                    orderInfo?.state.length !== 1 ?
                                        <div className={`flex select-none flex-row w-full justify-between gap-2 ${indx == 0 ? "" : "mt-4"}`}>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex flex-row items-center gap-2 select-none">
                                                    {
                                                        n.order_type == "Pickup" ?
                                                        <Image src="/icons/building-02.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                        :
                                                        n.order_type == "Quote" ?
                                                        <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                        :
                                                        n.order_type == "Shipment" ?
                                                        <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                        :
                                                        <Image src="/icons/shopping-bag-01-filled.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                    }

                                                    <div className="text-white font-semibold flex flex-row items-center gap-2">
                                                        { n.order_type == "Pickup" ? n.destination?.contact?.name : n.order_type == "Direct" ? "Instore Purchase" : n.origin.contact?.name} 
                                                        {/* <p className="text-gray-400">({ n.order_type == "Pickup" ? n.destination?.store_code : n.origin?.store_code})</p>  */}

                                                        {
                                                            n.order_type !== "Pickup" && n.order_type !== "Direct" && n.order_type !== "Quote" ?
                                                            <p className="text-gray-400"> -&gt; {n.destination?.contact.address.street}</p>
                                                            :
                                                            <></>
                                                        }
                                                    </div>
                                                </div>
                                                
                                                { 
                                                    n.order_type == "Pickup" ? 
                                                    <p className="text-gray-400">{n.destination?.contact.address.street}, {n.destination?.contact.address.street2}, {n.destination?.contact.address.po_code}</p>
                                                    :
                                                    n.order_type !== "Direct" && n.order_type !== "Quote" ?
                                                    <p className="text-gray-400">{n.origin.contact.address.street}, {n.origin.contact.address.street2}, {n.origin.contact.address.po_code}</p>
                                                    :
                                                    <></>
                                                }
                                            </div>
                                        </div>
                                    :
                                        orderInfo.state[0].order_type !== "Direct" ?
                                        <div className={`flex select-none flex-row w-full justify-between gap-2 ${indx == 0 ? "" : "mt-4"}`}>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex flex-row items-center gap-2 select-none">
                                                        {
                                                            n.order_type == "Pickup" ?
                                                            <Image src="/icons/building-02.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                            :
                                                            n.order_type == "Quote" ?
                                                            <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                            :
                                                            n.order_type == "Shipment" ?
                                                            <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                            :
                                                            <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                        }
                                                        <div className="text-white font-semibold flex flex-row items-center gap-2">
                                                            { n.order_type == "Pickup" ? n.destination?.contact?.name : n.origin.contact?.name} 
                                                            {/* <p className="text-gray-400">({ n.order_type == "Pickup" ? n.destination?.store_code : n.origin?.store_code})</p>  */}
                                                            
                                                            {
                                                                n.order_type !== "Pickup" ?
                                                                <p className="text-gray-400"> -&gt; {n.destination?.contact.address.street}</p>
                                                                :
                                                                <></>
                                                            }
                                                        </div>
                                                    </div>
                                                    
                                                    { 
                                                        n.order_type == "Pickup" ? 
                                                        <p className="text-gray-400">{n.destination?.contact.address.street}, {n.destination?.contact.address.street2}, {n.destination?.contact.address.po_code}</p>
                                                        :
                                                        <p className="text-gray-400">{n.origin.contact.address.street}, {n.origin.contact.address.street2}, {n.origin.contact.address.po_code}</p>
                                                    } 
                                                </div>
                                            </div>
                                        :
                                        <></>
                                }

                                {
                                    n.discount == "a|0" ? 
                                    <></> 
                                    : 
                                    <div className="flex flex-row items-center gap-1">
                                        <div className="bg-blue-600 h-5 w-5 rounded-full flex items-center justify-center text-xs text-white">$</div>
                                        <div></div>
                                        <p className="text-white font-bold">{parseDiscount(n.discount)}</p>
                                        <p className="text-white">off this cart</p>
                                    </div>
                                }

                                {
                                    n.products.map(e => {
                                        // Find the variant of the product for name and other information...
                                        const total_stock = e.variant_information.stock.reduce((prev, curr) => {
                                            return prev += (curr.quantity.quantity_sellable) 
                                        }, 0)

                                        const q_here = e.variant_information.stock.find(e => e.store.store_id == master_state.store_id);

                                        return (
                                            <div
                                                key={e.id} className="text-white">
                                                <div className="flex flex-row items-center gap-4">
                                                    <div className="flex flex-col md:flex-row items-center md:gap-4 gap-2">
                                                        <div className="relative">
                                                            <Image height={60} width={60} quality={100} alt="" className="rounded-sm" src={e.variant_information.images[0]}></Image>

                                                            {
                                                                n.order_type == "Direct" ?
                                                                    (n.products.reduce((t, i) => t += (i.variant_information.barcode == e.variant_information.barcode ? i.quantity : 0), 0) ?? 1) 
                                                                    >
                                                                    (q_here?.quantity.quantity_sellable ?? 0)
                                                                    ?
                                                                    <div className="bg-red-500 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{e.quantity}</div>
                                                                    :
                                                                    // e.variant_information.stock.map(e => (e.store.code == master_state.store_id) ? 0 : e.quantity.quantity_on_hand).reduce(function (prev, curr) { return prev + curr }, 0)
                                                                    // Determine the accurate representation of a non-diminishing item.
                                                                    e.variant_information.stock_information.non_diminishing ?
                                                                    <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{e.quantity}</div>
                                                                    :
                                                                    <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{e.quantity}</div>
                                                                :
                                                                    <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{e.quantity}</div>
                                                            }
                                                        </div>

                                                        <div className="flex flex-row sm:flex-col gap-2 items-center justify-center">
                                                            <Image
                                                                onClick={() => {
                                                                    if(!((n.products.reduce((p, k) => p += k.variant_information.barcode == e.variant_information.barcode ? k.quantity : 0, 0) ?? 1) >= total_stock)) {
                                                                        const product_list_clone = n.products.map(k => {
                                                                            if(k.id == e.id) {
                                                                                return {
                                                                                    ...k,
                                                                                    quantity: k.quantity+1
                                                                                }
                                                                            }else {
                                                                                return k
                                                                            }
                                                                        })

                                                                        const new_state = {
                                                                            ...n,
                                                                            products: product_list_clone
                                                                        }

                                                                        const new_order = orderInfo?.state.map(e => e.id == n.id ? new_state : e)

                                                                        setOrderState(sortOrders(new_order ?? []))
                                                                    }
                                                                }} 
                                                                onMouseOver={(v) => {
                                                                    if(!((n.products.reduce((p, k) => p += k.variant_information.barcode == e.variant_information.barcode ? k.quantity : 0, 0) ?? 1) >= total_stock))
                                                                        v.currentTarget.style.filter = "invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";
                                                                    else 
                                                                        v.currentTarget.style.filter = "invert(35%) sepia(47%) saturate(1957%) hue-rotate(331deg) brightness(99%) contrast(93%)";
                                                                }}
                                                                onMouseLeave={(v) => {
                                                                    v.currentTarget.style.filter = "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
                                                                }}
                                                                draggable="false"
                                                                className="select-none"
                                                                src={
                                                                    "/icons/arrow-block-up.svg"
                                                                } 
                                                                width="15" height="15" alt={''} style={{ filter: 
                                                                    (n.products.reduce((t, i) => t += (i.variant_information.barcode == e.variant_information.barcode ? i.quantity : 0), 0) ?? 1) 
                                                                    <= 
                                                                    total_stock
                                                                    // ((n.products.reduce((p, k) => p += k.variant_information.barcode == e.variant_information.barcode && isEqual(k.variant, e.variant) ? k.quantity : 0, 0)) >= total_stock)
                                                                    ? 
                                                                    "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)"
                                                                    :
                                                                    "invert(35%) sepia(47%) saturate(1957%) hue-rotate(331deg) brightness(99%) contrast(93%)" 
                                                                }} ></Image>
                                                            <Image
                                                                onClick={() => {
                                                                    const product_list_clone = n.products.map(k => {
                                                                        if(k.id == e.id) {
                                                                            if(k.quantity <= 1) {
                                                                                return null;
                                                                            }else {
                                                                                return {
                                                                                    ...k,
                                                                                    quantity: k.quantity-1
                                                                                }
                                                                            }
                                                                        }else {
                                                                            return k
                                                                        }
                                                                    })

                                                                    const new_state = {
                                                                        ...n,
                                                                        products: product_list_clone.filter(k => k) as ProductPurchase[]
                                                                    }

                                                                    // If no products exist anymore.

                                                                    if(new_state.products.length <= 0) {
                                                                        const new_order: Order[] = orderInfo?.state.map(e => e.id == n.id ? null : e)?.filter(b => b) as any as Order[];
                                                                        setOrderState(sortOrders(new_order ?? []))
                                                                    }else {
                                                                        const new_order = orderInfo?.state.map(e => e.id == n.id ? new_state : e)
                                                                        setOrderState(sortOrders(new_order ?? []))
                                                                    }
                                                                }} 
                                                                draggable="false"
                                                                className="select-none"
                                                                onMouseOver={(b) => {
                                                                    b.currentTarget.style.filter = (n.products.find(k => k.id == e.id)?.quantity ?? 1) <= 1 ? 
                                                                    "invert(50%) sepia(98%) saturate(3136%) hue-rotate(332deg) brightness(94%) contrast(99%)"
                                                                    : 
                                                                    "invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.filter = "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
                                                                }}
                                                                width="15" height="15" src={
                                                                    (n.products.find(k => k.id == e.id)?.quantity ?? 1) <= 1 ? 
                                                                    "/icons/x-square.svg" 
                                                                    : 
                                                                    "/icons/arrow-block-down.svg"
                                                                } alt={''} style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }}></Image>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex-1 cursor-pointer"
                                                        onClick={() => {
                                                            setActiveProduct(e.product)
                                                            setActiveProductVariant(e.variant_information)
                                                            setActiveProductPromotions(e.active_promotions);
                                                        }} >
                                                        <p className="font-semibold">{e.product.company} {e.product.name}</p>
                                                        <p className="text-sm text-gray-400">{e.variant_information.name}</p>
                                                        
                                                        {
                                                            n.order_type == "Direct" ?
                                                                (n.products.reduce((t, i) => t += (i.variant_information.barcode == e.variant_information.barcode ? i.quantity : 0), 0) ?? 1) 
                                                                > 
                                                                (q_here?.quantity.quantity_sellable ?? 0)
                                                                ?
                                                                    <p className="text-sm text-red-400">Out of stock - {(q_here?.quantity.quantity_sellable ?? 0)} here, {(total_stock - (q_here?.quantity.quantity_sellable ?? 0)) ?? 0} in other stores</p>
                                                                :
                                                                    <></>
                                                            :
                                                                <></>
                                                        }
                                                    </div>
                                                        
                                                    <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
                                                        <div className="flex flex-row items-center gap-2">
                                                            <Image 
                                                                onClick={() => {
                                                                    setPadState("discount");
                                                                    setDiscount({
                                                                        ...stringValueToObj(findMaxDiscount(e.discount, e.product_cost, false)[0].value),
                                                                        product: e.variant_information,
                                                                        for: "product",
                                                                        exclusive: false
                                                                    })
                                                                }}
                                                                style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }} height={20} width={20} alt="Discount" className="select-none rounded-sm hover:cursor-pointer" src="/icons/sale-03.svg" 
                                                                onMouseOver={(e) => {
                                                                    e.currentTarget.style.filter = "invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.filter = "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
                                                                }}
                                                            ></Image>
                                                        </div>

                                                        <div className="min-w-[75px] flex flex-col items-center">
                                                            {
                                                                (() => {
                                                                    const max_disc = findMaxDiscount(e.discount, e.variant_information.retail_price, !(!customerState))[0];

                                                                    return (
                                                                        applyDiscount(e.variant_information.retail_price, findMaxDiscount(e.discount, e.variant_information.retail_price, !(!customerState))[0].value) == e.variant_information.retail_price ?
                                                                        <p>${((e.variant_information.retail_price * 1.15) * e.quantity).toFixed(2) }</p>
                                                                        :
                                                                        <>
                                                                            <div className={`text-gray-500 text-sm ${max_disc.source == "loyalty" ? "text-gray-500" : max_disc.source == "promotion" ? "text-blue-500 opacity-75" : "text-red-500"} flex flex-row items-center gap-2`}><p className="line-through">${(e.variant_information.retail_price * e.quantity * 1.15).toFixed(2)}</p> {parseDiscount(max_disc.value)}</div>
                                                                            <p className={`${max_disc.source == "loyalty" ? "text-gray-300" : ""}`}>
                                                                                ${
                                                                                    ((((e.variant_information.retail_price) * e.quantity) * 1.15) - applyDiscountsConsiderateOfQuantity(e.quantity, e.discount, e.variant_information.retail_price * 1.15, !(!customerState))).toFixed(2)
                                                                                    // ((applyDiscount((e.variant_information.retail_price * e.quantity) * 1.15, findMaxDiscount(e.discount, e.variant_information.retail_price, !(!customerState))[0].value) ?? 1)).toFixed(2)
                                                                                }
                                                                            </p>
                                                                        </>
                                                                    )
                                                                })()
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        )
                    })
                }
                </div>

                {/* <hr className="border-gray-400 opacity-25"/> */}
                
                <div className="flex flex-col gap-1 text-white justify-between px-2">
                    {
                        orderInfo?.promotions.map((k, indx) => {
                            return (
                                <div className="flex flex-row items-center gap-2" key={k.promotion_id}>
                                    <div className="bg-blue-600 h-5 w-5 rounded-full flex items-center justify-center text-xs">{indx+1}</div>
                                    <p className="text-white">{k.name}</p>
                                </div>
                            )
                        })
                    }
                </div>

                <hr className="border-gray-400 opacity-25"/>
                
                <div className="flex flex-row items-center text-white justify-between px-2">
                    <div>
                        <p className="text-gray-400 font-bold">Sub Total</p>
                        <p className="text-gray-600 font-bold">Tax</p>
                        <p className="font-bold text-lg">Total</p>
                    </div>
                    
                    <div className="flex flex-col gap-0">
                        <p className="text-gray-400 font-bold items-end self-end">
                            ${(orderInfo?.sub_total ?? 0).toFixed(2)} 
                            {
                                orderInfo?.sub_total == orderInfo?.non_discounted_sub_total
                                ?
                                <></>
                                :
                                ` (-$${((orderInfo?.non_discounted_sub_total ?? 0) - (orderInfo?.sub_total ?? 0)).toFixed(2)})`
                            }
                        </p>

                        <p className="text-gray-600 font-bold items-end self-end">+15% (${(orderInfo?.tax ?? 0).toFixed(2)})</p>
                        <p className="font-bold text-lg items-end self-end">${(orderInfo?.total ?? 0).toFixed(2)}</p>
                    </div>
                </div>
                
                <div className="flex flex-row items-center gap-4">
                    <div 
                        onClick={() => {
                            parkSale(orderState, setTriggerRefresh, triggerRefresh, master_state, customerState, setKioskState, setOrderState, setCustomerState, setPadState, kioskState);
                        }}
                        className={`bg-gray-300 w-full rounded-md p-4 flex items-center justify-center cursor-pointer ${(orderInfo?.state.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0)) ?? 0 > 0 ? "" : "bg-opacity-10 opacity-20"}`}>
                        <p className="text-gray-800 font-semibold">Park Sale</p>
                    </div>

                    <div
                        onClick={() => {
                            setPadState("select-payment-method");

                            const price = (orderInfo?.total ?? 0).toFixed(2);

                            setKioskState({
                                ...kioskState,
                                order_total: parseFloat(price)
                            })

                            setCurrentTransactionPrice(parseFloat(price));
                        }} 
                        className={`${(orderInfo?.state.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) ?? 0) > 0 ? "bg-blue-700 cursor-pointer" : "bg-blue-700 bg-opacity-10 opacity-20"} w-full rounded-md p-4 flex items-center justify-center`}>
                        <p className={`text-white font-semibold ${""}`}>Checkout</p>
                    </div>
                </div>
            </div>
        </div>
    )
}