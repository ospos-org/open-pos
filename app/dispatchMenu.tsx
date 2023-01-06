import Image from "next/image";
import { join } from "path";
import { FC, useEffect, useState } from "react";
import { v4 } from "uuid";
import { applyDiscount, findMaxDiscount } from "./discount_helpers";
import { Customer, Order, ProductPurchase, VariantInformation } from "./stock-types";

const DispatchMenu: FC<{ orderJob: [ Order[], Function ], customerJob: [ Customer | null, Function ], setPadState: Function }> = ({ orderJob, customerJob, setPadState }) => {
    const [ orderState, setOrderState ] = orderJob;
    const [ customerState, setCustomerState ] = customerJob;
    
    const [ selectedItems, setSelectedItems ] = useState<string[]>([]);
    const [ editFields, setEditFields ] = useState(false);
    const [ pageState, setPageState ] = useState<"origin" | "rate">("origin");
    const [ generatedOrder, setGeneratedOrder ] = useState<{ item: ProductPurchase | undefined, store: string }[]>(generateOrders(generateProductMap(orderState)));

    useEffect(() => {
        setGeneratedOrder(generateOrders(generateProductMap(orderState)));
    }, [orderState])

    return (
        <div className="flex flex-col flex-1 gap-8 h-full max-h-fit overflow-hidden">
            {
                (() => {
                    switch(pageState) {
                        case "origin":
                            return (
                                <>
                                    <div className="flex flex-row items-center gap-4 self-center text-white w-full">
                                        <p className="">Overview</p>
                                        <hr className="flex-1 border-gray-800 h-[3px] border-[2px] bg-gray-800 rounded-md" />
                                        <p className="text-gray-600">Shipping Rate</p>
                                    </div>

                                    <div className="flex-col flex gap-8 flex-1 overflow-y-scroll max-h-full pr-2">
                                        <div className="flex flex-1 flex-col gap-4">
                                            <div className="flex flex-row items-center gap-2 text-gray-400">
                                                <p>PRODUCTS</p>
                                                <hr className="border-gray-400 opacity-25 w-full flex-1"/>
                                            </div>

                                            <div className="grid items-center justify-center text-gray-300 gap-4 " style={{ gridTemplateColumns: "1fr 75px 50px" }}>
                                                <p className="font-semibold flex-1">Product</p>
                                                <p className="font-semibold content-center self-center flex">Quantity</p>
                                                <p className="font-semibold content-center self-center flex">Store</p>
                                            </div>

                                            {
                                                generatedOrder.map(k => {
                                                    return (
                                                        <div key={`PPURCH-SHIP-${k.item?.id}`} className="text-white grid items-center justify-center gap-4" style={{ gridTemplateColumns: "1fr 75px 50px" }}>
                                                            <div className="flex-1">
                                                                <p className="font-semibold">{k.item?.product.company} {k.item?.product.name}</p>
                                                                <p className="text-sm text-gray-400">{k.item?.variant_information.name}</p>
                                                            </div>

                                                            <p className="self-center content-center items-center justify-center flex">{k.item?.quantity}</p>
                                                            <p className="self-center content-center items-center justify-center font-semibold flex">{k.store}</p>
                                                        </div>
                                                    )
                                                })
                                            }
                                        </div>
                                        
                                        <div className="flex flex-1 flex-col gap-4">
                                            <div className="flex flex-row items-center gap-2 text-gray-400">
                                                <p>SHIPPING DETAILS</p>
                                                <Image 
                                                    onClick={() => setEditFields(!editFields)}
                                                    src="/icons/edit-03.svg" alt="" width="16" height="16" style={{ filter: "invert(65%) sepia(9%) saturate(354%) hue-rotate(179deg) brightness(99%) contrast(92%)" }} />
                                                <hr className="border-gray-400 opacity-25 w-full flex-1"/>
                                            </div>

                                            {
                                                editFields ?
                                                (

                                                    <>
                                                        <div className="flex flex-col gap-4">
                                                            <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                                <input 
                                                                    placeholder="Customer Name" className="bg-transparent focus:outline-none text-white flex-1" 
                                                                    onChange={(e) => {
                                                                    }}
                                                                    onFocus={(e) => {
                                                                    }}
                                                                    tabIndex={0}
                                                                    // onBlur={() => setSearchFocused(false)}
                                                                    onKeyDown={(e) => {
                                                                    }}
                                                                    />
                                                            </div>
                                                            
                                                            <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                                <input 
                                                                    placeholder="Address Line 1" className="bg-transparent focus:outline-none text-white flex-1" 
                                                                    onChange={(e) => {
                                                                    }}
                                                                    onFocus={(e) => {
                                                                    }}
                                                                    tabIndex={0}
                                                                    // onBlur={() => setSearchFocused(false)}
                                                                    onKeyDown={(e) => {
                                                                    }}
                                                                    />
                                                            </div>

                                                            <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                                <input 
                                                                    placeholder="Address Line 2" className="bg-transparent focus:outline-none text-white flex-1" 
                                                                    onChange={(e) => {
                                                                    }}
                                                                    onFocus={(e) => {
                                                                    }}
                                                                    tabIndex={0}
                                                                    // onBlur={() => setSearchFocused(false)}
                                                                    onKeyDown={(e) => {
                                                                    }}
                                                                    />
                                                            </div>

                                                            <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                                <input 
                                                                    placeholder="Suburb" className="bg-transparent focus:outline-none text-white flex-1" 
                                                                    onChange={(e) => {
                                                                    }}
                                                                    onFocus={(e) => {
                                                                    }}
                                                                    tabIndex={0}
                                                                    // onBlur={() => setSearchFocused(false)}
                                                                    onKeyDown={(e) => {
                                                                    }}
                                                                    />
                                                            </div>

                                                            <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                                <input 
                                                                    placeholder="City" className="bg-transparent focus:outline-none text-white flex-1" 
                                                                    onChange={(e) => {
                                                                    }}
                                                                    onFocus={(e) => {
                                                                    }}
                                                                    tabIndex={0}
                                                                    // onBlur={() => setSearchFocused(false)}
                                                                    onKeyDown={(e) => {
                                                                    }}
                                                                    />
                                                            </div>

                                                            <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                                <input 
                                                                    placeholder="Postal Code" className="bg-transparent focus:outline-none text-white flex-1" 
                                                                    onChange={(e) => {
                                                                    }}
                                                                    onFocus={(e) => {
                                                                    }}
                                                                    tabIndex={0}
                                                                    // onBlur={() => setSearchFocused(false)}
                                                                    onKeyDown={(e) => {
                                                                    }}
                                                                    />
                                                            </div>

                                                            <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                                <input 
                                                                    placeholder="Phone Number" className="bg-transparent focus:outline-none text-white flex-1" 
                                                                    onChange={(e) => {
                                                                    }}
                                                                    onFocus={(e) => {
                                                                    }}
                                                                    tabIndex={0}
                                                                    // onBlur={() => setSearchFocused(false)}
                                                                    onKeyDown={(e) => {
                                                                    }}
                                                                    />
                                                            </div>

                                                            <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                                                <input 
                                                                    placeholder="Email Address" className="bg-transparent focus:outline-none text-white flex-1" 
                                                                    onChange={(e) => {
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
                                                    </>
                                                )
                                                :
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
                                            }
                                            
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
                                    <div className="flex flex-row items-center gap-4 self-center text-white w-full">
                                        <p className="cursor-pointer" onClick={() => setPageState("origin")}>Overview</p>
                                        <hr className="flex-1 border-gray-400 h-[3px] border-[2px] bg-gray-400 rounded-md" />
                                        <p>Shipping Rate</p>
                                    </div>

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
                    }
                })()
            }

            
            
            {/* <div className="flex flex-col">
                <div className="flex flex-row items-center gap-2">
                    <p className="text-gray-400">ADDRESS</p>
                    <Image 
                        onClick={() => {

                        }}
                        height={18} width={18} quality={100} alt="Edit Address" className="rounded-sm cursor-pointer" src="/icons/edit-03.svg" style={{ filter: "invert(46%) sepia(7%) saturate(675%) hue-rotate(182deg) brightness(94%) contrast(93%)" }}></Image>
                </div>

                <div className="text-white">
                    <p>{customerState?.contact.address.street}</p>
                    <p>{customerState?.contact.address.street2}</p>
                    <p>{customerState?.contact.address.city} {customerState?.contact.address.po_code}</p>
                    <p>{customerState?.contact.address.country}</p>
                </div>
            </div> */}
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

function generateOrders(product_map: ProductPurchase[]): { item: ProductPurchase | undefined, store: string }[] {
    /// 1. Determine the best location for each product.
    /// 2. Ensure as many products are in the same location as possible.
    /// 3. Ensure it is close to the destination.

    /// Create a reverse map of all products to store relations...
    /// Generate a valid list of store options
    /// => Sort by closeness
    /// => Give to user

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
        val.weighting = val.items.reduce((p, e) => {
            const n = e.quantity - (product_map.find(k => k.id == e.item_id)?.quantity ?? 0);
            return p += n;
        }, 0) / total_items;

        kvp.push([val.weighting, key, val.items]);
    });

    const weighted_vector = kvp.sort((a, b) => b[0] - a[0]);
    const product_assignment: [string, string][] = [];

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
            store: e[1]
        }
    });
}

export default DispatchMenu;