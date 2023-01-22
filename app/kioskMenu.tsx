import { isEqual } from "lodash";
import Image from "next/image";
import { RefObject } from "react";
import { v4 } from "uuid";
import { isValidVariant } from "./discount_helpers";
import { getDate, sortOrders } from "./kiosk";
import PromotionList from "./promotionList";
import { ContactInformation, Customer, Employee, Order, Product, StrictVariantCategory, VariantInformation } from "./stock-types";

export default function KioskMenu({
    setSearchFocused, searchFocused,
    setActiveProduct, activeProduct,
    setSearchType, searchType,
    setCustomerState, customerState,
    setOrderState, orderState,
    setSearchTermState, searchTermState,
    setActiveVariantPossibilities, activeVariantPossibilities,
    setActiveVariant, activeVariant,
    setPadState,
    setDiscount,
    setActiveProductVariant, activeProductVariant,
    setResult, result,
    input_ref, master_state,
    addToCart,
    debouncedResults
}: {
    setSearchFocused: Function, searchFocused: boolean
    setActiveProduct: Function, activeProduct: Product | null,
    setSearchType: Function, searchType: "customer" | "product" | "transaction",
    setSearchTermState: Function, searchTermState: string,
    setCustomerState: Function, customerState: Customer | null,
    setResult: Function, result: Product[] | Customer[] | Order[],
    setOrderState: Function, orderState: Order[],
    setActiveVariantPossibilities: Function, activeVariantPossibilities: (StrictVariantCategory[] | null)[] | null,
    setPadState: Function,
    setDiscount: Function,
    setActiveVariant: Function, activeVariant: StrictVariantCategory[] | null,
    setActiveProductVariant: Function, activeProductVariant: VariantInformation | null
    input_ref: RefObject<HTMLInputElement>,
    master_state: {
        store_id: string,
        employee: Employee | null | undefined,
        store_contact: ContactInformation,
        kiosk: string
    },
    addToCart: Function,
    debouncedResults: Function
}) {
    return (
        <div className="flex flex-col justify-between h-[calc(100vh-18px)] max-h-[calc(100vh-18px)] min-h-[calc(100vh-18px)] overflow-hidden flex-1" onKeyDownCapture={(e) => {
            if(e.key == "Escape") setSearchFocused(false)
        }}>
            <div className="flex flex-col p-4 gap-4">
                <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 ${searchFocused ? "border-2 border-blue-500" : "border-2 border-gray-700"}`}>
                    {
                        activeProduct || searchFocused ?
                        <Image onClick={() => {
                            setActiveProduct(null);
                            setSearchFocused(false);
                        }} width="20" height="20" src="/icons/arrow-narrow-left.svg" className="select-none cursor-pointer" alt={''} draggable={false} />
                        :
                        <Image width="20" height="20" src="/icons/search-sm.svg" className="select-none" alt={''} draggable={false}></Image>
                    }

                    <input 
                        ref={input_ref}
                        placeholder={`Search for ${searchType}`} className="bg-transparent focus:outline-none text-white flex-1" 
                        onChange={(e) => {
                            debouncedResults(e.target.value, searchType);
                        }}
                        onFocus={(e) => {
                            setSearchFocused(true)
                            debouncedResults(e.target.value, searchType);
                        }}
                        tabIndex={0}
                        // onBlur={() => setSearchFocused(false)}
                        onKeyDown={(e) => {
                            if(e.key == "Escape") {
                                e.preventDefault();
                                setSearchFocused(false)
                                e.currentTarget.blur()
                            }
                        }}
                        />

                    <div className="flex flex-row items-center gap-2 bg-gray-600 px-1 py-1 rounded-md">
                        <Image draggable={false} onClick={() => { 
                            setResult([]); 
                            setSearchType("product");  

                            input_ref.current?.value ? input_ref.current.value = "" : {};
                            input_ref.current?.focus()
                        }} className="cursor-pointer" width="20" height="20" src="/icons/cube-01-filled.svg" alt={''} style={{ filter: searchType == "product" ? "invert(100%) sepia(0%) saturate(7441%) hue-rotate(38deg) brightness(112%) contrast(111%)" : "invert(58%) sepia(32%) saturate(152%) hue-rotate(176deg) brightness(91%) contrast(87%)" }}></Image>   
                        <Image draggable={false} onClick={() => { 
                            setResult([]); 
                            setSearchType("customer");    

                            input_ref.current?.value ? input_ref.current.value = "" : {};
                            input_ref.current?.focus()
                        }} className="cursor-pointer" width="20" height="20" src="/icons/user-01.svg" alt={''} style={{ filter: searchType == "customer" ? "invert(100%) sepia(0%) saturate(7441%) hue-rotate(38deg) brightness(112%) contrast(111%)" : "invert(58%) sepia(32%) saturate(152%) hue-rotate(176deg) brightness(91%) contrast(87%)" }}></Image>    
                        <Image draggable={false} onClick={() => { 
                            setResult([]); 
                            setSearchType("transaction"); 
                            
                            input_ref.current?.value ? input_ref.current.value = "" : {};
                            input_ref.current?.focus()
                        }} className="cursor-pointer" width="20" height="20" src="/icons/receipt-check-filled.svg" alt={''} style={{ filter: searchType == "transaction" ? "invert(100%) sepia(0%) saturate(7441%) hue-rotate(38deg) brightness(112%) contrast(111%)" : "invert(58%) sepia(32%) saturate(152%) hue-rotate(176deg) brightness(91%) contrast(87%)" }}></Image>    
                    </div>
                    
                    {
                        searchFocused ? 
                        <Image width="20" height="20" src="/icons/x.svg" alt={''} draggable={false} onClick={() => setSearchFocused(false)}></Image>
                        :
                        <Image width="20" height="20" src="/icons/scan.svg" draggable={false} alt={''}></Image>
                    }
                </div>
                
                {
                    searchFocused && (searchTermState !== "") ?
                        <div className="flex flex-1 flex-col flex-wrap gap-2 bg-gray-700 rounded-sm text-white overflow-hidden">
                            {
                                (() => {
                                    switch(searchType) {
                                        case "product":
                                            return (
                                                result.length == 0 ?
                                                    <p className="self-center text-gray-400 py-6">No products with this name</p>
                                                    :
                                                    (result as Product[]).map((e: Product, indx) => {
                                                        return (
                                                            <div key={e.sku} className="flex flex-col overflow-hidden h-fit" onClick={() => {
                                                                setActiveProduct(e);
                                                                setSearchFocused(false);

                                                                let vmap_list = [];

                                                                for(let i = 0; i < e.variants.length; i++) {
                                                                    const var_map = e.variants[i].variant_code.map(k => {
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
                                                                setActiveProductVariant(e.variants[0]);
                                                            }}>
                                                                <div className="grid items-center gap-4 p-4 hover:bg-gray-400 hover:bg-opacity-10 cursor-pointer" style={{ gridTemplateColumns: "50px minmax(200px, 1fr) minmax(300px, 2fr) 250px 125px" }}>
                                                                    <Image height={50} width={50} alt="" src={e.images[0]} className="rounded-sm"></Image>
                                                                    
                                                                    <div className="flex flex-col gap-0 max-w-[26rem] w-full flex-1">
                                                                        <p>{e.name}</p>
                                                                        <p className="text-sm text-gray-400">{e.company}</p>
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

                                                                    <div className="flex-1">
                                                                        {
                                                                            (() => {
                                                                                const total_stock = e.variants.map(k => {
                                                                                    return k.stock.map(b => {
                                                                                        return (b.quantity.quantity_sellable);
                                                                                    }).reduce(function (prev, curr) {
                                                                                        return prev + curr
                                                                                    }, 0);
                                                                                }).reduce(function (prev, curr) {
                                                                                    return prev + curr
                                                                                }, 0);

                                                                                const total_stock_in_store = e.variants.map(k => {
                                                                                    return k.stock.map(b => {
                                                                                        let total = 0;

                                                                                        if(b.store.code == master_state.store_id) {
                                                                                            total += (b.quantity.quantity_sellable);
                                                                                        }

                                                                                        return total;
                                                                                    }).reduce(function (prev, curr) {
                                                                                        return prev + curr
                                                                                    }, 0);
                                                                                }).reduce(function (prev, curr) {
                                                                                    return prev + curr
                                                                                }, 0);

                                                                                return (
                                                                                    <div className="flex flex-row items-center gap-2">
                                                                                        {
                                                                                            total_stock_in_store <= 0 ? 
                                                                                            <p className="text-red-300 font-semibold">Out of stock</p>
                                                                                            :
                                                                                            <p>{total_stock_in_store} instore,</p>
                                                                                        }

                                                                                        <p className="text-gray-400">{total_stock - total_stock_in_store} in other stores</p>
                                                                                    </div>
                                                                                )
                                                                            })()
                                                                        }
                                                                    </div>

                                                                    <div className="flex flex-row items-center px-2 font-medium">
                                                                        {
                                                                            (() => {
                                                                                const flat_map = e.variants.map(k => 
                                                                                    k.retail_price
                                                                                );
                                                                                
                                                                                const min_total = Math.min(...flat_map);
                                                                                const max_total = Math.max(...flat_map);

                                                                                if(max_total == min_total) {
                                                                                    return (
                                                                                        <p>${(max_total * 1.15).toFixed(2)}</p>
                                                                                    )
                                                                                }else {
                                                                                    return (
                                                                                        <p>${(min_total * 1.15).toFixed(2)}-{(max_total * 1.15).toFixed(2)}</p>
                                                                                    )
                                                                                }
                                                                            })()
                                                                        }
                                                                    </div>
                                                                </div>

                                                                {
                                                                    (indx == result.length-1) ? <></> : <hr className="mt-2 border-gray-500" />
                                                                }
                                                            </div>
                                                        )
                                                    })
                                            )
                                        case "customer":
                                            return (
                                                result.length == 0 ?
                                                    <p className="self-center text-gray-400 py-6">No customers with this name</p>
                                                    :
                                                    (result as Customer[]).map((e: Customer, indx) => {
                                                        return (
                                                            <div 
                                                                key={`CUSTOMER-${e.id}`} className="flex flex-col overflow-hidden h-fit"
                                                                
                                                                >
                                                                <div className="select-none grid items-center gap-4 p-4 hover:bg-gray-400 hover:bg-opacity-10 cursor-pointer" style={{ gridTemplateColumns: "200px 1fr 100px 150px" }}>
                                                                    <div className="flex flex-col gap-0 max-w-[26rem] w-full flex-1">
                                                                        <p>{e.name}</p>
                                                                        <p className="text-sm text-gray-400">{e.order_history.length} Past Orders</p>
                                                                    </div>

                                                                    <div className="flex flex-row items-center gap-4">
                                                                        <p>({e.contact.mobile.region_code}) {
                                                                            (() => {
                                                                                const k = e.contact.mobile.root.match(/^(\d{3})(\d{3})(\d{4})$/);
                                                                                if(!k) return ""
                                                                                return `${k[1]} ${k[2]} ${k[3]}`
                                                                            })()
                                                                        }</p>
                                                                        <p>{e.contact.email.full}</p>
                                                                    </div>

                                                                    <p className="text-gray-400">${e.balance} Credit</p>

                                                                    <p 
                                                                        onClick={() => {
                                                                            setCustomerState(e);
                                                                            setSearchFocused(false);
                                                                            setSearchType("product");
                                                                            setResult([]);
    
                                                                            input_ref.current?.value ? input_ref.current.value = "" : {};
                                                                        }}
                                                                        className="whitespace-nowrap justify-self-end pr-4">Assign to cart</p>
                                                                </div>

                                                                {
                                                                    (indx == result.length-1) ? <></> : <hr className="mt-2 border-gray-500" />
                                                                }
                                                            </div>
                                                        )
                                                    })
                                            )
                                        case "transaction":
                                            return (
                                                result.length == 0 ?
                                                    <p className="self-center text-gray-400 py-6">No transactions with this reference</p>
                                                    :
                                                    (result as Order[]).map((e: Order, indx) => {
                                                        return (
                                                            <div key={`CUSTOMER-${e.id}`} className="flex flex-col overflow-hidden h-fit">
                                                                <div className="grid items-center gap-4 p-4 hover:bg-gray-400 hover:bg-opacity-10 cursor-pointer" style={{ gridTemplateColumns: "minmax(200px, 1fr) minmax(300px, 2fr) 225px 75px" }}>
                                                                    <div className="flex flex-col gap-0 max-w-[26rem] w-full flex-1">
                                                                        <p>{e.reference} {e.creation_date}</p>
                                                                        {/* <p className="text-sm text-gray-400">{e.order_history.length} Past Orders</p> */}
                                                                    </div>
                                                                </div>

                                                                {
                                                                    (indx == result.length-1) ? <></> : <hr className="mt-2 border-gray-500" />
                                                                }
                                                            </div>
                                                        )
                                                    })
                                            )
                                        default:
                                            return (
                                                <div>
                                                    A problem has occurred.
                                                </div>
                                            )
                                    }
                                })()
                            }
                        </div>
                        :
                        activeProduct ? 
                            <div className="p-4 text-white flex flex-col gap-8  bg-opacity-50 rounded-sm">
                                <div className="flex flex-row items-start gap-4">
                                    <Image src={activeProductVariant?.images?.[0] ?? activeProduct.images[0]} className="rounded-md" height={150} width={150} alt={activeProduct.name}></Image>

                                    <div className="flex flex-row items-start h-full justify-between flex-1">
                                        <div className="flex flex-col">
                                            <h2 className="text-xl font-medium">{activeProduct.name}</h2>
                                            <p className="text-gray-400">{activeProduct.company}</p>
                                            <br />

                                            <div className="flex flex-row items-center gap-4">
                                                <p className="text-gray-400">SKU:</p>
                                                <p>{activeProduct.sku}</p>
                                            </div>
                                            
                                            <br />
                                            <div>
                                                <div className="flex flex-row items-center gap-2">
                                                    {
                                                        ((activeProductVariant?.stock.find(e => e.store.code == master_state.store_id)?.quantity?.quantity_sellable ?? 0)) <= 0 ? 
                                                        <p className="text-red-200 bg-red-800 bg-opacity-40 px-4 w-fit h-fit rounded-full">Out of stock</p>
                                                        :
                                                        <p className="text-green-200 bg-green-800 bg-opacity-40 px-4 w-fit h-fit rounded-full">In stock</p>
                                                    } 

                                                    {
                                                        (activeProductVariant?.stock.reduce((p, c) => p += c.store.code !== master_state.store_id ? c.quantity.quantity_sellable : 0, 0) ?? 0) <= 0 ? 
                                                        <p className="text-red-200 bg-red-800 bg-opacity-40 px-4 w-fit h-fit rounded-full">Cannot ship</p>
                                                        :
                                                        <p className="text-green-200 bg-green-800 bg-opacity-40 px-4 w-fit h-fit rounded-full">Available to ship</p>
                                                    }

                                                    {                                       
                                                        activeProductVariant?.stock_information.discontinued ? 
                                                        <p className="text-red-200 bg-red-800 bg-opacity-40 px-4 w-fit h-fit rounded-full">Discontinued</p>
                                                        :
                                                        <></>
                                                    }

                                                    {                                       
                                                        activeProductVariant?.stock_information.back_order ? 
                                                        <p className="text-green-200 bg-green-800 bg-opacity-40 px-4 w-fit h-fit rounded-full">Back Order</p>
                                                        :
                                                        <></>
                                                    }
                                                </div>
                                            </div>
                                            {/* <p className="text-sm text-gray-300 truncate max-w-4">{activeProduct.description.substring(0, 150)+"..."}</p> */}
                                        </div>

                                        <div className="self-center flex flex-row items-center gap-4">
                                            <div 
                                                className="select-none cursor-pointer flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit"
                                                onClick={() => {
                                                    if(activeProductVariant) {
                                                        let cOs = orderState.find(e => e.order_type == "Direct");

                                                        if(!cOs?.products) {
                                                            const new_pdt_list = addToCart(activeProduct, activeProductVariant, [])

                                                            cOs = {
                                                                id: v4(),
                                                                destination: null,
                                                                origin: {
                                                                    code: master_state.store_id,
                                                                    contact: master_state.store_contact
                                                                },
                                                                products: new_pdt_list,
                                                                status: {
                                                                    status: "Queued",
                                                                    assigned_products: [],
                                                                    timestamp: getDate()
                                                                },
                                                                previous_failed_fulfillment_attempts: [],
                                                                status_history: [],
                                                                order_history: [],
                                                                order_notes: [],
                                                                reference: "",
                                                                creation_date: getDate(),
                                                                discount: "a|0",
                                                                order_type: "Direct"
                                                            };

                                                            console.log("PUT", new_pdt_list, cOs);

                                                            setOrderState([...sortOrders([ ...orderState, cOs])])
                                                        }else {
                                                            const new_pdt_list = addToCart(activeProduct, activeProductVariant, cOs.products)
                                                            const new_order_state = orderState.map(e => e.id == cOs?.id ? { ...cOs, products: new_pdt_list } : e);

                                                            setOrderState(sortOrders(new_order_state))
                                                        }
                                                    }
                                                }}
                                                >
                                                <Image width="25" height="25" src="/icons/plus-lge.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                                <p className="font-medium">Add to cart</p>
                                            </div>

                                            <div className="select-none flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit">
                                                <Image width="25" height="25" src="/icons/search-sm.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                                <p className="font-medium">Show Related Orders</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row items-start gap-8">
                                    <div className="flex flex-col gap-8">
                                        <PromotionList variant_id={activeProductVariant?.id} />

                                        <div className="flex flex-col gap-4">
                                            {
                                                activeProduct.variant_groups.map(e => {
                                                    return (
                                                        <div className="flex flex-col gap-2" key={e.category}>
                                                            <p className="text-sm text-gray-400">{e.category.toLocaleUpperCase()}</p>
                                                            <div className="flex flex-row items-center gap-2 select-none">
                                                                {
                                                                    e.variants.map(k => {
                                                                        const match = activeVariant?.find(function(o) {
                                                                            return o.variant.variant_code == k.variant_code;
                                                                        });

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

                                                                        const variant = activeProduct.variants?.find(b => isEqual(b.variant_code, new_vlist?.map(e => e.variant.variant_code)));

                                                                        if(!variant) {
                                                                            return (
                                                                                <p 
                                                                                    className="bg-gray-700 whitespace-nowrap cursor-pointer text-gray-600 py-1 px-4 w-fit rounded-md" 
                                                                                    key={k.variant_code}
                                                                                    onClick={() => {
                                                                                        let valid_variant: null | StrictVariantCategory[] = null;

                                                                                        for(let i = 0; i < (activeVariantPossibilities?.length ?? 0); i++) {
                                                                                            let new_vlist: StrictVariantCategory[] = [];

                                                                                            activeVariantPossibilities?.[i]?.map(j => {
                                                                                                if(j.category == e.category) {
                                                                                                    new_vlist.push({
                                                                                                        category: j.category,
                                                                                                        variant: k
                                                                                                    })
                                                                                                }else {
                                                                                                    // If valid pair, choose. 
                                                                                                    new_vlist.push(j)
                                                                                                }
                                                                                            })
                                                                                            
                                                                                            if(isValidVariant(activeProduct, new_vlist)) {
                                                                                                valid_variant = new_vlist;
                                                                                                break;
                                                                                            }
                                                                                        }

                                                                                        setActiveVariant(valid_variant);
                                                                                    }}>
                                                                                        {k.name}
                                                                                </p>
                                                                            )
                                                                        }

                                                                        if(match) {
                                                                            return (
                                                                                <p className="bg-gray-600 whitespace-nowrap cursor-pointer text-white py-1 px-4 w-fit rounded-md" key={k.variant_code}>{k.name}</p>
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
                                                                                    }} className="bg-gray-600 whitespace-nowrap hover:cursor-pointer text-gray-500 hover:text-gray-400 py-1 px-4 w-fit rounded-md" key={k.variant_code}>{k.name}</p>
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
                                            <p className="text-sm text-gray-400">COST</p>
                                            {/* As the price of a product is generated by the marginal increase from every variant, we must sum each variants prices to obtain the cost of the product with all variant codes applied. */}
                                            {(() => {
                                                let variant = activeProduct.variants?.find(b => isEqual(b.variant_code, activeVariant?.map(e => e.variant.variant_code)));

                                                return (
                                                    <div>
                                                        <p className="text-2xl font-semibold">${((variant?.retail_price ?? 1) * 1.15).toFixed(2)}</p>
                                                        <p className="text-gray-400">pre-tax: ${((variant?.retail_price ?? 1) * 1).toFixed(2)}</p>
                                                    </div>
                                                )
                                                })()
                                            }
                                        </div>
                                        
                                        <div className="flex flex-col gap-2">
                                            <p className="text-sm text-gray-400">INVENTORY</p>
                                            <div className="flex flex-col gap-2 w-full bg-gray-700 p-[0.7rem] px-4 rounded-md">
                                                {
                                                    activeProductVariant?.stock.map(e => {
                                                        return (
                                                            <div key={`STOCK-FOR-${e.store.code}`} className="flex flex-row items-center justify-between gap-2">
                                                                <p>{e.store.code}</p>
                                                                <div className="flex-1 h-[2px] rounded-full bg-gray-400 w-full"></div>
                                                                <p>{e.quantity.quantity_sellable}</p>
                                                                <p className="text-gray-400">({e.quantity.quantity_unsellable} Unsellable)</p>
                                                                <p>(+{e.quantity.quantity_on_order} on order)</p>
                                                                {/* <p>{e.quantity.quantity_on_floor}</p> */}
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full flex flex-col gap-2">
                                        <p className="text-sm text-gray-400">ALL VARIANTS</p>

                                        <div className="p-[0.7rem] w-full bg-gray-700 rounded-md gap-2 flex flex-col">
                                            {
                                                activeProduct.variants.map((e, indx) => {
                                                    const comparative_map = e.variant_code.map(b => {
                                                        return activeVariant?.find(c => c.variant.variant_code == b)
                                                    });

                                                    const filtered = comparative_map.filter(s => !s);
                                                    const active = filtered.length <= 0;

                                                    const qua = e.stock.find(e => e.store.code == master_state.store_id);

                                                    return (
                                                        <div key={e.variant_code.toString()} >
                                                            <div 
                                                                onClick={() => {
                                                                    let variant = activeVariantPossibilities?.find(b => isEqual(b?.map(k => k.variant.variant_code), e.variant_code)) as StrictVariantCategory[];

                                                                    setActiveVariant(variant);
                                                                    setActiveProductVariant(e);
                                                                }}
                                                                className={`grid w-full px-[0.7rem] py-2 rounded-sm cursor-pointer ${active ? "bg-gray-600" : ""}`} style={{ gridTemplateColumns: "1fr 100px 150px 50px" }}>
                                                                <p className="flex-1 w-full">{e.name}</p>

                                                                <p className="text-gray-300">{((qua?.quantity.quantity_sellable ?? 0)) ?? 0} Here</p>
                                                                <p className="text-gray-300">
                                                                    {
                                                                        e.stock.map(e => (e.store.code == master_state.store_id) ? 0 : (e.quantity.quantity_sellable)).reduce(function (prev, curr) { return prev + curr }, 0)
                                                                    } In other stores
                                                                </p>
                                                                <p >${(e.retail_price * 1.15).toFixed(2)}</p>
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
                                    customerState ? 
                                    <div className="flex flex-col justify-between gap-8 bg-[#4c2f2d] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit cursor-pointer"
                                        onClick={() => { 
                                            setCustomerState(null)
                                        }}
                                    >
                                        <Image width="25" height="25" src="/icons/user-01.svg" style={{ filter: "invert(86%) sepia(34%) saturate(4038%) hue-rotate(295deg) brightness(88%) contrast(86%)" }} alt={''}></Image>
                                        <p className="font-medium select-none">Remove Customer</p>
                                    </div>
                                    :
                                    <div className="flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit cursor-pointer" 
                                        onClick={() => { 
                                            setResult([]); 
                                            setSearchType("customer");    

                                            input_ref.current?.value ? input_ref.current.value = "" : {};
                                            input_ref.current?.focus()
                                        }}
                                    >
                                        <Image width="25" height="25" src="/icons/user-01.svg" style={{ filter: "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)" }} alt={''}></Image>
                                        <p className="font-medium select-none">Select Customer</p>
                                    </div>
                                }

                                <div
                                    onClick={() => {
                                        setPadState("discount")
                                        setDiscount({
                                            type: "absolute",
                                            for: "cart",
                                            product: {
                                                name: "",
                                                stock: [],
                                                images: [],
                                                /// The group codes for all sub-variants; i.e. is White, Short Sleeve and Small.
                                                variant_code: [],
                                                order_history: [],
                                                /// impl! Implement this type!
                                                stock_information: {
                                                    stock_group: "string",
                                                    sales_group: 'string',
                                                    value_stream: 'string',
                                                    brand: 'string',
                                                    unit: 'string',
                                                    tax_code: 'string',
                                                    weight: 'string',
                                                    volume: 'string',
                                                    max_volume: 'string',
                                                    back_order: false,
                                                    discontinued: false,
                                                    non_diminishing: false
                                                },
                                                loyalty_discount: {
                                                    Absolute: 0
                                                },
                                                barcode: "CART",
                                                marginal_price: orderState.reduce((p, c) => p += c.products?.reduce((prev, curr) => prev += (curr.quantity * curr.variant_information.marginal_price), 0), 0),
                                                retail_price: orderState.reduce((p, c) => p += c.products?.reduce((prev, curr) => prev += (curr.quantity * curr.variant_information.retail_price), 0), 0)
                                            },
                                            value: 0,
                                            exclusive: false
                                        })
                                    }} 
                                    className="flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit cursor-pointer">
                                    <Image width="25" height="25" src="/icons/sale-03.svg" style={{ filter: "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)" }} alt={''}></Image>
                                    <p className="font-medium">Add Cart Discount</p>
                                </div>
        
                                <div 
                                    onClick={() => {
                                        if(customerState) setPadState("ship-to-customer")
                                    }}
                                    className={`flex flex-col justify-between gap-8  ${customerState ? "bg-[#243a4e]" : "bg-[#101921]"} backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit cursor-pointer`}>
                                    <Image width="25" height="25" src="/icons/globe-05.svg" style={{ filter: customerState ? "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" : "invert(46%) sepia(7%) saturate(675%) hue-rotate(182deg) brightness(94%) contrast(93%)" }} alt={''}></Image>
                                    <p className={`${customerState ? "text-white" : "text-gray-500"} font-medium`}>Ship Order to Customer</p>
                                </div>
        
                                <div 
                                    onClick={() => {
                                        setPadState("note")
                                    }}
                                    className="flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit cursor-pointer">
                                    <Image width="25" height="25" src="/icons/file-plus-02.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                    <p className="font-medium">Add Note</p>
                                </div>
        
                                <div 
                                    onClick={() => {
                                        setPadState("pickup-from-store")
                                    }}
                                    className={`flex flex-col justify-between gap-8 ${customerState ? "bg-[#243a4e]" : "bg-[#101921]"}  backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit cursor-pointer`}>
                                    <Image width="25" height="25" src="/icons/building-02.svg" style={{ filter: customerState ? "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" : "invert(46%) sepia(7%) saturate(675%) hue-rotate(182deg) brightness(94%) contrast(93%)" }} alt={''}></Image>
                                    <p className={`${customerState ? "text-white" : "text-gray-500"} font-medium`}>Pickup from Store</p>
                                </div>
        
                                <div className="flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit cursor-pointer">
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
                            <p className="text-sm">5 items</p>
                            <p className="text-gray-400 text-sm">&#8226; Kiosk 5</p>
                        </div>
                    </div>
                    <br />
                    <Image width="25" height="25" src="/icons/expand-04.svg" alt={''}></Image>
                </div>
            </div>
        </div>
    )
}