import { useEffect, useState } from "react";
import { FulfillmentStatus, MasterState, Order, PickStatus, Product, ProductCategory, ProductInstance, Transaction } from "./stock-types";
import { OPEN_STOCK_URL, useWindowSize } from "./helpers";
import moment from "moment";
import Image from "next/image";

import { Skeleton } from "@/components/ui/skeleton"
import OrderView from "./orderView";


export default function Deliverables({ master_state, setLowModeCartOn, lowModeCartOn }: { master_state: MasterState, setLowModeCartOn: Function, lowModeCartOn: boolean}) {
    const [ deliverables, setDeliverables ] = useState<Order[]>([]);
    const [ , setIsLoading ] = useState(true);
    const windowSize = useWindowSize();

    const [ productCategories, setProductCategories ] = useState<ProductCategory[]>([]);
    const [ menuState, setMenuState ] = useState<{
        product: string,
        barcode: string,
        instances: {
            product_purchase_id: string,
            transaction_id: string,
            state: ProductInstance
        }[]
    } | null>(null);
    const [ menuInformation, setMenuInformation ] = useState<Product | null>(null);
    const [ stateChange, setStateChange ] = useState<{
        product_purchase_id: string,
        transaction_id: string,
        state: ProductInstance
    } | null>(null);
    const [ pendingStatus, setPendingStatus ] = useState<string | null>();

    useEffect(() => {
        if(menuState != null)
            fetch(`${OPEN_STOCK_URL}/product/${menuState?.product}`, {
                method: "GET",
                credentials: "include",
                redirect: "follow"
            }).then(async k => {
                const data: Product = await k.json();
                setMenuInformation(data);
            })
    }, [menuState])

    const [ activeOrder, setActiveOrder ] = useState<Order | null>(null);

    const parseDeliverables = (deliverables: Order[]) => {
        let categories: ProductCategory[] = [];

        // console.log(deliverables)

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
                                .filter(n => n.fulfillment_status.pick_status != "picked")
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
                                    .filter(n => n.fulfillment_status.pick_status != "picked")
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
                            .filter(n => n.fulfillment_status.pick_status != "picked")
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

    useEffect(() => {
        setIsLoading(true);

        fetch(`${OPEN_STOCK_URL}/transaction/deliverables/${master_state.store_id}`, {
            method: "GET",
            credentials: "include",
            redirect: "follow"
        })
        .then(async b => {
            const data: Order[] = await b.json();
            setDeliverables(data);
            setIsLoading(false);
            setProductCategories(parseDeliverables(data))
        })
    }, [master_state.store_id])

    const [ viewingMode, setViewingMode ] = useState(0);

    console.log(stateChange, windowSize.width)

    return (
        <>
            {
                (!lowModeCartOn || ((windowSize.width ?? 0) > 640)) ? 
                <div className="flex flex-col gap-4 md:p-4 p-6 w-full">
                    <div className="flex w-full max-w-full flex-row items-center gap-2 bg-gray-400 bg-opacity-10 p-2 rounded-md">
                        <div className={`text-white ${viewingMode == 0 ? "bg-gray-500" : " bg-transparent"} p-2 rounded-md px-4 w-full flex flex-1 text-center justify-center cursor-pointer`} onClick={() => setViewingMode(0)}>Order</div>
                        <div className={`text-white ${viewingMode == 1 ? "bg-gray-500" : " bg-transparent"} p-2 rounded-md px-4 w-full flex flex-1 text-center justify-center cursor-pointer`} onClick={() => setViewingMode(1)}>Batch</div>
                    </div>

                    {
                        (() => {
                            switch(viewingMode) {
                                case 0:
                                    return (
                                        <div>
                                            {
                                                deliverables.length <= 0 ?
                                                <p className="text-gray-400">No Deliverables</p>
                                                :
                                                <div className="flex flex-col gap-4">
                                                    {
                                                        deliverables.map((b, indx) => {
                                                            let total_products = 0
                                                            let completed = 0;

                                                            b.products.map(v => {
                                                                total_products += v.quantity
                                                                v?.instances?.map(k => {
                                                                    if(k.fulfillment_status.pick_status.toLowerCase() == "picked") {
                                                                        completed += 1
                                                                    }
                                                                })
                                                            })

                                                            const pairings = new Map()

                                                            b.products.map(n => {
                                                                n?.instances?.map(l => {
                                                                    if(pairings.get(l.fulfillment_status.pick_status) == undefined){
                                                                        pairings.set(l.fulfillment_status.pick_status, 1)
                                                                    }else {
                                                                        pairings.set(l.fulfillment_status.pick_status, pairings.get(l.fulfillment_status.pick_status)+1)
                                                                    }
                                                                })
                                                            })

                                                            const mapped = Array.from(pairings, ([name, value]) => ({ name, value }));
                                                            mapped.sort((a, b) => {
                                                                if (a.name < b.name) {
                                                                    return -1;
                                                                }else if (a.name > b.name) {
                                                                    return 1;
                                                                }else {
                                                                    return 0;
                                                                }
                                                            });

                                                            return (
                                                                <>
                                                                    <div
                                                                        onClick={() => {
                                                                            if ((windowSize?.width ?? 0) < 640) {
                                                                                setActiveOrder(b)
                                                                                setLowModeCartOn(!lowModeCartOn)
                                                                                setStateChange(null)
                                                                                setMenuState(null)
                                                                            }
                                                                        }} 
                                                                        className="grid grid-flow-row gap-y-4 gap-x-2 items-center px-2" style={{ gridTemplateColumns: (windowSize?.width ?? 0) < 640 ? "1fr 1fr" : ".5fr 1fr 250px 117px" }}>
                                                                        <div className="flex flex-col gap-2">
                                                                            <div className="flex flex-row gap-2">
                                                                                { 
                                                                                    completed === total_products ? 
                                                                                        <p className="text-white font-mono font-bold px-2 bg-green-600 rounded-md">{completed}/{total_products}</p>
                                                                                    :
                                                                                        <p className="text-white font-mono font-bold px-2 bg-gray-700 rounded-md">{completed}/{total_products}</p>
                                                                                }
                                                                                <p className="text-white font-semibold not-italic md:visible hidden">Products Picked</p>
                                                                            </div>
                                                                            
                                                                            <div className="flex flex-row items-center gap-2">
                                                                                <div className="flex flex-row items-center justify-between gap-2">
                                                                                    {
                                                                                        mapped.map((status: { name: PickStatus, value: number }) => {
                                                                                            return (
                                                                                                <div
                                                                                                    key={JSON.stringify(status)} 
                                                                                                    className={"flex flex-row items-center bg-gray-700 rounded-full max-h-4 pr-2 gap-1 justify-between w-full flex-1"}>
                                                                                                    {(() => {
                                                                                                        switch(status.name.toLowerCase()) {
                                                                                                            case "picked":
                                                                                                                return (
                                                                                                                    <div className="border-green-400 bg-green-700 border-2 h-4 w-4 min-w-[16px] min-h-[16px] rounded-full"></div>
                                                                                                                )
                                                                                                            case "pending":
                                                                                                                return (
                                                                                                                    <div className="border-gray-400 bg-gray-700 border-2 h-4 w-4 min-w-[16px] min-h-[16px] rounded-full"></div>
                                                                                                                )
                                                                                                            case "failed":
                                                                                                                return (
                                                                                                                    <div className="border-red-400 bg-red-700 border-2 h-4 w-4 min-w-[16px] min-h-[16px] rounded-full"></div>
                                                                                                                )
                                                                                                            case "uncertain":
                                                                                                                return (
                                                                                                                    <div className="border-orange-400 bg-orange-700 border-2 h-4 w-4 min-w-[16px] min-h-[16px] rounded-full"></div>
                                                                                                                )
                                                                                                            case "processing":
                                                                                                                return (
                                                                                                                    <div className="border-blue-400 bg-blue-700 border-2 h-4 w-4 min-w-[16px] min-h-[16px] rounded-full"></div>
                                                                                                                )
                                                                                                            default:
                                                                                                                return <></>
                                                                                                        }
                                                                                                    })()}
                                                                                                    
                                                                                                    <p className="text-gray-200 text-sm">{status.value}</p>
                                                                                                </div>
                                                                                            )
                                                                                            
                                                                                        })
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {
                                                                            (windowSize?.width ?? 0) > 640 
                                                                            ?
                                                                            <p className="text-white opacity-40 overflow-ellipsis overflow-hidden whitespace-nowrap">
                                                                                {
                                                                                    b.products.map(k => k.product_name).join(", ")
                                                                                }
                                                                            </p>
                                                                            :
                                                                            <></>
                                                                        }
                                                                        

                                                                        <div className="flex flex-col md:flex-row items-end sm:items-start md:gap-4">
                                                                            <p className="text-white font-mono font-bold">{b.reference}</p>
                                                                            <p className="text-white text-opacity-50">{moment(b.status.timestamp).format('D/MM/yy')}</p>
                                                                        </div>

                                                                        {
                                                                            (windowSize?.width ?? 0) > 640 
                                                                            ?
                                                                            <p 
                                                                                onClick={() => {
                                                                                    setActiveOrder(b)
                                                                                    setLowModeCartOn(!lowModeCartOn)
                                                                                    setStateChange(null)
                                                                                    setMenuState(null)
                                                                                }}
                                                                                className="bg-gray-100 text-sm text-end w-fit rounded-md place-center self-center items-center text-gray-800 font-bold px-4 justify-self-end hover:cursor-pointer">
                                                                                <i className="md:visible invisible not-italic text-sm">{(windowSize?.width ?? 0) > 640 ? "View " : ""}</i>-{">"}
                                                                            </p> 
                                                                            :
                                                                            <></>
                                                                        }
                                                                    </div>

                                                                    {
                                                                        indx == deliverables.length-1 ? <></> : <hr className="border-gray-700" />
                                                                    }
                                                                </>
                                                            )
                                                        })
                                                    }
                                                </div>
                                            }
                                        </div>
                                    )
                                case 1:
                                    return (
                                        <div className="flex flex-col gap-2">
                                            {
                                                deliverables.length <= 0 ?
                                                <p className="text-gray-400">No Deliverables</p>
                                                :
                                                <div className="flex flex-col gap-4" style={{ gridTemplateColumns: "125px 150px 100px 100px" }}>
                                                    <div className="hidden sm:grid items-center justify-center text-left" style={{ gridTemplateColumns: `1fr 140px ${(windowSize?.width ?? 0) > 640 ? "100px" : ""}` }}>
                                                        <p className="text-white font-bold">Product Name</p>
                                                        <p className="text-gray-400 md:text-center">Quantity</p>
                                                        <p className="text-gray-400 text-end pr-4">Order</p>
                                                    </div>

                                                    {
                                                        productCategories.map(b => {
                                                            return (
                                                                <div key={`PRODUCT CATEGORIES: ${b.name}-${b.items.length}`} className="flex flex-col">
                                                                    <p className="text-gray-400 font-bold text-sm">{b.name.toUpperCase()}</p>

                                                                    <div className="flex flex-col gap-2">
                                                                        {
                                                                            b.items.sort((a, b) => { return a.name.localeCompare(b.name) }).map(k => {
                                                                                const b = k.instances.filter(n => n.state.fulfillment_status.pick_status.toLowerCase() == "picked")
                                                                                return (
                                                                                    <div
                                                                                        key={`ITEM: ${k.barcode}-${k.sku}`}
                                                                                        onClick={() => {
                                                                                            setMenuState({
                                                                                                instances: k.instances,
                                                                                                product: k.sku,
                                                                                                barcode: k.barcode
                                                                                            })
                                                                                        }} 
                                                                                        className="grid hover:bg-gray-700 p-2 px-4 rounded-md cursor-pointer items-center" 
                                                                                        style={{ gridTemplateColumns: `1fr ${(windowSize?.width ?? 0) > 640 ? "100px 100px" : "50px"}` }}>
                                                                                        <div className="flex flex-col justify-between">
                                                                                            <p className="text-white font-bold">{k.name}</p>
                                                                                            <p className="text-gray-400">{k.variant}</p>
                                                                                        </div>

                                                                                        <p className={`${b.length == k.instances.length ? "text-gray-600" : " text-gray-400"} text-end w-full font-bold md:text-center`}>{b.length} / {k.instances.length}</p>
                                                                                        
                                                                                        <p className="text-gray-400 hidden md:flex">{k.order_reference}</p>
                                                                                    </div>
                                                                                )
                                                                            })
                                                                        }
                                                                    </div>
                                                                </div>
                                                            )
                                                        })
                                                    }
                                                </div>
                                            }
                                        </div>
                                    )
                            }
                        })()
                    }

                    {
                        (menuState != null || stateChange != null) && ((windowSize.width ?? 0) <= 640) ? 
                        <div 
                            onClick={() => {
                                if (stateChange != null) setStateChange(null)
                                else setMenuState(null)
                            }}
                            className="bg-black h-[100vh] sm:w-[calc(100dw-62px)] sm:left-[62px] w-[100dw] min-h-[100vh] min-w-[100vw] top-0 left-0 fixed z-5 opacity-40"></div>
                        :
                        <></>
                    }
                </div>
                :
                <></>
            }

            {
                stateChange != null || menuState != null ?
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
                                                            switch(k.state.fulfillment_status.pick_status.toLocaleLowerCase()) {
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

                                                        <p>{k.state.fulfillment_status.pick_status}</p>
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
                                <p>{stateChange.state.fulfillment_status.pick_status}</p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <p className="text-gray-400 text-sm font-bold">SET STATUS</p>
                                
                                <div className="flex flex-row flex-wrap gap-2">
                                    {
                                        ["Pending", "Picked", "Failed", "Uncertain", "Processing"].map(k => {
                                            return <p 
                                                key={JSON.stringify(k)}
                                                className={` p-2 rounded-md px-4 w-fit ${k == stateChange.state.fulfillment_status.pick_status ? "bg-white bg-opacity-20" : k.toLocaleLowerCase() == pendingStatus ? "bg-blue-400 bg-opacity-40" : "bg-gray-200 bg-opacity-10"}`}
                                                onClick={() => {
                                                    if(k == stateChange.state.fulfillment_status.pick_status) setPendingStatus(null)
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
                                        stateChange.state.fulfillment_status.pick_history.map(k => {
                                            return (
                                                <div key={JSON.stringify(k)} className="grid flex-row items-center" style={{ gridTemplateColumns: "1fr 1fr" }}>
                                                    <div className="flex flex-col">
                                                        <p className="font-bold">{k.item}</p>
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
                                <div className="fixed flex flex-row gap-4 bottom-[45px] min-w-[calc(100vw-30px)] bg-black">
                                    <div
                                        onClick={() => {
                                            setPendingStatus(null)
                                        }} 
                                        className="bg-white text-black flex-1 text-center p-4 rounded-md">
                                        <p>Discard</p>
                                    </div>

                                    <div
                                        onClick={() => {
                                            fetch(`${OPEN_STOCK_URL}/transaction/status/product/${stateChange.transaction_id}/${stateChange.product_purchase_id}/${stateChange.state.id}`, {
                                                method: "POST",
                                                body: pendingStatus,
                                                credentials: "include",
                                                redirect: "follow"
                                            }).then(async k => {
                                                if(k.ok) {
                                                    setPendingStatus(null)
                                                    setStateChange(null)

                                                    const data: Transaction = await k.json();
                                                    let abn: Order[] = deliverables;

                                                    data.products.map(b => {
                                                        abn = deliverables.map(k => {
                                                            return b.id == k.id ? b : k
                                                        }) as Order[];

                                                        // console.log("ABN", abn, b)
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
                :
                <></>
            }

            {
                menuState == null && stateChange == null && (((windowSize.width ?? 0) < 640 && lowModeCartOn) || ((windowSize.width ?? 0) >= 640)) ?
                    <div className="bg-gray-900 p-6 flex flex-col h-full overflow-y-scroll" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
                        {
                            activeOrder != null ? 
                                <OrderView activeOrder={activeOrder} /> 
                            : 
                                <div className="h-full flex flex-col items-center justify-center flex-1">
                                    <p className="text-gray-400 text-center self-center">
                                        Please <strong>view</strong> an order to begin.
                                    </p>
                                </div>
                        }
                    </div>
                :
                    <></>
            }
        </>
    )
}