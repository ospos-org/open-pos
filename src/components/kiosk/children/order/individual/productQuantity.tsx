import { ordersAtom } from "@/src/atoms/transaction"
import { useAtom } from "jotai"
import Image from "next/image"
import {ContextualOrder, ContextualProductPurchase} from "@utils/stockTypes";

interface ProductQuantityProps {
    currentOrder: ContextualOrder,
    product: ContextualProductPurchase,
    totalStock: number
}

export function ProductQuantity({ currentOrder, product, totalStock }: ProductQuantityProps) {
    const [ orderState, setOrderState ] = useAtom(ordersAtom)

    return (
        <div className="flex flex-row sm:flex-col gap-2 items-center justify-center">
            <Image
                onClick={() => {
                    if(!((currentOrder.products.reduce((p, k) => p += k.variant_information.barcode == product.variant_information.barcode ? k.quantity : 0, 0) ?? 1) >= totalStock) || product.transaction_type == "In") {
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
                    if(!((currentOrder.products.reduce((p, k) => p += k.variant_information.barcode == product.variant_information.barcode ? k.quantity : 0, 0) ?? 1) >= totalStock) || product.transaction_type == "In")
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
                    totalStock && product.transaction_type === "Out"
                    ? 
                    "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)"
                    :
                    product.transaction_type === "Out" ?
                    "invert(35%) sepia(47%) saturate(1957%) hue-rotate(331deg) brightness(99%) contrast(93%)" 
                    :
                    "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)"
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
                        products: product_list_clone.filter(k => k) as ContextualProductPurchase[]
                    }

                    // If no products exist anymore.

                    if(new_state.products.length <= 0) {
                        const new_order: ContextualOrder[] = orderState.map(e => e.id == currentOrder.id ? null : e)?.filter(b => b) as any as ContextualOrder[];
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
                    "/icons/arrow-block-down.svg"
                } alt={''} style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }}></Image>
        </div>
    )
}