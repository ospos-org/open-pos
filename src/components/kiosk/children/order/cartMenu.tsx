import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useResetAtom } from "jotai/utils";
import Image from "next/image";

import { applyDiscount, applyDiscountsConsiderateOfQuantity, findMaxDiscount, parseDiscount } from "@utils/discountHelpers";
import { Order, ProductPurchase } from "@utils/stockTypes";

import { defaultKioskAtom, kioskPanelLogAtom } from "@atoms/kiosk";
import { priceAtom, probingPricePayableAtom } from "@atoms/payment";
import { aCustomerActiveAtom, customerAtom } from "@atoms/customer";
import { searchTermAtom, searchTypeAtom } from "@atoms/search";
import { inspectingProductAtom } from "@atoms/product";
import { masterStateAtom } from "@atoms/openpos";
import { ordersAtom } from "@atoms/transaction";
import { sortOrders } from "@/src/utils/utils";
import { OrdersPriceSummary } from "./ordersPriceSummary";
import { CartActionFooter } from "./cartActionFooter";
import { CartActionHeader } from "./cartActionHeader";

export default function CartMenu() {
    const currentStore = useAtomValue(masterStateAtom)
    const aCustomerActive = useAtomValue(aCustomerActiveAtom)

    const setInspectingProduct = useSetAtom(inspectingProductAtom)

    const [ orderState, setOrderState ] = useAtom(ordersAtom)
    const [ customerState, setCustomerState ] = useAtom(customerAtom)

    return (
        <div className="bg-gray-900 p-6 flex flex-col h-full overflow-y-auto overflow-x-hidden" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
            <div className="flex flex-col gap-4 flex-1 max-h-full">
                {/* Order Information */}
                <CartActionHeader />  

                <hr className="border-gray-400 opacity-25"/>
                
                <div className="flex flex-col flex-1 h-full gap-4 overflow-auto max-h-full py-2">
                {
                    (orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) ?? 0) <= 0 ?
                    <div className="flex flex-col items-center w-full">
                        <p className="text-sm text-gray-400 py-4 select-none">No products in cart</p>
                    </div>
                    :
                    sortOrders(orderState ?? []).map((n, indx) => {
                        return (
                            <div key={n.id} className="flex flex-col gap-4">
                                {
                                    orderState.length !== 1 ?
                                        <div className={`flex select-none flex-row w-full justify-between gap-2 ${indx == 0 ? "" : "mt-4"}`}>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex flex-row items-center gap-2 select-none">
                                                    {
                                                        n.order_type == "pickup" ?
                                                        <Image src="/icons/building-02.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                        :
                                                        n.order_type == "quote" ?
                                                        <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                        :
                                                        n.order_type == "shipment" ?
                                                        <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                        :
                                                        <Image src="/icons/shopping-bag-01-filled.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                    }

                                                    <div className="text-white font-semibold flex flex-row items-center gap-2">
                                                        { n.order_type == "pickup" ? n.destination?.contact?.name : n.order_type == "direct" ? "Instore Purchase" : n?.origin?.contact?.name} 
                                                        {/* <p className="text-gray-400">({ n.order_type == "pickup" ? n.destination?.store_code : n.origin?.store_code})</p>  */}

                                                        {
                                                            n.order_type !== "pickup" && n.order_type !== "direct" && n.order_type !== "quote" ?
                                                            <p className="text-gray-400"> -&gt; {n.destination?.contact.address.street}</p>
                                                            :
                                                            <></>
                                                        }
                                                    </div>
                                                </div>
                                                
                                                { 
                                                    n.order_type == "pickup" ? 
                                                    <p className="text-gray-400">{n.destination?.contact.address.street}, {n.destination?.contact.address.street2}, {n.destination?.contact.address.po_code}</p>
                                                    :
                                                    n.order_type !== "direct" && n.order_type !== "quote" ?
                                                    <p className="text-gray-400">{n.origin?.contact.address.street}, {n.origin?.contact.address.street2}, {n.origin?.contact.address.po_code}</p>
                                                    :
                                                    <></>
                                                }
                                            </div>
                                        </div>
                                    :
                                        orderState[0].order_type !== "direct" ?
                                        <div className={`flex select-none flex-row w-full justify-between gap-2 ${indx == 0 ? "" : "mt-4"}`}>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex flex-row items-center gap-2 select-none">
                                                        {
                                                            n.order_type == "pickup" ?
                                                            <Image src="/icons/building-02.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                            :
                                                            n.order_type == "quote" ?
                                                            <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                            :
                                                            n.order_type == "shipment" ?
                                                            <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                            :
                                                            <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                        }
                                                        <div className="text-white font-semibold flex flex-row items-center gap-2">
                                                            { n.order_type == "pickup" ? n.destination?.contact?.name : n.origin?.contact?.name} 
                                                            {/* <p className="text-gray-400">({ n.order_type == "pickup" ? n.destination?.store_code : n.origin?.store_code})</p>  */}
                                                            
                                                            {
                                                                n.order_type !== "pickup" ?
                                                                <p className="text-gray-400"> -&gt; {n.destination?.contact.address.street}</p>
                                                                :
                                                                <></>
                                                            }
                                                        </div>
                                                    </div>
                                                    
                                                    { 
                                                        n.order_type == "pickup" ? 
                                                        <p className="text-gray-400">{n.destination?.contact.address.street}, {n.destination?.contact.address.street2}, {n.destination?.contact.address.po_code}</p>
                                                        :
                                                        <p className="text-gray-400">{n.origin?.contact.address.street}, {n.origin?.contact.address.street2}, {n.origin?.contact.address.po_code}</p>
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

                                        const q_here = e.variant_information.stock.find(e => e.store.store_id == currentStore.store_id);

                                        return (
                                            <div
                                                key={e.id} className="text-white">
                                                <div className="flex flex-row items-center gap-4">
                                                    <div className="flex flex-col md:flex-row items-center md:gap-4 gap-2">
                                                        <div className="relative">
                                                            <Image height={60} width={60} quality={100} alt="" className="rounded-sm" src={e.variant_information.images[0]}></Image>

                                                            {
                                                                n.order_type == "direct" ?
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

                                                                        const new_order = orderState.map(e => e.id == n.id ? new_state : e)

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
                                                                        const new_order: Order[] = orderState.map(e => e.id == n.id ? null : e)?.filter(b => b) as any as Order[];
                                                                        setOrderState(sortOrders(new_order ?? []))
                                                                    }else {
                                                                        const new_order = orderState.map(e => e.id == n.id ? new_state : e)
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
                                                            setInspectingProduct((currentProduct) => ({
                                                                ...currentProduct,
                                                                activeProduct: e.product,
                                                                activeProductVariant: e.variant_information,
                                                                activeProductPromotions: e.active_promotions

                                                            }))
                                                        }} >
                                                        <p className="font-semibold">{e.product.company} {e.product.name}</p>
                                                        <p className="text-sm text-gray-400">{e.variant_information.name}</p>
                                                        
                                                        {
                                                            n.order_type == "direct" ?
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
                                                                    // setKioskPanel("discount");
                                                                    // setDiscount({
                                                                    //     ...stringValueToObj(findMaxDiscount(e.discount, e.product_cost, false)[0].value),
                                                                    //     product: e.variant_information,
                                                                    //     for: "product",
                                                                    //     exclusive: false
                                                                    // })
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
                                                                                    ((((e.variant_information.retail_price) * e.quantity) * 1.15) - applyDiscountsConsiderateOfQuantity(e.quantity, e.discount, e.variant_information.retail_price * 1.15, aCustomerActive)).toFixed(2)
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

                <hr className="border-gray-400 opacity-25"/>
                
                <OrdersPriceSummary />
                <CartActionFooter />
            </div>
        </div>
    )
}