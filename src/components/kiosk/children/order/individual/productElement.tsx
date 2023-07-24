import Image from "next/image";

import { Order, ProductPurchase } from "@utils/stockTypes";
import { useMemo } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { masterStateAtom } from "@/src/atoms/openpos";
import { ordersAtom } from "@/src/atoms/transaction";
import { inspectingProductAtom } from "@/src/atoms/product";
import { applyDiscount, applyDiscountsConsiderateOfQuantity, findMaxDiscount, parseDiscount } from "@/src/utils/discountHelpers";
import { aCustomerActiveAtom } from "@/src/atoms/customer";

interface ProductElementProps {
    product: ProductPurchase,
    currentOrder: Order
}

export function ProductElement({ product, currentOrder }: ProductElementProps) {
    const currentStore = useAtomValue(masterStateAtom)
    const aCustomerActive = useAtomValue(aCustomerActiveAtom)
    
    const setInspectingProduct = useSetAtom(inspectingProductAtom)

    const [ orderState, setOrderState ] = useAtom(ordersAtom)

    // Find the variant of the product for name and other information...
    const totalStock = useMemo(() => {
        return product.variant_information.stock.reduce((prev, curr) => {
            return prev += (curr.quantity.quantity_sellable) 
        }, 0)
    }, [product.variant_information.stock])

    const quantityHere = useMemo(() => {
        return product.variant_information.stock.find(e => e.store.store_id == currentStore.store_id);
    }, [currentStore.store_id, product.variant_information.stock])

    return (
        <div className="text-white">
            <div className="flex flex-row items-center gap-4">
                <div className="flex flex-col md:flex-row items-center md:gap-4 gap-2">
                    <div className="relative">
                        <Image height={60} width={60} quality={100} alt="" className="rounded-sm" src={product.variant_information.images[0]}></Image>

                        {
                            currentOrder.order_type == "direct" ?
                                (currentOrder.products.reduce((t, i) => t += (i.variant_information.barcode == product.variant_information.barcode ? i.quantity : 0), 0) ?? 1) 
                                >
                                (quantityHere?.quantity.quantity_sellable ?? 0)
                                ?
                                <div className="bg-red-500 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{product.quantity}</div>
                                :
                                // e.variant_information.stock.map(e => (e.store.code == master_state.store_id) ? 0 : e.quantity.quantity_on_hand).reduce(function (prev, curr) { return prev + curr }, 0)
                                // Determine the accurate representation of a non-diminishing item.
                                product.variant_information.stock_information.non_diminishing ?
                                <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{product.quantity}</div>
                                :
                                <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{product.quantity}</div>
                            :
                                <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{product.quantity}</div>
                        }
                    </div>

                    <div className="flex flex-row sm:flex-col gap-2 items-center justify-center">
                        <Image
                            onClick={() => {
                                if(!((currentOrder.products.reduce((p, k) => p += k.variant_information.barcode == product.variant_information.barcode ? k.quantity : 0, 0) ?? 1) >= totalStock)) {
                                    const product_list_clone = currentOrder.products.map(k => {
                                        if(k.id == product.id) {
                                            return {
                                                ...k,
                                                quantity: k.quantity+1
                                            }
                                        }else {
                                            return k
                                        }
                                    })

                                    const new_state = {
                                        ...currentOrder,
                                        products: product_list_clone
                                    }

                                    const new_order = orderState.map(e => e.id == currentOrder.id ? new_state : e)

                                    setOrderState(new_order ?? [])
                                }
                            }} 
                            onMouseOver={(v) => {
                                if(!((currentOrder.products.reduce((p, k) => p += k.variant_information.barcode == product.variant_information.barcode ? k.quantity : 0, 0) ?? 1) >= totalStock))
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
                                (currentOrder.products.reduce((t, i) => t += (i.variant_information.barcode == product.variant_information.barcode ? i.quantity : 0), 0) ?? 1) 
                                <= 
                                totalStock
                                ? 
                                "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)"
                                :
                                "invert(35%) sepia(47%) saturate(1957%) hue-rotate(331deg) brightness(99%) contrast(93%)" 
                            }} ></Image>
                        <Image
                            onClick={() => {
                                const product_list_clone = currentOrder.products.map(k => {
                                    if(k.id == product.id) {
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
                                    ...currentOrder,
                                    products: product_list_clone.filter(k => k) as ProductPurchase[]
                                }

                                // If no products exist anymore.

                                if(new_state.products.length <= 0) {
                                    const new_order: Order[] = orderState.map(e => e.id == currentOrder.id ? null : e)?.filter(b => b) as any as Order[];
                                    setOrderState(new_order ?? [])
                                }else {
                                    const new_order = orderState.map(e => e.id == currentOrder.id ? new_state : e)
                                    setOrderState(new_order ?? [])
                                }
                            }} 
                            draggable="false"
                            className="select-none"
                            onMouseOver={(b) => {
                                b.currentTarget.style.filter = (currentOrder.products.find(k => k.id == product.id)?.quantity ?? 1) <= 1 ? 
                                "invert(50%) sepia(98%) saturate(3136%) hue-rotate(332deg) brightness(94%) contrast(99%)"
                                : 
                                "invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.filter = "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
                            }}
                            width="15" height="15" src={
                                (currentOrder.products.find(k => k.id == product.id)?.quantity ?? 1) <= 1 ? 
                                "/icons/x-square.svg" 
                                : 
                                "/icons/arrow-block-dowcurrentOrder.svg"
                            } alt={''} style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }}></Image>
                    </div>
                </div>
                
                <div className="flex-1 cursor-pointer"
                    onClick={() => {
                        setInspectingProduct((currentProduct) => ({
                            ...currentProduct,
                            activeProduct: product.product,
                            activeProductVariant: product.variant_information,
                            activeProductPromotions: product.active_promotions

                        }))
                    }} >
                    <p className="font-semibold">{product.product.company} {product.product.name}</p>
                    <p className="text-sm text-gray-400">{product.variant_information.name}</p>
                    
                    {
                        currentOrder.order_type == "direct" ?
                            (currentOrder.products.reduce((t, i) => t += (i.variant_information.barcode == product.variant_information.barcode ? i.quantity : 0), 0) ?? 1) 
                            > 
                            (quantityHere?.quantity.quantity_sellable ?? 0)
                            ?
                                <p className="text-sm text-red-400">Out of stock - {(quantityHere?.quantity.quantity_sellable ?? 0)} here, {(totalStock - (quantityHere?.quantity.quantity_sellable ?? 0)) ?? 0} in other stores</p>
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
                                const max_disc = findMaxDiscount(product.discount, product.variant_information.retail_price, aCustomerActive)[0];

                                return (
                                    applyDiscount(product.variant_information.retail_price, findMaxDiscount(product.discount, product.variant_information.retail_price, aCustomerActive)[0].value) == product.variant_information.retail_price ?
                                    <p>${((product.variant_information.retail_price * 1.15) * product.quantity).toFixed(2) }</p>
                                    :
                                    <>
                                        <div className={`text-gray-500 text-sm ${max_disc.source == "loyalty" ? "text-gray-500" : max_disc.source == "promotion" ? "text-blue-500 opacity-75" : "text-red-500"} flex flex-row items-center gap-2`}><p className="line-through">${(product.variant_information.retail_price * product.quantity * 1.15).toFixed(2)}</p> {parseDiscount(max_disc.value)}</div>
                                        <p className={`${max_disc.source == "loyalty" ? "text-gray-300" : ""}`}>
                                            ${
                                                ((((product.variant_information.retail_price) * product.quantity) * 1.15) - applyDiscountsConsiderateOfQuantity(product.quantity, product.discount, product.variant_information.retail_price * 1.15, aCustomerActive)).toFixed(2)
                                                // ((applyDiscount((e.variant_informatiocurrentOrder.retail_price * e.quantity) * 1.15, findMaxDiscount(e.discount, e.variant_informatiocurrentOrder.retail_price, !(!customerState))[0].value) ?? 1)).toFixed(2)
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
}