import { debounce } from "lodash";
import { customAlphabet } from "nanoid";
import Image from "next/image";
import { createRef, FC, useCallback, useEffect, useMemo, useState } from "react";
import { json } from "stream/consumers";
import { v4 } from "uuid";
import { getDate } from "../../kiosk";
import { Address, ContactInformation, Customer, DbOrder, DbProductPurchase, Employee, MasterState, Order, ProductPurchase, StockInfo, Store, VariantInformation } from "../../../../utils/stock_types";
import {OPEN_STOCK_URL} from "../../../../utils/helpers";

const DispatchMenu: FC<{ orderJob: [ Order[], Function ], customerJob: [ Customer | null, Function ], setPadState: Function, currentStore: string, master_state: MasterState }> = ({ orderJob, customerJob, setPadState, currentStore, master_state }) => {
    const [ orderState, setOrderState ] = orderJob;
    const [ customerState, setCustomerState ] = customerJob;

    const [ error, setError ] = useState<string | null>(null);
    const [ selectedItems, setSelectedItems ] = useState<{ store_id: string, item_id: string, selected: boolean }[]>([]);
    const [ pageState, setPageState ] = useState<"origin" | "rate" | "edit">("origin");
    const [ generatedOrder, setGeneratedOrder ] = useState<{ item: ProductPurchase | undefined, store: string, alt_stores: StockInfo[], ship: boolean, quantity: number }[]>([]);
    const [ productMap, setProductMap ] = useState<ProductPurchase[]>();

    const [ suggestions, setSuggestions ] = useState<Address[]>([]);
    const [ searching, setSearching ] = useState(false);
    const [ loading, setLoading ] = useState(false);

    const fetchDistanceData = useCallback(async () => {
        const distance_data: { store_id: string, store_code: string, distance: number }[] = await fetch(`${OPEN_STOCK_URL}/helpers/distance/${customerState?.id}`, {
            method: "GET",
            credentials: "include",
            redirect: "follow"
        })?.then(async e => {
            return await e.json();
        })

        return distance_data;
    }, [customerState?.id]);

    useEffect(() => {
        fetchDistanceData().then(data => {
            const ord = generateOrders(generateProductMap(orderState), data, currentStore);

            setGeneratedOrder(ord.assignment_sheet);
            setProductMap(ord.product_map);
            setSelectedItems(ord.assignment_sheet.map(e => {
                return {
                    item_id: e.item?.id ?? "", 
                    store_id: e.store ?? "", 
                    selected: false 
                }
            }))
        });
    }, [orderState, currentStore, fetchDistanceData])

    const debouncedResults = useMemo(() => {
        return debounce(async (address: string) => {
            setLoading(true);

            const data = await fetch(`${OPEN_STOCK_URL}/helpers/suggest/`, {
                method: "POST",
                credentials: "include",
                redirect: "follow",
                body: address
            })?.then(async e => {
                const data: Address[] = await e.json();
    
                return data;
            });

            setSuggestions(data);
            setLoading(false);
        }, 250);
    }, []);

    useEffect(() => {
        return () => {
            debouncedResults.cancel();
        };
    });

    const input_ref = createRef<HTMLInputElement>();

    return (
        <div className="bg-gray-900 max-h-[calc(100vh - 18px)] overflow-auto p-6 flex flex-col h-full justify-between flex-1 gap-8" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
            <div className="flex flex-row justify-between cursor-pointer">
                <div 
                    onClick={() => {
                        if(pageState !== "origin") setPageState("origin")
                        else setPadState("cart")
                    }}
                    className="flex flex-row items-center gap-2"
                >
                    <Image src="/icons/arrow-narrow-left.svg" height={20} width={20} alt="" />
                    <p className="text-gray-400">Back</p>
                </div>
                <p className="text-gray-400">Ship Order to Customer</p>
            </div>

            <div className="flex flex-col flex-1 gap-8 h-full max-h-fit overflow-hidden" onClick={(e) => {
                // let sel = selectedItems.find(k => k.selected);
                // if(sel) {
                //     setSelectedItems(selectedItems.map(k => {
                //         return {
                //             ...k,
                //             selected: false
                //         }
                //     }))
                // }
            }}>
                {
                    (() => {
                        switch(pageState) {
                            case "origin":
                                return (
                                    <>
                                        {/* <div className="flex flex-row items-center gap-4 self-center text-white w-full">
                                            <p className="">Overview</p>
                                            <hr className="flex-1 border-gray-800 h-[3px] border-[2px] bg-gray-800 rounded-md" />
                                            <p className="text-gray-600">Shipping Rate</p>
                                        </div> */}

                                        <div className="flex-col flex gap-8 flex-1 overflow-y-scroll max-h-full pr-2">
                                            <div className="flex flex-1 flex-col gap-4">
                                                <div className="flex flex-row items-center gap-2 text-gray-400">
                                                    <p>PRODUCTS</p>
                                                    <hr className="border-gray-400 opacity-25 w-full flex-1"/>
                                                </div>

                                                {
                                                    generatedOrder.length < 1 ? 
                                                    <></> 
                                                    :
                                                    <div className="grid items-center justify-center text-gray-300 gap-4 " style={{ gridTemplateColumns: "25px 1fr 75px 80px" }}>
                                                        <p className="font-semibold flex-1"></p>
                                                        <p className="font-semibold flex-1">Product</p>
                                                        <p className="font-semibold content-center self-center flex">Quantity</p>
                                                        <p className="font-semibold content-center self-center flex text-center justify-self-center">Source</p>
                                                    </div>
                                                }

                                                {
                                                    generatedOrder.length < 1 ?
                                                    <div className="flex items-center justify-center">
                                                        <p className="text-gray-400 py-4">No products</p>
                                                    </div>
                                                    :
                                                    generatedOrder.map(k => {
                                                        return (
                                                            <div key={`PPURCH-SHIP-${k.item?.id}-${k.store}`} className="text-white grid items-center justify-center gap-4" style={{ gridTemplateColumns: "25px 1fr 75px 80px" }}>
                                                                <div onClick={() => {
                                                                    setGeneratedOrder(
                                                                        generatedOrder.map(b => (b?.item?.id == k?.item?.id && b.store == k.store) ? { ...b, ship: !b.ship } : b)
                                                                    )
                                                                }} className="cursor-pointer select-none">
                                                                    {
                                                                        k.ship ?
                                                                        <Image src="/icons/check-square.svg" alt="" height={20} width={20} style={{ filter: "invert(95%) sepia(100%) saturate(20%) hue-rotate(289deg) brightness(104%) contrast(106%)" }}></Image>
                                                                        :
                                                                        <Image src="/icons/square.svg" alt="" height={20} width={20} style={{ filter: "invert(70%) sepia(11%) saturate(294%) hue-rotate(179deg) brightness(92%) contrast(87%)" }}></Image>
                                                                    }
                                                                </div>

                                                                <div className="flex-1">
                                                                    <p className="font-semibold">{k.item?.product.company} {k.item?.product.name}</p>
                                                                    <p className="text-sm text-gray-400">{k.item?.variant_information.name}</p>
                                                                </div>

                                                                <div className="self-center content-center items-center justify-center flex">
                                                                    <p className="font-semibold text-white"></p>{k.quantity}  
                                                                    <p className="font-semibold text-gray-400">/{k.item?.quantity}</p>
                                                                </div>
                                                                <div className={`relative inline-block ${selectedItems.find(b => (b.item_id == k.item?.id && b.store_id == k.store))?.selected ? "z-50" : ""}`}>
                                                                    <p 
                                                                    onClick={() => {
                                                                        const sel_items = selectedItems.map(b => (b.item_id == k.item?.id && b.store_id == k.store) ? { ...b, selected: true } : b);
                                                                        setSelectedItems(sel_items)
                                                                    }}
                                                                    className="self-center cursor-pointer content-center items-center justify-center font-semibold flex">{master_state.store_lut?.length > 0 ? master_state.store_lut?.find((b: Store) => k.store == b.id)?.code : "000"}</p>
                                                                    <div className={selectedItems.find(b => (b.item_id == k.item?.id && b.store_id == k.store))?.selected ? "absolute flex flex-col items-center justify-center w-full rounded-md overflow-hidden z-50" : "hidden absolute"}>
                                                                        {
                                                                            k.alt_stores.map(n => {
                                                                                return (
                                                                                    <div 
                                                                                        onClick={() => {
                                                                                            const new_order = generatedOrder.map(b => (b.item?.id == k?.item?.id && b.store == k.store) ? { ...b, store: n.store.store_id } : b)
                                                                                            setGeneratedOrder(new_order)

                                                                                            const sel = selectedItems.map(b => (b.item_id == k.item?.id && b.store_id == k.store) ? { ...b, store_id: n.store.store_id, selected: false } : b);
                                                                                            setSelectedItems(sel)
                                                                                        }}
                                                                                        key={`${k.item?.id}is-also-available-@${n.store.store_id}`} className={` ${k.store == n.store.store_id ? "bg-white text-gray-700" : "bg-gray-800 hover:bg-gray-700"} cursor-pointer font-semibold w-full flex-1 h-full text-center`}>
                                                                                        {n.store.store_code}
                                                                                    </div>
                                                                                )
                                                                            })
                                                                        }

                                                                        {/* <div 
                                                                            className={`bg-white text-gray-700 cursor-pointer font-semibold w-full flex-1 h-full text-center`}>
                                                                            {k.store}
                                                                        </div> */}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </div>

                                            <div className="flex flex-1 flex-col gap-4">
                                                <div className="flex flex-row items-center gap-2 text-gray-400">
                                                    <p>SHIPPING DETAILS</p>
                                                    <Image 
                                                        onClick={() => setPageState("edit")}
                                                        src="/icons/edit-03.svg" alt="" width="16" height="16" style={{ filter: "invert(65%) sepia(9%) saturate(354%) hue-rotate(179deg) brightness(99%) contrast(92%)" }} />
                                                    <hr className="border-gray-400 opacity-25 w-full flex-1"/>
                                                </div>

                                                <div className="text-white">
                                                    <p className="font-semibold">{customerState?.contact.name}</p>
                                                    <p className="">{customerState?.contact.email.full}</p>
                                                    <p className="">{customerState?.contact.mobile.number}</p>
                                                    <br />
                                                    <p className="font-semibold">{customerState?.contact.address.street}</p>
                                                    <p>{customerState?.contact.address.street2}</p>
                                                    <p className="text-gray-400">{customerState?.contact.address.city} {customerState?.contact.address.po_code}</p>
                                                    <p className="text-gray-400">{customerState?.contact.address.country}</p>
                                                </div>
                                            </div>

                                            <div
                                                onClick={() => {
                                                    if(generatedOrder.length >= 1) setPageState("rate");
                                                }}
                                                className={`${generatedOrder.length >= 1 ? "bg-blue-700 cursor-pointer" : "bg-blue-700 cursor-not-allowed bg-opacity-10 opacity-20"} w-full rounded-md p-4 flex items-center justify-center`}>
                                                <p className={`text-white font-semibold ${""}`}>Continue</p>
                                            </div>
                                        </div>
                                    </>
                                )
                            case "rate":
                                return (
                                    <>
                                        <p className="cursor-pointer font-semibold text-white">Shipping Rate</p>
                                        {/* <div className="flex flex-row items-center gap-4 self-center text-white w-full">
                                            <p className="cursor-pointer" onClick={() => setPageState("origin")}>Overview</p>
                                            <hr className="flex-1 border-gray-400 h-[3px] border-[2px] bg-gray-400 rounded-md" />
                                            <p>Shipping Rate</p>
                                        </div> */}

                                        <div className="flex-col flex gap-2 flex-1 overflow-y-scroll max-h-full pr-2">
                                            <div className=" flex flex-row items-center justify-between bg-gray-200 text-gray-900 px-4 py-2 rounded-sm cursor-pointer">
                                                <div className="flex flex-col items-start flex-start">
                                                    <p className="font-semibold">Priority Mail</p>
                                                    <p className="text-sm text-gray-400">1 day shipping</p>
                                                </div>

                                                <p className="font-semibold">${15.00}</p>
                                            </div>

                                            <div className="text-white flex flex-row items-center justify-between bg-gray-800 px-4 py-2 rounded-sm cursor-pointer">
                                                <div className="flex flex-col items-start flex-start">
                                                    <p className="font-semibold">Express Shipping</p>
                                                    <p className="text-sm text-gray-400">1-3 day shipping</p>
                                                </div>

                                                <p className="font-semibold">${7.00}</p>
                                            </div>

                                            <div className="text-white flex flex-row items-center justify-between bg-gray-800 px-4 py-2 rounded-sm cursor-pointer">
                                                <div className="flex flex-col items-start flex-start">
                                                    <p className="font-semibold">Standard Shipping</p>
                                                    <p className="text-sm text-gray-400">3+ day shipping</p>
                                                </div>

                                                <p className="font-semibold">${3.00}</p>
                                            </div>
                                        </div>

                                        <div
                                            onClick={async () => {
                                                let inverse_order: { store: string, store_code: string, items: ProductPurchase[], type: "direct" | "shipment" }[] = [];

                                                generatedOrder.map(k => {
                                                    const found = inverse_order.find(e => e.store == k.store && e.type == (k.ship ? "shipment" : "direct"));

                                                    if(found && k.item) {
                                                        inverse_order = inverse_order.map(e => (e.store == k.store && e.type == (k.ship ? "pickup" : "direct")) ? { ...e, items: [ ...e.items, { ...k.item!, quantity: k.quantity } ] } : e)
                                                    } else if(k.item) {
                                                        inverse_order.push({
                                                            store: k.store,
                                                            store_code: master_state.store_lut?.length > 0 ? master_state.store_lut?.find((b: Store) => k.store == b.id)?.code ?? k.store : k.store,
                                                            items: [ { ...k.item, quantity: k.quantity } ],
                                                            type: k.ship ? "shipment" : "direct"
                                                        })
                                                    }
                                                })

                                                Promise.all(inverse_order.map(async k => {
                                                    const data: Store = await (await fetch(`${OPEN_STOCK_URL}/store/${k.store}`, {
                                                        method: "GET",
                                                        credentials: "include",
                                                        redirect: "follow"
                                                    })).json();

                                                    return {
                                                        id: v4(),
                                                        destination: {
                                                            store_code: "000",
                                                            store_id: customerState?.id,
                                                            contact: customerState?.contact!
                                                        },
                                                        origin: {
                                                            store_code: k.store_code,
                                                            store_id: k.store,
                                                            contact: data.contact 
                                                        },
                                                        products: k.items,
                                                        status: {
                                                            status: {
                                                                type: "queued",
                                                                value: getDate()
                                                            },
                                                            assigned_products: k.items.map(b => b.id),
                                                            timestamp: getDate()
                                                        },
                                                        previous_failed_fulfillment_attempts: [],
                                                        status_history: [],
                                                        order_history: [],
                                                        order_notes: orderState.map(b => b.order_notes).flat(),
                                                        reference: `DP${customAlphabet(`1234567890abcdef`, 10)(8)}`,
                                                        creation_date: getDate(),
                                                        discount: "a|0",
                                                        order_type: k.type
                                                    };
                                                })).then((k) => {
                                                    let job = orderJob[0];
                                                    job = job.filter(k => k.order_type != "direct")
                                                    k.map(b => job.push(b as Order));
                                                    
                                                    orderJob[1](job);
                                                    setPadState("cart")
                                                });
                                            }}
                                            className={`${true ? "bg-blue-700 cursor-pointer" : "bg-blue-700 bg-opacity-10 opacity-20"} w-full rounded-md p-4 flex items-center justify-center`}>
                                            <p className={`text-white font-semibold ${""}`}>Complete</p>
                                        </div>
                                    </>
                                )
                            case "edit":
                                return (
                                    <div className="flex flex-col gap-8 flex-1 overflow-auto">
                                        <div className="flex flex-col gap-2">
                                            <p className="text-white font-semibold">Contact Information</p>
                                            
                                            <div className="flex flex-col gap-1">
                                                <p className="text-gray-400 pb-0 mb-0">Customer Name</p>
                                                <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                    <input 
                                                        placeholder="Customer Name" defaultValue={customerState?.contact.name} className="bg-transparent focus:outline-none text-white flex-1" 
                                                        onChange={(e) => {
                                                            if(customerState)
                                                                setCustomerState({
                                                                    ...customerState,
                                                                    contact: {
                                                                        ...customerState.contact,
                                                                        name: e.target.value
                                                                    }
                                                                }) 
                                                        }}
                                                        onFocus={(e) => {
                                                        }}
                                                        tabIndex={0}
                                                        // onBlur={() => setSearchFocused(false)}
                                                        onKeyDown={(e) => {
                                                        }}
                                                        />
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col gap-1">
                                                <p className="text-gray-400">Phone Number</p>
                                                <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                    <input 
                                                        placeholder="Phone Number" defaultValue={customerState?.contact.mobile.number} className="bg-transparent focus:outline-none text-white flex-1" 
                                                        onChange={(e) => {
                                                            if(customerState)
                                                                setCustomerState({
                                                                    ...customerState,
                                                                    contact: {
                                                                        ...customerState.contact,
                                                                        mobile: {
                                                                            valid: true,
                                                                            number: e.target.value
                                                                        }
                                                                    }
                                                                }) 
                                                        }}
                                                        onFocus={(e) => {
                                                        }}
                                                        tabIndex={0}
                                                        // onBlur={() => setSearchFocused(false)}
                                                        onKeyDown={(e) => {
                                                        }}
                                                        />
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <p className="text-gray-400">Email Address</p>
                                                <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                    <input 
                                                        placeholder="Email Address" defaultValue={customerState?.contact.email.full} className="bg-transparent focus:outline-none text-white flex-1" 
                                                        onChange={(e) => {
                                                            if(customerState)
                                                                setCustomerState({
                                                                    ...customerState,
                                                                    contact: {
                                                                        ...customerState.contact,
                                                                        email: {
                                                                            root: e.target.value.split("@")[0],
                                                                            domain: e.target.value.split("@")[1],
                                                                            full: e.target.value
                                                                        }
                                                                    }
                                                                }) 
                                                        }}
                                                        onFocus={(e) => {
                                                        }}
                                                        tabIndex={0}
                                                        // onBlur={() => setSearchFocused(false)}
                                                        onKeyDown={(e) => {
                                                        }}
                                                        />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col flex-1 gap-2 rounded-md">
                                            <p className="text-white font-semibold">Shipping Details</p>
                                            
                                            <div className="flex-1 h-full">
                                                <div className="flex flex-col gap-1">
                                                    <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                        <input 
                                                            autoComplete="off"
                                                            ref={input_ref}
                                                            placeholder="Address" defaultValue={customerState?.contact.address.street} className="bg-transparent focus:outline-none text-white flex-1" 
                                                            onChange={(e) => {
                                                                debouncedResults(e.target.value);
                                                            }}
                                                            onFocus={() => setSearching(true)}
                                                            tabIndex={0}
                                                            />
                                                    </div>
                                                </div>

                                                <div className={`flex flex-col gap-2 flex-1 px-2 py-2 ${searching ? "bg-gray-800" : ""}`}>
                                                {
                                                    searching ? 
                                                        loading ? 
                                                            <div className="flex items-center justify-center w-full h-full">
                                                                <p className="text-gray-400 self-center">Loading...</p>
                                                            </div>
                                                        :
                                                            suggestions.map(k => {
                                                                return (
                                                                    <div
                                                                        onClick={() => {
                                                                            setSearching(false);

                                                                            setCustomerState({
                                                                                ...customerState,
                                                                                contact: {
                                                                                    ...customerState?.contact,
                                                                                    address: k
                                                                                }
                                                                            })

                                                                            input_ref.current ? input_ref.current.value = "" : {}
                                                                        }} 
                                                                        className="px-4 py-2 cursor-pointer hover:bg-gray-700 rounded-md" key={`${k.city}-${k.country}-${k.po_code}-${k.street}-${k.street2}`}>
                                                                        <p className="text-white font-semibold">{k.street.trim() == "0" ? "" : k.street} {k.street2} {k.po_code}</p>
                                                                        <p className="text-gray-400">{k.city} - {k.country}</p>
                                                                    </div>
                                                                )
                                                            })
                                                    :
                                                    <div className="flex flex-row items-start gap-4 px-2 py-4">
                                                        <Image src="/icons/check-verified-02.svg" style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} className="mt-1" height={20} width={20} alt="Verified Address" />

                                                        <div className="text-white">
                                                            <p className="font-semibold">{customerState?.contact.address.street}</p>
                                                            <p>{customerState?.contact.address.street2}</p>
                                                            <p className="text-gray-400">{customerState?.contact.address.city} {customerState?.contact.address.po_code}</p>
                                                            <p className="text-gray-400">{customerState?.contact.address.country}</p>
                                                        </div>
                                                    </div>
                                                }
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => {
                                                if(!loading) {
                                                    setLoading(true);

                                                    fetch(`${OPEN_STOCK_URL}/customer/contact/${customerState?.id}`, {
                                                        method: "POST",
                                                        body: JSON.stringify(customerState?.contact),
                                                        credentials: "include",
                                                        redirect: "follow"
                                                    })?.then(async e => {
                                                        const data: Customer = await e.json();
                                                        setCustomerState(data);
        
                                                        if(e.ok) {
                                                            fetchDistanceData().then(data => {
                                                                const ord = generateOrders(generateProductMap(orderState), data, currentStore);
                                                                setGeneratedOrder(ord.assignment_sheet);
                                                                setProductMap(ord.product_map);
                                                                setLoading(false);
                                                            });
        
                                                            setError(null);
                                                            setPageState("origin");
                                                        }else {
                                                            setError("Malformed Street Address")
                                                        }
                                                    })
                                                }
                                            }}
                                            className={`${!loading ? "bg-blue-700 cursor-pointer" : "bg-blue-700 bg-opacity-10 opacity-20"} w-full rounded-md p-4 flex items-center justify-center`}>
                                            
                                            <p className={`text-white font-semibold ${""}`}>{loading ? "Saving..." : "Save"}</p>
                                        </div>
                                    </div>
                                )
                        }
                    })()
                }
            </div>
        </div>
    )
}

function generateProductMap(orders: Order[]) {
    let pdt_map: ProductPurchase[] = [];

    for(let i = 0; i < orders.length; i++) {
        if(orders[i].order_type == "direct") {
            orders[i].products.map(e => {
                pdt_map.push(e)
            })
        }
    }

    return pdt_map;
}

function generateOrders(product_map: ProductPurchase[], distance_data: { store_id: string, store_code: string, distance: number }[], currentStore: string): { assignment_sheet: { item: ProductPurchase | undefined, store: string, alt_stores: StockInfo[], ship: boolean, quantity: number }[], product_map: ProductPurchase[] } {
    /// 1. Determine the best location for each product.
    /// 2. Ensure as many products are in the same location as possible.
    /// 3. Ensure it is close to the destination.

    /// Create a reverse map of all products to store relations...
    /// Generate a valid list of store options
    /// => Sort by closeness
    /// => Give to user

    let smallest_distance = 12756000.01;

    distance_data.map(k => {
        if(k.distance < smallest_distance) {
            smallest_distance = k.distance;
        }
    })

    const map = new Map<string, {
        items: { item_id: string, quantity: number }[],
        weighting: number
    }>();

    product_map.map(e => {
        e.variant_information.stock.map(k => {
            const has = k.quantity.quantity_sellable;
            const store = k.store.store_id;
            let curr = map.get(store);

            if(curr) {
                curr.items.push({
                    item_id: e.id,
                    quantity: has
                })
                
                map.set(store, curr);
            }else {
                map.set(store, {
                    items: [
                        {
                            item_id: e.id,
                            quantity: has
                        }
                    ],
                    weighting: 0
                })
            }
        })
    })

    // map<map<double (weighting), vector(items)>, string (strore)>
    // let m: [number, Map<string, ProductPurchase[]>][] = [];

    let kvp: 
        {
            weighting: number,
            store_id: string,
            items: { item_id: string, quantity: number }[]
        }[] = [];

    const total_items = product_map.reduce((p, c) => p += c.quantity, 0);

    map.forEach((val, key) => {
        const item_weighting = (val.items.reduce((p, e) => {
            const n = e.quantity - (product_map.find(k => k.id == e.item_id)?.quantity ?? 0);
            return p += n;
        }, 0) + 1) / total_items;

        const distance_weighting = (smallest_distance / (distance_data.find(k => k.store_code == key)?.distance ?? 12756000.01));

        val.weighting = (0.1 * item_weighting) + (0.9 * distance_weighting)
        // console.log(`${key}:: ${val.weighting} 0.1x${item_weighting} and 0.9x${distance_weighting}`)
        kvp.push({
            weighting: val.weighting,
            store_id: key,
            items: val.items
        });
    });

    // [weighting, store_id, { item_id, quantity - that are instore }[]]
    let weighted_vector = kvp.sort((a, b) => b.weighting - a.weighting);

    // [item_id, store_code, quantity][]
    const product_assignment: [string, string, number][] = [];

    weighted_vector.map(k => {
        k.items.map(b => {
            const required_quantity = product_map.find(n => n.id == b.item_id)?.quantity ?? 0;
            const fulfilled = product_assignment.reduce((p,c) => c[0] == b.item_id ? p + c[2] : p + 0, 0);
            const net_required = required_quantity - fulfilled;

            if(b.quantity >= net_required && net_required > 0) {
                // console.log(`Store: ${k.store_id} has enough to fulfil ${b.quantity}x${b.item_id} RQ${required_quantity}-FUL:${fulfilled}==NR${net_required}`)
                // Assign store to fulfil this quantity.
                product_assignment.push([b.item_id, k.store_id, net_required])

                // Reduce the quantity the store has...
                weighted_vector.map(z => z.store_id == k.store_id ? { ...z, items: z.items.map(n => n.item_id == b.item_id ? { ...n, quantity: n.quantity - net_required } : n)} : z)
                // product_map = product_map.map(n => n.id == b.item_id ? { ...n, variant_information: { ...n.variant_information, stock: n.variant_information.stock.map(g => g.store.code == k.store_id ? { ...g, quantity: { ...g.quantity, quantity_sellable: g.quantity.quantity_sellable - net_required }} : g) } } : n)
            }else if (net_required > 0 && b.quantity < net_required && b.quantity > 0) {
                // console.log(`Store: ${k.store_id} has enough to ONLY fulfil ${b.quantity}x${b.item_id} RQ${required_quantity}-FUL:${fulfilled}==NR${net_required}`)

                product_assignment.push([b.item_id, k.store_id, b.quantity])
                weighted_vector.map(z => z.store_id == k.store_id ? { ...z, items: z.items.map(n => n.item_id == b.item_id ? { ...n, quantity: 0 } : n)} : z)
                // product_map = product_map.map(n => n.id == b.item_id ? { ...n, variant_information: { ...n.variant_information, stock: n.variant_information.stock.map(g => g.store.code == k.store_id ? { ...g, quantity: { ...g.quantity, quantity_sellable: g.quantity.quantity_sellable - net_required }} : g) } } : n)
            }else {
                // Store cannot fulfil
                // console.log(`Store: ${k.store_id} cannot fulfil any of ${b.item_id} RQ${required_quantity}-FUL:${fulfilled}==NR${net_required}`)
            }
        })
    })

    return {
        assignment_sheet: product_assignment.map(e => {
            return {
                item: product_map.find(k => k.id == e[0]),
                store: e[1],
                alt_stores: [product_map.find(k => k.id == e[0])?.variant_information.stock.find(b => b.store.store_id == e[1])!, ...product_map.find(k => k.id == e[0])?.variant_information.stock.filter(n => n.store.store_id !== e[1] && (n.quantity.quantity_sellable - product_assignment.reduce((p, c) => c[1] == n.store.store_id ? p + c[2] : p, 0)) >= e[2]) ?? [] ],
                ship: !(e[1] == currentStore),
                quantity: e[2]
            }
        }),
        product_map: product_map
    };
}

export default DispatchMenu;