import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import Image from "next/image";

import { 
    deliverablesProductInformationAtom, 
    deliverablesStateChangeAtom, 
    deliverablesMenuStateAtom, 
    productCategoriesAtom,
    deliverablesAtom
} from "@atoms/deliverables";
import { Skeleton } from "@components/common/skeleton";
import {Order} from "@/generated/stock/Api";
import {ProductCategory} from "@utils/stockTypes";
import {openStockClient} from "~/query/client";

const parseDeliverables = (deliverables: Order[]) => {
    let categories: ProductCategory[] = [];

    deliverables.map(k => {
        k.products.map(b => {
            // For each product, try place it
            for(let i = 0; i < b.tags.length; i++){
                let match = categories.findIndex(e => e.name == b.tags[i])

                if(match != -1) {
                    let loc = categories[match].items.findIndex(k => k.barcode == b.product_code)
                    if(loc != -1) {
                        categories[match].items[loc].instances.push(
                            ...(b?.instances ?? [])
                            .filter(n => n.fulfillment_status?.pick_status !== "Picked")
                            .map(n => {
                                return {
                                    state: n,
                                    product_purchase_id: b.id,
                                    // a: b.variant_information.id
                                    transaction_id: k.reference
                                }
                            })
                        )
                    }else {
                        categories[match].items.push({
                            name: b.product_name,
                            variant: b.product_variant_name,
                            order_reference: k.reference,
                            sku: b.product_sku,
                            barcode: b.product_code,
                            // Length of instances is quantity.
                            instances: (b?.instances ?? [])
                                .filter(n => n.fulfillment_status?.pick_status !== "Picked")
                                .map(n => {
                                    return {
                                        state: n,
                                        product_purchase_id: b.id,
                                        // a: b.variant_information.id
                                        transaction_id: k.reference
                                    }
                                })
                        })
                    }

                    return
                }
            }

            // If we made it here, doesn't exit.
            categories.push({
                name: b.tags[0],
                items: [{
                    name: b.product_name,
                    variant: b.product_variant_name,
                    order_reference: k.reference,
                    sku: b.product_sku,
                    barcode: b.product_code,
                    // Length of instances is quantity.
                    instances: (b?.instances ?? [])
                        .filter(n => n.fulfillment_status?.pick_status != "Picked")
                        .map(n => {
                            return {
                                state: n,
                                product_purchase_id: b.id,
                                transaction_id: k.reference
                            }
                        })
                }]
            })
        })
    })

    return categories
}

export function OrderSummary() {
    const menuInformation = useAtomValue(deliverablesProductInformationAtom)

    const setProductCategories = useSetAtom(productCategoriesAtom)

    const [ menuState, setMenuState ] = useAtom(deliverablesMenuStateAtom)
    const [ stateChange, setStateChange ] = useAtom(deliverablesStateChangeAtom)
    const [ deliverables, setDeliverables ] = useAtom(deliverablesAtom)

    const [ pendingStatus, setPendingStatus ] = useState<string | null>()

    return (
        <div className="absolute pointer-events-none sm:relative flex flex-col h-full overflow-y-scroll" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
            {
                menuState != null ?
                <div className="absolute pointer-events-auto sm:relative overflow-y-scroll flex flex-col gap-4 z-40 bottom-0 sm:mb-0 mb-[40px] sm:h-full h-[440px] p-4 sm:w-full w-screen bg-black text-white h-80px sm:rounded-none rounded-t-md">
                    {
                        menuInformation ?
                        <div className="flex flex-col">
                            <p className="font-bold text-lg">{menuInformation?.name}</p>
                            <p className="text-gray-400">{menuInformation?.description.substring(0, 40)}...</p>
                        </div>
                        :
                        <div className="flex flex-col gap-[4px]">
                            <Skeleton className="w-[100px] h-[26px] rounded-sm" />
                            <Skeleton className="w-full h-[22px] rounded-sm" />
                        </div>
                    }

                    <div className="flex flex-row items-start justify-between">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col">
                                <p className="text-gray-400 text-sm font-bold">VARIANT</p>
                                {
                                    menuInformation?.variants ?
                                        menuInformation?.variants
                                        .filter(k => k.barcode == menuState.barcode)
                                        .map(k => {
                                            return (
                                                <div key={JSON.stringify(k)} className="flex flex-row items-center gap-2 pr-4 ">
                                                    <p className="font-semibold">{k.name}</p>
                                                </div>
                                            )
                                        })
                                    :
                                        <Skeleton className="w-full h-[24px] rounded-sm" />
                                }
                            </div>
                            
                            <div className="flex flex-col">
                                <p className="text-gray-400 text-sm font-bold">QUANTITY</p>
                                {
                                    menuInformation?.variants ?
                                        <p>{menuState.instances.length}</p>
                                    :
                                        <Skeleton className="w-[25px] h-[24px] rounded-sm" />
                                }
                            </div>
                        </div>
                        
                        {
                            menuInformation?.images?.[0] ?
                            <div className="pr-4">
                                <Image src={menuInformation?.variants.find(k => k.barcode == menuState.barcode)?.images?.[0] ?? menuInformation.images?.[0]} className="rounded-md" height={150} width={150} alt={menuInformation?.name}></Image>
                            </div>
                            :
                            <div className="pr-4">
                                <Skeleton className="mr-4 w-[150px] h-[150px] rounded-sm" />
                            </div>
                        }
                    </div>
                    
                    <div className="flex flex-col">
                        <p className="text-gray-400 text-sm font-bold">INSTANCES</p>

                        <div className="flex flex-col gap-2">
                            {
                                menuState?.instances.map(k => {
                                    return (
                                        <div key={JSON.stringify(k)} className="flex flex-row justify-between text-white pl-4 border-gray-800 bg-gray-900 border-2 w-full items-center p-2 rounded-lg">
                                            <div className="flex flex-row items-center gap-2">
                                                {(() => {
                                                    switch(k.state.fulfillment_status?.pick_status) {
                                                        case "pending":
                                                            return (
                                                                <div className="bg-gray-400 h-3 w-3 rounded-full"></div>
                                                            )
                                                        case "picked":
                                                            return (
                                                                <div className="bg-green-600 h-3 w-3 rounded-full"></div>
                                                            )
                                                        case "failed":
                                                            return (
                                                                <div className="bg-red-600 h-3 w-3 rounded-full"></div>
                                                            )
                                                        case "uncertain":
                                                            return (
                                                                <div className="bg-blue-400 h-3 w-3 rounded-full"></div>
                                                            )
                                                        case "processing":
                                                            return (
                                                                <div className="bg-orange-400 h-3 w-3 rounded-full"></div>
                                                            )
                                                        default:
                                                            return (
                                                                <div className="bg-gray"></div>
                                                            )
                                                    }
                                                })()}

                                                <p>{k.state.fulfillment_status?.pick_status.toString()}</p>
                                            </div>
                                            
                                            <p className="font-bold text-gray-400">{k.transaction_id}</p>
                                            <p 
                                                onClick={() => {
                                                    setStateChange(k)
                                                }}
                                                className="bg-gray-100 rounded-md text-gray-800 font-bold px-8">-{">"}</p>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
                :
                <></>
            }

            {
                stateChange != null ?
                <div className="absolute pointer-events-auto sm:relative overflow-y-scroll flex flex-col gap-4 z-50 bottom-0 sm:mb-0 mb-[40px] sm:h-full h-[440px] p-4 sm:w-full w-screen bg-black text-white h-80px sm:rounded-none rounded-t-md">
                    <div className="flex flex-col">
                        <p className="text-gray-400 text-sm font-bold">CURRENT STATUS</p>
                        <p>{stateChange.state.fulfillment_status?.pick_status.toString()}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="text-gray-400 text-sm font-bold">SET STATUS</p>
                        
                        <div className="flex flex-row flex-wrap gap-2">
                            {
                                ["Pending", "Picked", "Failed", "Uncertain", "Processing"].map(k => {
                                    return <p 
                                        key={JSON.stringify(k)}
                                        className={` p-2 rounded-md px-4 w-fit ${k == stateChange.state.fulfillment_status?.pick_status ? "bg-white bg-opacity-20" : k.toLocaleLowerCase() == pendingStatus ? "bg-blue-400 bg-opacity-40" : "bg-gray-200 bg-opacity-10"}`}
                                        onClick={() => {
                                            if(k == stateChange.state.fulfillment_status?.pick_status) setPendingStatus(null)
                                            else setPendingStatus(k.toLowerCase())
                                        }}>{k}</p>
                                })
                            }
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <p className="text-gray-400 text-sm font-bold">STATUS HISTORY</p>

                        <div className={`flex flex-col gap-2 ${pendingStatus != null ? "pb-[60px]" : ""}`}>
                            {
                                stateChange.state.fulfillment_status?.pick_history.map(k => {
                                    return (
                                        <div key={JSON.stringify(k)} className="grid flex-row items-center" style={{ gridTemplateColumns: "1fr 1fr" }}>
                                            <div className="flex flex-col">
                                                <p className="font-bold">{k.item.toString()}</p>
                                                <p className="text-gray-400 text-sm">{k.reason}</p>
                                            </div>
                                            <p className="text-gray-400 text-sm text-end">{new Date(k.timestamp).toLocaleString()}</p>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                        
                    { 
                        pendingStatus != null ?
                        <div className="sm:sticky bg-white bg-opacity-5 rounded-md p-4 backdrop-blur-lg backdrop-filter fixed flex flex-row gap-4 bottom-[45px] sm:w-full sm:min-w-0 sm:bottom-4 min-w-[calc(100vw-30px)]">
                            <div
                                onClick={() => {
                                    setPendingStatus(null)
                                }} 
                                className="bg-white text-black flex-1 text-center p-4 rounded-md">
                                <p>Discard</p>
                            </div>

                            <div
                                onClick={() => {
                                    openStockClient.transaction.updateProductStatus(stateChange?.transaction_id, stateChange?.product_purchase_id, stateChange.state.id, pendingStatus)
                                        .then(data => {
                                            if (data.ok) {
                                                setPendingStatus(null)
                                                setStateChange(null)

                                                let abn: Order[] = deliverables;

                                                data.data.products.map(b => {
                                                    abn = deliverables.map(k => {
                                                        return b.id == k.id ? b : k
                                                    }) as Order[];
                                                })

                                                setDeliverables(abn)
                                                const categories = parseDeliverables(abn);
                                                setProductCategories(categories)

                                                categories.map(c => {
                                                    c.items.map(k => {
                                                        if(k.barcode == menuState?.barcode) {
                                                            setMenuState({
                                                                instances: k.instances,
                                                                product: k.sku,
                                                                barcode: k.barcode
                                                            })
                                                        }
                                                    })
                                                })
                                            }
                                        })
                                }}
                                className="bg-blue-700 flex-1 text-center p-4 rounded-md">
                                <p>Save</p>
                            </div>
                            
                        </div>
                        :
                        <></>
                    }
                </div>
                :
                <></>
            }
        </div>
    )
}

export { parseDeliverables }
