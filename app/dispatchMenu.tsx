import { debounce } from "lodash";
import Image from "next/image";
import { createRef, FC, useEffect, useMemo, useState } from "react";
import { json } from "stream/consumers";
import { v4 } from "uuid";
import { Address, ContactInformation, Customer, Employee, Order, ProductPurchase, StockInfo, Store, VariantInformation } from "./stock-types";

const DispatchMenu: FC<{ orderJob: [ Order[], Function ], customerJob: [ Customer | null, Function ], setPadState: Function }> = ({ orderJob, customerJob, setPadState }) => {
    const [ orderState, setOrderState ] = orderJob;
    const [ customerState, setCustomerState ] = customerJob;

    const [ error, setError ] = useState<string | null>(null);
    const [ selectedItems, setSelectedItems ] = useState<[string, boolean][]>([]);
    const [ pageState, setPageState ] = useState<"origin" | "rate" | "edit">("origin");
    const [ generatedOrder, setGeneratedOrder ] = useState<{ item: ProductPurchase | undefined, store: string, alt_stores: StockInfo[], ship: boolean, quantity: number }[]>([]);

    const [ suggestions, setSuggestions ] = useState<Address[]>([]);
    const [ searching, setSearching ] = useState(false);
    const [ loading, setLoading ] = useState(false);

    useEffect(() => {
        fetchDistanceData().then(data => {
            const ord = generateOrders(generateProductMap(orderState), data);
            setGeneratedOrder(ord);
            setSelectedItems(ord.map(e => [ e.item?.id ?? "", false ]))
        });
    }, [orderState])

    const debouncedResults = useMemo(() => {
        return debounce(async (address: string) => {
            setLoading(true);

            const data = await fetch(`http://127.0.0.1:8000/helpers/suggest/`, {
                method: "POST",
                credentials: "include",
                redirect: "follow",
                body: address
            })?.then(async e => {
                const data: Address[] = await e.json();
                console.log(data);
    
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

    const fetchDistanceData = async () => {
        const distance_data: { store_id: string, store_code: string, distance: number }[] = await fetch(`http://127.0.0.1:8000/helpers/distance/${customerState?.id}`, {
            method: "GET",
            credentials: "include",
            redirect: "follow"
        })?.then(async e => {
            return await e.json();
        })

        return distance_data;
    }

    const input_ref = createRef<HTMLInputElement>();

    return (
        <div className="flex flex-col flex-1 gap-8 h-full max-h-fit overflow-hidden" onClick={(e) => {
            let sel = selectedItems.find(k => k[1]);
            if(sel && e.currentTarget.id != `PPURCH-SHIP-${sel[0]}`) {
                setSelectedItems(selectedItems.map(k => [k[0], false]))
            }
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
                                                        <div key={`PPURCH-SHIP-${k.item?.id}`} id={`PPURCH-SHIP-${k.item?.id}`} className="text-white grid items-center justify-center gap-4" style={{ gridTemplateColumns: "25px 1fr 75px 80px" }}>
                                                            <div onClick={() => {
                                                                setGeneratedOrder(
                                                                    generatedOrder.map(b => b?.item?.id == k?.item?.id ? { ...b, ship: !b.ship } : b)
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

                                                            <p className="self-center content-center items-center justify-center flex">{k.item?.quantity} {k.quantity}</p>
                                                            <div className={`relative inline-block ${selectedItems.find(b => b[0] == k.item?.id)?.[1] ? "z-50" : ""}`}>
                                                                <p 
                                                                onClick={() => {
                                                                    setSelectedItems(selectedItems.map(b => b[0] == k.item?.id ? [b[0], true] : b))
                                                                }}
                                                                className="self-center cursor-pointer content-center items-center justify-center font-semibold flex">{k.store}</p>
                                                                <div className={selectedItems.find(b => b[0] == k.item?.id)?.[1] ? "absolute flex flex-col items-center justify-center w-full rounded-md overflow-hidden z-50" : "hidden absolute"}>
                                                                    {
                                                                        k.alt_stores.map(n => {
                                                                            return (
                                                                                <div 
                                                                                    onClick={() => {
                                                                                        const new_order = generatedOrder.map(b => b.item?.id == k?.item?.id ? { ...b, store: n.store.code } : b)
                                                                                        setGeneratedOrder(new_order)
                                                                                    }}
                                                                                    key={`${k.item?.id}is-also-available-@${n.store.code}`} className={` ${k.store == n.store.code ? "bg-white text-gray-700" : "bg-gray-800 hover:bg-gray-700"} cursor-pointer font-semibold w-full flex-1 h-full text-center`}>
                                                                                    {n.store.code}
                                                                                </div>
                                                                            )
                                                                        })
                                                                    }
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
                                                <p className="">{customerState?.contact.mobile.region_code} {customerState?.contact.mobile.root}</p>
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
                                    <p className="cursor-pointer text-white">Shipping Rate</p>
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
                                            let inverse_order: { store: string, items: ProductPurchase[] }[] = [];

                                            generatedOrder.map(k => {
                                                const found = inverse_order.find(e => e.store == k.store);

                                                if(found && k.item) {
                                                    inverse_order = inverse_order.map(e => e.store == k.store ? { ...e, items: [ ...e.items, k.item! ] } : e)
                                                } else if(k.item) {
                                                    inverse_order.push({
                                                        store: k.store,
                                                        items: [ k.item ]
                                                    })
                                                }
                                            })

                                            Promise.all(inverse_order.map(async k => {
                                                const data: Store = await (await fetch(`http://127.0.0.1:8000/store/code/${k.store}`, {
                                                    method: "GET",
                                                    credentials: "include",
                                                    redirect: "follow"
                                                })).json();

                                                return await {
                                                    id: v4(),
                                                    destination: {
                                                        code: "000",
                                                        contact: customerState?.contact!
                                                    },
                                                    origin: {
                                                        code: k.store,
                                                        contact: data.contact 
                                                    },
                                                    products: k.items,
                                                    status: [],
                                                    previous_failed_fulfillment_attempts: [],
                                                    status_history: [],
                                                    order_history: [],
                                                    order_notes: [],
                                                    reference: "",
                                                    creation_date: "",
                                                    discount: "a|0",
                                                    order_type: "shipment"
                                                };
                                            })).then((k) => {
                                                let job = orderJob[0];
                                                k.map(b => job.push(b as Order));
                                                job = job.filter(k => k.order_type != "direct")
                                                
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
                                                    placeholder="Phone Number" defaultValue={customerState?.contact.mobile.root} className="bg-transparent focus:outline-none text-white flex-1" 
                                                    onChange={(e) => {
                                                        if(customerState)
                                                            setCustomerState({
                                                                ...customerState,
                                                                contact: {
                                                                    ...customerState.contact,
                                                                    mobile: {
                                                                        region_code: "+64",
                                                                        root: e.target.value
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

                                                fetch(`http://127.0.0.1:8000/customer/contact/${customerState?.id}`, {
                                                    method: "POST",
                                                    body: JSON.stringify(customerState?.contact),
                                                    credentials: "include",
                                                    redirect: "follow"
                                                })?.then(async e => {
                                                    const data: Customer = await e.json();
                                                    setCustomerState(data);
    
                                                    if(e.ok) {
                                                        fetchDistanceData().then(data => {
                                                            setGeneratedOrder(generateOrders(generateProductMap(orderState), data));
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

function generateOrders(product_map: ProductPurchase[], distance_data: { store_id: string, store_code: string, distance: number }[]): { item: ProductPurchase | undefined, store: string, alt_stores: StockInfo[], ship: boolean, quantity: number }[] {
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
            const store = k.store.code;
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

    let kvp: [number, string, { item_id: string, quantity: number }[]][] = [];

    const total_items = product_map.reduce((p, c) => p += c.quantity, 0);

    map.forEach((val, key) => {
        const item_weighting = (val.items.reduce((p, e) => {
            const n = e.quantity - (product_map.find(k => k.id == e.item_id)?.quantity ?? 0);
            return p += n;
        }, 0) + 1) / total_items;

        const distance_weighting = (smallest_distance / (distance_data.find(k => k.store_code == key)?.distance ?? 12756000.01));

        val.weighting = (0.1 * item_weighting) + (0.9 * distance_weighting)
        console.log(`${key}:: ${val.weighting} 0.1x${item_weighting} and 0.9x${distance_weighting}`)
        kvp.push([val.weighting, key, val.items]);
    });

    // [weighting, store_id, { item_id, quantity - that are instore }[]]
    let weighted_vector = kvp.sort((a, b) => b[0] - a[0]);

    // [item_id, store_code, quantity][]
    const product_assignment: [string, string, number][] = [];

    // impl! If products need to be shipped from separate stores; i.e. 1 in two stores, need two, ship from both... product_map.filter(k => k.quantity !== 0).length > 0
    for(let i = 0; i < 2; i++) {
        console.log(weighted_vector, product_map.filter(k => k.quantity !== 0))

        weighted_vector = weighted_vector.map(e => {
            let arr = e[2];
    
            return [ e[0], e[1], arr.map(k => {
                const req = product_map.find(n => n.id == k.item_id)?.quantity ?? 0;
    
                if(req <= 0) k;

                console.log("Check", product_assignment.find(b => b[0] == k.item_id));
    
                if(k.quantity >= req && !(product_assignment.find(b => b[0] == k.item_id)?.[2] ?? 0 >= req)) {
                    product_assignment.push([ k.item_id, e[1], req ]);
                    product_map = product_map.map(n => n.id == k.item_id ? { ...n, quantity: 0 } : n)
                    
                    return { ...k, quantity: k.quantity - req }
                }else if(k.quantity > 0 && k.quantity < req && !(product_assignment.find(b => b[0] == k.item_id)?.[2] ?? 0 >= req)) {
                    product_assignment.push([ k.item_id, e[1], k.quantity ]);
                    product_map = product_map.map(n => n.id == k.item_id ? { ...n, quantity: n.quantity - k.quantity } : n)

                    return { ...k, quantity: 0 }
                }else {
                    return k
                }
            }) as { quantity: number; item_id: string; }[]]
        }); 

        console.log(weighted_vector, product_map.filter(k => k.quantity !== 0))
    }

    return product_assignment.map(e => {
        return {
            item: product_map.find(k => k.id == e[0]),
            store: e[1],
            alt_stores: product_map.find(k => k.id == e[0])?.variant_information.stock.filter(n => n.quantity.quantity_sellable >= e[2]) ?? [],
            ship: true,
            quantity: e[2]
        }
    });
}

export default DispatchMenu;