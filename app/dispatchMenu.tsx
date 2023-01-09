import { debounce } from "lodash";
import Image from "next/image";
import { FC, useEffect, useState } from "react";
import { v4 } from "uuid";
import { ContactInformation, Customer, Employee, Order, ProductPurchase, VariantInformation } from "./stock-types";

const DispatchMenu: FC<{ orderJob: [ Order[], Function ], customerJob: [ Customer | null, Function ], setPadState: Function }> = ({ orderJob, customerJob, setPadState }) => {
    const [ orderState, setOrderState ] = orderJob;
    const [ customerState, setCustomerState ] = customerJob;

    const [ error, setError ] = useState<string | null>(null);
    const [ selectedItems, setSelectedItems ] = useState<[string, boolean][]>([]);
    const [ pageState, setPageState ] = useState<"origin" | "rate" | "edit">("origin");
    const [ generatedOrder, setGeneratedOrder ] = useState<{ item: ProductPurchase | undefined, store: string }[]>([]);

    useEffect(() => {
        fetchDistanceData().then(data => {
            setGeneratedOrder(generateOrders(generateProductMap(orderState), data));
        });

        setSelectedItems(generatedOrder.map(e => [ e.item?.id ?? "", false ]))
    }, [orderState])

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

                                            <div className="grid items-center justify-center text-gray-300 gap-4 " style={{ gridTemplateColumns: "1fr 75px 120px" }}>
                                                <p className="font-semibold flex-1">Product</p>
                                                <p className="font-semibold content-center self-center flex">Quantity</p>
                                                <p className="font-semibold content-center self-center flex">Source Store</p>
                                            </div>

                                            {
                                                generatedOrder.map(k => {
                                                    return (
                                                        <div key={`PPURCH-SHIP-${k.item?.id}`} id={`PPURCH-SHIP-${k.item?.id}`} className="text-white grid items-center justify-center gap-4" style={{ gridTemplateColumns: "1fr 75px 120px" }}>
                                                            <div className="flex-1">
                                                                <p className="font-semibold">{k.item?.product.company} {k.item?.product.name}</p>
                                                                <p className="text-sm text-gray-400">{k.item?.variant_information.name}</p>
                                                            </div>

                                                            <p className="self-center content-center items-center justify-center flex">{k.item?.quantity}</p>
                                                            <div className={`relative inline-block ${selectedItems.find(b => b[0] == k.item?.id)?.[1] ? "z-50" : ""}`}>
                                                                <p 
                                                                onClick={() => {
                                                                    setSelectedItems(selectedItems.map(b => b[0] == k.item?.id ? [b[0], true] : b))
                                                                }}
                                                                className="self-center cursor-pointer content-center items-center justify-center font-semibold flex">{k.store}</p>
                                                                <div className={selectedItems.find(b => b[0] == k.item?.id)?.[1] ? "absolute flex flex-col gap-2 items-center justify-center w-full bg-gray-600 rounded-md mt-2 z-50" : "hidden absolute"}>
                                                                    {

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
                                                setPageState("rate");
                                            }}
                                            className={`${true ? "bg-blue-700 cursor-pointer" : "bg-blue-700 bg-opacity-10 opacity-20"} w-full rounded-md p-4 flex items-center justify-center`}>
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
                                        onClick={() => {
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

                                                console.log(k, found, inverse_order)
                                            })

                                            console.log(inverse_order);

                                            let job = orderJob[0];

                                            inverse_order.map(k => {
                                                const new_order: Order = {
                                                    id: v4(),
                                                    destination: {
                                                        code: "000",
                                                        contact: customerState?.contact!
                                                    },
                                                    origin: {
                                                        code: k.store,
                                                        contact: {
                                                            name: "",
                                                            mobile: {
                                                                region_code: "",
                                                                root: ""
                                                            },
                                                            email: {
                                                                root: "",
                                                                domain: "",
                                                                full: ""
                                                            },
                                                            landline: "",
                                                            address: {
                                                                street: "",
                                                                street2: "",
                                                                city: "",
                                                                country: "",
                                                                po_code: ""
                                                            }
                                                        }
                                                    },
                                                    products: k.items,
                                                    status: [],
                                                    status_history: [],
                                                    order_history: [],
                                                    order_notes: [],
                                                    reference: "",
                                                    creation_date: "",
                                                    discount: "a|0",
                                                    order_type: "shipment"
                                                };

                                                job.push(new_order);
                                                job = job.filter(k => k.order_type != "direct")
                                            })

                                            orderJob[1](job);
                                            setPadState("cart")
                                        }}
                                        className={`${true ? "bg-blue-700 cursor-pointer" : "bg-blue-700 bg-opacity-10 opacity-20"} w-full rounded-md p-4 flex items-center justify-center`}>
                                        <p className={`text-white font-semibold ${""}`}>Complete</p>
                                    </div>
                                </>
                            )
                        case "edit":
                            return (
                                <div className="flex flex-col gap-8 flex-1">
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
                                    
                                    <div className="flex flex-col gap-2">
                                        <p className="text-white font-semibold">Shipping Details</p>
                                        
                                        <div className="flex flex-col gap-1">
                                            <p className="text-gray-400">Street</p>
                                            <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                <input 
                                                    placeholder="Address Line 1" defaultValue={customerState?.contact.address.street} className="bg-transparent focus:outline-none text-white flex-1" 
                                                    onChange={(e) => {
                                                        if(customerState)
                                                            setCustomerState({
                                                                ...customerState,
                                                                contact: {
                                                                    ...customerState.contact,
                                                                    address: {
                                                                        ...customerState.contact.address,
                                                                        street: e.target.value
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
                                            <p className="text-gray-400">Suburb</p>
                                            <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                <input 
                                                    placeholder="Address Line 2" defaultValue={customerState?.contact.address.street2} className="bg-transparent focus:outline-none text-white flex-1" 
                                                    onChange={(e) => {
                                                        if(customerState)
                                                            setCustomerState({
                                                                ...customerState,
                                                                contact: {
                                                                    ...customerState.contact,
                                                                    address: {
                                                                        ...customerState.contact.address,
                                                                        street2: e.target.value
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
                                            <p className="text-gray-400">City</p>
                                            <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                <input 
                                                    placeholder="City" defaultValue={customerState?.contact.address.city} className="bg-transparent focus:outline-none text-white flex-1" 
                                                    onChange={(e) => {
                                                        if(customerState)
                                                            setCustomerState({
                                                                ...customerState,
                                                                contact: {
                                                                    ...customerState.contact,
                                                                    address: {
                                                                        ...customerState.contact.address,
                                                                        city: e.target.value
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
                                            <p className="text-gray-400">Postal Code</p>
                                            <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                <input 
                                                    placeholder="Postal Code" defaultValue={customerState?.contact.address.po_code} className="bg-transparent focus:outline-none text-white flex-1" 
                                                    onChange={(e) => {
                                                        if(customerState)
                                                            setCustomerState({
                                                                ...customerState,
                                                                contact: {
                                                                    ...customerState.contact,
                                                                    address: {
                                                                        ...customerState.contact.address,
                                                                        po_code: e.target.value
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
                                    
                                    <div className="flex flex-1 h-full">
                                        <div className="flex flex-row items-center gap-4 bg-red-300 rounded-md px-3 py-2">
                                            <p className="text-red-400">{error}</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => {
                                            fetch(`http://127.0.0.1:8000/customer/contact/${customerState?.id}`, {
                                                method: "POST",
                                                body: JSON.stringify(customerState?.contact),
                                                credentials: "include",
                                                redirect: "follow"
                                            })?.then(async e => {
                                                const data = await e.json();

                                                if(e.ok) {
                                                    fetchDistanceData().then(data => {
                                                        setGeneratedOrder(generateOrders(generateProductMap(orderState), data));
                                                    });

                                                    setError(null);
                                                    setPageState("origin");
                                                }else {
                                                    setError("Malformed Street Address")
                                                }
                                            })
                                        }}
                                        className={`${true ? "bg-blue-700 cursor-pointer" : "bg-blue-700 bg-opacity-10 opacity-20"} w-full rounded-md p-4 flex items-center justify-center`}>
                                        <p className={`text-white font-semibold ${""}`}>Save</p>
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
        orders[i].products.map(e => {
            pdt_map.push(e)
        })
    }

    return pdt_map;
}

function generateOrders(product_map: ProductPurchase[], distance_data: { store_id: string, store_code: string, distance: number }[]): { item: ProductPurchase | undefined, store: string }[] {
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

        // console.log(key, ":", smallest_distance, "/", distance_data.find(k => k.store_code == key)?.distance, "=", distance_weighting)

        val.weighting = (0.1 * item_weighting) + (0.9 * distance_weighting)
        console.log(`${key}:: ${val.weighting} 0.1x${item_weighting} and 0.9x${distance_weighting}`)
        kvp.push([val.weighting, key, val.items]);
    });

    const weighted_vector = kvp.sort((a, b) => b[0] - a[0]);
    const product_assignment: [string, string][] = [];

    // impl! If products need to be shipped from separate stores; i.e. 1 in two stores, need two, ship from both...

    weighted_vector.map(e => {
        e[2].map(k => {
            const req = product_map.find(n => n.id == k.item_id)?.quantity ?? 0;

            if(k.quantity >= req && !(product_assignment.find(b => b[0] == k.item_id))) {
                product_assignment.push([ k.item_id, e[1] ])
            }
        })
    });

    return product_assignment.map(e => {
        return {
            item: product_map.find(k => k.id == e[0]),
            store: e[1],
            alt_stores: []
        }
    });
}

export default DispatchMenu;