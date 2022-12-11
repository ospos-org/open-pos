import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { debounce, isEqual } from "lodash";

type KioskState = {
    customer: string | null,
    transaction_type: string | null,
    products: Order[] | null,
    order_total: number | null,
    payment: {
        payment_method: "cash" | "card" | string | null,
        fulfillment_date: string | null
    },
    order_date: string | null,
    order_notes: string[] | null,
    order_history: string[] | null,
    salesperson: string | null,
    till: string | null
};

type Order = {
    id: string,
    destination: string,
    origin: string,
    products: ProductPurchase[],
    status: OrderStatus[],
    status_history: (OrderStatus[])[],
    order_history: string[],
    order_notes: string[],
    reference: string,
    creation_date: string,
    discount: string
}

type ProductPurchase = {
    product_code: string,
    variant: string,
    discount: string,

    product_cost: number,
    quantity: number,
}

type OrderStatus = {
    status: "queued" | "transit" | "processing" | "in-store" | "fulfilled" | "failed" | string,
    assigned_products: string[]
}

type Product = {
    name: string,
    company: string,
    variant_groups: VariantCategory[],
    variants: VariantInformation[],
    sku: string,
    loyalty_discount: {
        Absolute?: string,
        Percentage?: string
    },
    images: string[],
    tags: string[],
    description: string,
    specifications: (string[])[]
}

type VariantInformation = {
    name: string,
    stock: StockInfo[],
    images: string[],
    marginal_price: number,
    /// The group codes for all sub-variants; i.e. is White, Short Sleeve and Small.
    variant_code: string[],
    order_history: string[],
    /// impl! Implement this type!
    stock_information: string
}

type VariantCategory = {
    category: string,
    variants: Variant[]
}

type StrictVariantCategory = {
    category: string,
    variant: Variant
}

type Variant = {
    name: string,
    stock: StockInfo[],
    images: string[],
    marginal_price: number,
    variant_code: string,
    order_history: string[],
    // impl! Flesh this type out correctly.
    stock_information: string
}

type StockInfo = {
    store: Store,
    quantity: Quantity
}

type Quantity = {
    quantity_on_hand: number,
    quantity_on_order: number,
    quantity_on_floor: number
}

type Store = {
    code: string,
    contact: string
}

export default function Kiosk(state: { master_state: {
    store_id: string
} }) {
    const [ kioskState, setKioskState ] = useState<KioskState>({
        customer: null,
        transaction_type: "OUT",
        products: [],
        order_total: null,
        payment: {
            payment_method: null,
            fulfillment_date: null
        },
        order_date: null,
        order_notes: null,
        order_history: null,
        salesperson: null,
        till: null
    });

    async function fetchData(searchTerm: string) {
        if(searchTerm == "") {
            setSearchTermState(searchTerm);
            return;
        }

        var myHeaders = new Headers();
        myHeaders.append("Cookie", `${document.cookie}`);

        setSearchTermState(searchTerm);

        const fetchResult = await fetch(`http://127.0.0.1:8000/product/name/${searchTerm}`, {
            method: "GET",
            headers: myHeaders,
            redirect: "follow",
            credentials: "include"
        });

        const data = await fetchResult.json();

        setResult(data);
    }

    const [ activeProduct, setActiveProduct ] = useState<Product | null>(null);
    const [ activeVariant, setActiveVariant ] = useState<StrictVariantCategory[] | null>(null);
    const [ activeVariantPossibilities, setActiveVariantPossibilities ] = useState<(StrictVariantCategory[] | null)[] | null>(null);

    const [ searchTermState, setSearchTermState ] = useState("");
    const [ result, setResult ] = useState([]);
    const [ searchFocused, setSearchFocused ] = useState(false); 

    const debouncedResults = useMemo(() => {
        return debounce(fetchData, 50);
    }, []);
    
    useEffect(() => {
        return () => {
            debouncedResults.cancel();
        };
    });

    return (
        <>
            <div className="flex flex-col justify-between h-screen min-h-screen flex-1">
                <div className="flex flex-col p-4 gap-4">
                    <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 ${searchFocused ? "border-2 border-blue-500" : "border-2 border-gray-700"}`}>
                        {
                            activeProduct && !searchFocused ?
                            <Image onClick={() => {
                                setActiveProduct(null);
                            }} width="20" height="20" src="/icons/arrow-narrow-left.svg" alt={''}></Image>
                            :
                            <Image width="20" height="20" src="/icons/search-sm.svg" alt={''}></Image>
                        }

                        <input placeholder="Search" className="bg-transparent focus:outline-none text-white flex-1" 
                            onChange={(e) => {
                                debouncedResults(e.target.value);
                            }}
                            onFocus={() => setSearchFocused(true)}
                            tabIndex={0}
                            // onBlur={() => setSearchFocused(false)}
                            onKeyDown={(e) => {
                                if(e.key == "Escape") {
                                    setSearchFocused(false)
                                    e.currentTarget.blur()
                                }
                            }}
                            />

                        {
                            searchFocused ? 
                            <Image width="20" height="20" src="/icons/x.svg" alt={''} onClick={() => setSearchFocused(false)}></Image>
                            :
                            <Image width="20" height="20" src="/icons/scan.svg" alt={''}></Image>
                        }
                    </div>
                    
                    {
                        searchFocused && (searchTermState !== "") ?
                            <div className="flex flex-1 flex-col flex-wrap gap-4 bg-gray-700 p-4 rounded-sm text-white">
                                {
                                    result.length == 0 ?
                                    <p className="self-center text-gray-400 py-6">No products with this name</p>
                                    :
                                    result.map((e: Product, indx) => {
                                        return (
                                            <div key={e.sku} className="flex flex-col overflow-hidden h-fit" onClick={() => {
                                                setActiveProduct(e);
                                                setSearchFocused(false);

                                                let vmap_list = [];

                                                for(let i = 0; i < e.variants.length; i++) {
                                                    let var_map = e.variants[i].variant_code.map(k => {
                                                        // Replace the variant code with the variant itself.
                                                        return e.variant_groups.map(c => {
                                                            let nc = c.variants.map(l => k == l.variant_code ? { category: c.category, variant: l } : false)
    
                                                            return nc.filter(l => l)
                                                        });
                                                    }).flat();
    
                                                    // Flat map of the first variant pair. 
                                                    let vlist: StrictVariantCategory[] = var_map.map(e => e.length > 0 ? e[0] : false).filter(e => e) as StrictVariantCategory[];
                                                    vmap_list.push(vlist);
                                                }

                                                setActiveVariantPossibilities(vmap_list);
                                                setActiveVariant(vmap_list[0]);
                                            }}>
                                                <div className="grid items-center gap-4" style={{ gridTemplateColumns: "50px 1fr 1fr 250px 150px" }}>
                                                    <Image height={50} width={50} alt="" src={e.images[0]} className="rounded-sm"></Image>
                                                    
                                                    <div className="flex flex-row items-center gap-2 max-w-[26rem] w-full flex-1">
                                                        <p>{e.company}</p>
                                                        <p>{e.name}</p>
                                                    </div>

                                                    <div className="flex flex-row items-center gap-2 flex-1 flex-wrap">
                                                        {
                                                            e.variant_groups.map(e => {
                                                                return (
                                                                    <div key={e.category} className="bg-gray-600 flex flex-row items-center py-1 px-2 rounded-md gap-2 max-h-fit">
                                                                        <p>{e.category}s </p>

                                                                        <div className="text-gray-300">
                                                                            {
                                                                                e.variants.map((k, i) => {
                                                                                    return (i == e.variants.length-1) ? k.name : (k.name+", ")
                                                                                })
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })
                                                        }
                                                    </div>

                                                    <div>
                                                        {
                                                            (() => {
                                                                let total_stock = e.variants.map(k => {
                                                                    return k.stock.map(b => {
                                                                        return b.quantity.quantity_on_hand;
                                                                    }).reduce(function (prev, curr) {
                                                                        return prev + curr
                                                                    }, 0);
                                                                }).reduce(function (prev, curr) {
                                                                    return prev + curr
                                                                }, 0);

                                                                let total_stock_in_store = e.variants.map(k => {
                                                                    return k.stock.map(b => {
                                                                        let total = 0;

                                                                        if(b.store.code == state.master_state.store_id) {
                                                                            total += b.quantity.quantity_on_hand;
                                                                        }

                                                                        return total;
                                                                    }).reduce(function (prev, curr) {
                                                                        return prev + curr
                                                                    }, 0);
                                                                }).reduce(function (prev, curr) {
                                                                    return prev + curr
                                                                }, 0);

                                                                return (
                                                                    <div className="flex flex-row items-center gap-1">
                                                                        <p>{total_stock_in_store} instore,</p>
                                                                        <p className="text-gray-400">{total_stock - total_stock_in_store} in other stores</p>
                                                                    </div>
                                                                )
                                                            })()
                                                        }
                                                    </div>

                                                    <div className="flex flex-row items-center px-2 font-medium">
                                                        {
                                                            (() => {
                                                                let flat_map = e.variants.map(k => 
                                                                    k.marginal_price
                                                                );
                                                                
                                                                let min_total = Math.min(...flat_map);
                                                                let max_total = Math.max(...flat_map);

                                                                if(max_total == min_total) {
                                                                    return (
                                                                        <p>${max_total.toFixed(2)}</p>
                                                                    )
                                                                }else {
                                                                    return (
                                                                        <p>${min_total.toFixed(2)}-{max_total.toFixed(2)}</p>
                                                                    )
                                                                }
                                                            })()
                                                        }
                                                    </div>
                                                </div>

                                                {
                                                    (indx == result.length-1) ? <></> : <hr className="mt-4 border-gray-500" />
                                                }
                                            </div>
                                        )
                                    })
                                }
                            </div>
                            :
                            activeProduct ? 
                                <div className="p-4 text-white flex flex-col gap-8  bg-opacity-50 rounded-sm">
                                    <div className="flex flex-row items-start gap-4">
                                        <Image src={activeProduct.images[0]} className="rounded-md" height={150} width={150} alt={activeProduct.name}></Image>
                                        <div className="flex flex-row items-start h-full justify-between flex-1">
                                            <div className="flex flex-col">
                                                <h2 className="text-xl font-medium">{activeProduct.name}</h2>
                                                <p className="text-gray-400">{activeProduct.company}</p>
                                                <br />

                                                <div className="flex flex-row items-center gap-4">
                                                    <p className="text-gray-400">SKU:</p>
                                                    <p>{activeProduct.sku}</p>
                                                </div>
                                                
                                                {(() => {
                                                    if(activeProduct.loyalty_discount.Absolute) {
                                                        return (
                                                            <div className="flex flex-row items-center gap-4">
                                                                <p className="text-gray-400">Loyalty Discount:</p>
                                                                <p>-${activeProduct.loyalty_discount.Absolute}</p>
                                                            </div>
                                                        )
                                                    }else {
                                                        return (
                                                            <div className="flex flex-row items-center gap-4">
                                                                <p className="text-gray-400">Loyalty Discount:</p>
                                                                <p>-%{activeProduct.loyalty_discount.Percentage}</p>
                                                            </div>
                                                        )
                                                    }
                                                })()}
                                                <br />
                                                {/* <p className="text-sm text-gray-300 truncate max-w-4">{activeProduct.description.substring(0, 150)+"..."}</p> */}
                                            </div>

                                            <div className="self-center flex flex-row items-center gap-4">
                                                <div className="flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit">
                                                    <Image width="25" height="25" src="/icons/plus-lge.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                                    <p className="font-medium">Add to cart</p>
                                                </div>

                                                <div className="flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit">
                                                    <Image width="25" height="25" src="/icons/search-sm.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                                    <p className="font-medium">Show Related Orders</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row items-start gap-8">
                                        <div className="flex flex-col gap-8">
                                            <div className="flex flex-col gap-4">
                                                {
                                                    activeProduct.variant_groups.map(e => {
                                                        return (
                                                            <div className="flex flex-col gap-2" key={e.category}>
                                                                <p className="text-sm text-gray-400">{e.category.toLocaleUpperCase()}</p>
                                                                <div className="flex flex-row items-center gap-2 select-none">
                                                                    {
                                                                        e.variants.map(k => {
                                                                            let match = activeVariant?.find(function(o) {
                                                                                return o.variant.variant_code == k.variant_code;
                                                                            });

                                                                            if(match) {
                                                                                return (
                                                                                    <p className="bg-gray-600 cursor-pointer text-white py-1 px-4 w-fit rounded-md" key={k.variant_code}>{k.name}</p>
                                                                                )
                                                                            }
                                                                            else {
                                                                                return (
                                                                                    <p onClick={() => {
                                                                                            let new_vlist: StrictVariantCategory[] = [];

                                                                                            activeVariant?.map(j => {
                                                                                                if(j.category == e.category) {
                                                                                                    new_vlist.push({
                                                                                                        category: j.category,
                                                                                                        variant: k
                                                                                                    })
                                                                                                }else {
                                                                                                    new_vlist.push(j)
                                                                                                }
                                                                                            })
                                                                                            
                                                                                            setActiveVariant(new_vlist)
                                                                                        }} className="bg-gray-600 hover:cursor-pointer text-gray-500 hover:text-gray-400 py-1 px-4 w-fit rounded-md" key={k.variant_code}>{k.name}</p>
                                                                                )
                                                                            }
                                                                        })
                                                                    }
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </div>
                                            
                                            <div className="flex flex-col items-start gap-2 w-fit">
                                                <p className="text-sm text-gray-400">Variant Cost</p>
                                                {/* As the price of a product is generated by the marginal increase from every variant, we must sum each variants prices to obtain the cost of the product with all variant codes applied. */}
                                                <p className="text-2xl font-semibold">${(() => {
                                                    let variant = activeProduct.variants?.find(b => {
                                                        let flat = b.variant_code;
                                                        let f2 = activeVariant?.map(e => e.variant.variant_code);

                                                        return isEqual(flat, f2)
                                                    });

                                                    return variant?.marginal_price
                                                })()
                                                }</p>
                                            </div>
                                        </div>

                                        <div className="w-full flex flex-col gap-2">
                                            <p className="text-sm text-gray-400">ALL VARIANTS</p>

                                            <div className="p-4 w-full bg-gray-700 rounded-md gap-2 flex flex-col">
                                                {
                                                    activeProduct.variants.map((e, indx) => {
                                                        let comparative_map = e.variant_code.map(b => {
                                                           return activeVariant?.find(c => c.variant.variant_code == b)
                                                        });

                                                        let filtered = comparative_map.filter(s => !s);
                                                        let active = filtered.length <= 0;

                                                        return (
                                                            <div key={e.variant_code.toString()} >
                                                                <div 
                                                                    onClick={() => {
                                                                        let variant = activeVariantPossibilities?.find(b => {
                                                                            let flat = b?.map(k => k.variant.variant_code);

                                                                            console.log(flat, e.variant_code);

                                                                            return isEqual(flat, e.variant_code)
                                                                        }) as StrictVariantCategory[];

                                                                        // console.log(variant);

                                                                        setActiveVariant(variant);
                                                                    }}
                                                                    className={`grid w-full px-[0.7rem] py-2 rounded-sm ${active ? "bg-gray-600" : ""}`} style={{ gridTemplateColumns: "1fr 100px 150px 50px" }}>
                                                                    <p className="flex-1 w-full">{e.name}</p>

                                                                    <p className="text-gray-300">{e.stock.find(e => e.store.code == state.master_state.store_id)?.quantity.quantity_on_hand ?? 0} Here</p>
                                                                    <p className="text-gray-300">
                                                                        {
                                                                            e.stock.map(e => (e.store.code == state.master_state.store_id) ? 0 : e.quantity.quantity_on_hand).reduce(function (prev, curr) { return prev + curr }, 0)
                                                                        } In other stores
                                                                    </p>
                                                                    <p >{e.marginal_price}</p>
                                                                </div>

                                                                {
                                                                    (indx == activeProduct.variants.length-1) ? <></> : <hr className="mt-2 border-gray-500" />
                                                                }
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    
                                </div>
                            :
                                <div className="flex flex-1 flex-row flex-wrap gap-4 ">
                                    {/* Tiles */}
                                    {
                                        kioskState.customer ? 
                                        <div className="flex flex-col justify-between gap-8 bg-[#4c2f2d] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit"
                                            onClick={() => setKioskState({
                                                ...kioskState,
                                                customer: null
                                            })}
                                        >
                                            <Image width="25" height="25" src="/icons/user-01.svg" style={{ filter: "invert(86%) sepia(34%) saturate(4038%) hue-rotate(295deg) brightness(88%) contrast(86%)" }} alt={''}></Image>
                                            <p className="font-medium select-none">Remove Customer</p>
                                        </div>
                                        :
                                        <div className="flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit" 
                                            onClick={() => setKioskState({
                                                ...kioskState,
                                                customer: "a"
                                            })}
                                        >
                                            <Image width="25" height="25" src="/icons/user-01.svg" style={{ filter: "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)" }} alt={''}></Image>
                                            <p className="font-medium select-none">Select Customer</p>
                                        </div>
                                    }
                                    
                                    <div className="flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit">
                                        <Image width="25" height="25" src="/icons/sale-03.svg" style={{ filter: "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)" }} alt={''}></Image>
                                        <p className="font-medium">Add Cart Discount</p>
                                    </div>
            
                                    <div className="flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit">
                                        <Image width="25" height="25" src="/icons/globe-05.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                        <p className="font-medium">Ship to Customer</p>
                                    </div>
            
                                    <div className="flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit">
                                        <Image width="25" height="25" src="/icons/file-plus-02.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                        <p className="font-medium">Add Note</p>
                                    </div>
            
                                    <div className="flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit">
                                        <Image width="25" height="25" src="/icons/building-02.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                        <p className="font-medium">Pickup from Store</p>
                                    </div>
            
                                    <div className="flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit">
                                        <Image width="25" height="25" src="/icons/save-01.svg" style={{ filter: "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)" }} alt={''}></Image>
                                        <p className="font-medium">Save Cart</p>
                                    </div>
                                </div>
                    }
                </div>
                
                <div className="flex flex-row items-center border-t-2 border-gray-600">
                    {/* Active Orders */}
                    <div className="flex flex-row items-center gap-4 p-4 text-white border-r-2 border-gray-600">
                        <div className="bg-fuchsia-100 text-black p-2 px-[0.7rem] rounded-md font-bold">LK</div>
                        <div className="flex flex-col">
                            <h3>Leslie K.</h3>
                            <div className="flex flex-row items-center gap-[0.2rem]">
                                <p className="text-sm">6 items</p>
                                <p className="text-gray-400 text-sm">&#8226; Kiosk 5</p>
                            </div>
                        </div>
                        <br />
                        <Image width="25" height="25" src="/icons/expand-04.svg" alt={''}></Image>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 min-w-[550px] max-w-[550px] p-6">
                <div className="flex flex-col gap-4">
                    {/* Order Information */}
                    <div className="flex flex-row items-center justify-between">
                        <div className="text-white">
                            <h2 className="font-semibold text-lg">Carl Sagan</h2>
                            <p className="text-sm text-gray-400">3 items</p>
                        </div>

                        <div className="flex flex-row items-center gap-[0.75rem] bg-gray-700 p-2 px-4 rounded-md">
                            <p className="text-white">Clear Cart</p>
                            {/* <Image style={{ filter: "invert(100%) sepia(12%) saturate(7454%) hue-rotate(282deg) brightness(112%) contrast(114%)" }} width="25" height="25" src="/icons/x-square.svg" alt={''}></Image> */}
                        </div>
                    </div>
                    

                    <hr className="border-gray-400 opacity-25"/>

                    <div className="text-white">
                        <div className="flex flex-row items-center gap-4">
                            <div className="relative">
                                <Image height={60} width={60} quality={100} alt="Torq Surfboard" className="rounded-sm" src="https://www.torpedo7.co.nz/images/products/F1S8DN512XX_zoom---2017-surfboard-6ft-6in-fish---white.jpg?v=81b1f5068df74b648797"></Image>

                                <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[30px] min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">2</div>
                            </div>

                            <div className="flex flex-col gap-2 items-center justify-center">
                                <Image width="15" height="15" src="/icons/arrow-block-up.svg" alt={''} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(288deg) brightness(102%) contrast(102%)" }} ></Image>
                                <Image width="15" height="15" src="/icons/arrow-block-down.svg" alt={''} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(288deg) brightness(102%) contrast(102%)" }}></Image>
                            </div>
                            
                            <div className="flex-1">
                                <p className="font-semibold">Torq Surfboard</p>
                                <p className="text-sm text-gray-400">White, 6{'\"'}6{'\''}</p>
                            </div>

                            <div>
                                <Image style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }} height={20} width={20} alt="Discount" className="rounded-sm hover:cursor-pointer" src="/icons/sale-03.svg" 
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.filter = "invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.filter = "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
                                    }}
                                ></Image>
                            </div>

                            <div className="min-w-[75px]">
                                <p className="">$1539.98</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-white">
                        <div className="flex flex-row items-center gap-4">
                            <div className="relative">
                                <Image height={60} width={60} quality={100} alt="Torq Surfboard" className="rounded-sm" src="https://www.torpedo7.co.nz/images/products/3YBMHN2ABEL_zoom---2022-marlin-5-mtb-lithium-grey.jpg?v=845eb9a5288642009c05"></Image>

                                <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[30px] min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">1</div>
                            </div>
                            
                            <div className="flex-1">
                                <p className="font-semibold">Trek 2023 Marlin 5 Gen 2 MTB</p>
                                <p className="text-sm text-gray-400">Lithium Grey, Small</p>
                            </div>

                            <div>
                                <Image style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }} height={20} width={20} alt="Discount" className="rounded-sm hover:cursor-pointer" src="/icons/sale-03.svg" 
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.filter = "invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.filter = "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
                                    }}
                                ></Image>
                            </div>

                            <div className="min-w-[75px]">
                                <p className="">$999.00</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-white">
                        <div className="flex flex-row items-center gap-4">
                            <div className="relative">
                                <Image height={60} width={60} quality={100} alt="Torq Surfboard" className="rounded-sm" src="https://www.torpedo7.co.nz/images/products/T7RTF20E2C4_zoom---discovery-12-person-tent-ink-grey.jpg?v=845eb9a5288642009c05"></Image>

                                <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[30px] min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">1</div>
                            </div>
                            
                            <div className="flex-1">
                                <p className="font-semibold">Torpedo7 Discovery</p>
                                <p className="text-sm text-gray-400">Ink/Grey, 12 Person</p>
                            </div>

                            <div>
                                <Image style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }} height={20} width={20} alt="Discount" className="rounded-sm hover:cursor-pointer" src="/icons/sale-03.svg" 
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.filter = "invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.filter = "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
                                    }}
                                ></Image>
                            </div>

                            <div className="min-w-[75px]">
                                <p className="">$1,119.99</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-white">
                        <div className="flex flex-row items-center gap-4">
                            <div className="relative">
                                <Image height={60} width={60} quality={100} alt="Torq Surfboard" className="rounded-sm" src="https://www.torpedo7.co.nz/images/products/T7TEO23YDHS_zoom---men-s-ecopulse-short-sleeve-explore-graphic-t-shirts-hot-sauce.jpg?v=845eb9a5288642009c05"></Image>

                                <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[30px] min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">1</div>
                            </div>
                            
                            <div className="flex-1">
                                <p className="font-semibold">Torpedo7 Men{'\''}s Ecopulse</p>
                                <p className="text-sm text-gray-400">Short Sleeve, Explore Graphic, Small, Hot Sauce</p>
                            </div>

                            <div>
                                <Image style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }} height={20} width={20} alt="Discount" className="rounded-sm hover:cursor-pointer" src="/icons/sale-03.svg" 
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.filter = "invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.filter = "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
                                    }}
                                ></Image>
                            </div>

                            <div className="min-w-[75px]">
                                <p className="">$1,119.99</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}