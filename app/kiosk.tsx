import Image from "next/image";
import { createRef, useEffect, useMemo, useRef, useState } from "react";
import { debounce, divide, isEqual, uniqueId, values } from "lodash";
import { ReactBarcodeReader } from "./scanner";
import BarcodeReader from 'react-barcode-reader'
import CashSelect from "./cashSelect";
import { v4 } from "uuid"
import DiscountMenu from "./discountMenu";
import { ContactInformation, Customer, DbOrder, DbProductPurchase, DiscountValue, Employee, KioskState, Note, Order, OrderStatus, PaymentIntent, Product, ProductPurchase, StatusHistory, StrictVariantCategory, VariantInformation } from "./stock-types";
import NotesMenu from "./notesMenu";
import { applyDiscount, findMaxDiscount, fromDbDiscount, isValidVariant, parseDiscount, stringValueToObj, toAbsoluteDiscount, toDbDiscount } from "./discount_helpers";
import PaymentMethod from "./paymentMethodMenu";
import DispatchMenu from "./dispatchMenu";
import { kMaxLength } from "buffer";
import moment from "moment";
import PickupMenu from "./pickupMenu";

export default function Kiosk({ master_state }: { master_state: {
    store_id: string,
    employee: Employee | null | undefined,
    store_contact: ContactInformation,
    kiosk: string
} }) {
    const [ kioskState, setKioskState ] = useState<KioskState>({
        customer: null,
        transaction_type: "Out",
        products: [],
        order_total: null,
        payment: [],
        order_date: null,
        order_notes: [],
        salesperson: null,
        till: null
    });

    const [ orderState, setOrderState ] = useState<Order[]>([{
        id: v4(),
        destination: null,
        origin: {
            code: master_state.store_id,
            contact: master_state.store_contact
        },
        products: [],
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
    }])

    const [ customerState, setCustomerState ] = useState<Customer | null>(null);

    const [ searchType, setSearchType ] = useState<"customer" | "product" | "transaction">("product");
    const [ padState, setPadState ] = useState<"cart" | "select-payment-method" | "await-debit" | "await-cash" | "completed" | "discount" | "note" | "ship-to-customer" | "pickup-from-store">("cart");

    const [ activeProduct, setActiveProduct ] = useState<Product | null>(null);
    const [ activeVariant, setActiveVariant ] = useState<StrictVariantCategory[] | null>(null);
    const [ activeProductVariant, setActiveProductVariant ] = useState<VariantInformation | null>(null);
    const [ activeVariantPossibilities, setActiveVariantPossibilities ] = useState<(StrictVariantCategory[] | null)[] | null>(null);

    const [ searchTermState, setSearchTermState ] = useState("");
    const [ result, setResult ] = useState<Product[] | Customer[] | Order[]>([]);
    const [ searchFocused, setSearchFocused ] = useState(false); 

    const [ discount, setDiscount ] = useState<{
        type: "absolute" | "percentage",
        product: VariantInformation | null,
        value: number,
        for: "cart" | "product",
        exclusive: boolean
    }>({
        type: "absolute",
        for: "product",
        product: null,
        value: 0.00,
        exclusive: false
    })

    const [ currentTransactionPrice, setCurrentTransactionPrice ] = useState<number | null>(null);
    const [ cashContinuable, setCashContinuable ] = useState(false);

    const addToCart = (product: Product, variant: VariantInformation, orderProducts: ProductPurchase[]) => {
        const existing_product = orderProducts.find(k => k.product_code == product.sku && isEqual(k.variant, variant?.variant_code));
        let new_order_products_state = [];

        if(existing_product) {
            // Editing the quantity of an existing product in the order.
            // if(e.product_code == product.sku && isEqual(e.variant, variant?.variant_code)) {
                    // if(findMaxDiscount(e.discount, e.variant_information.retail_price, true) !== findMaxDiscount([ { source: "loyalty", value: fromDbDiscount(variant.loyalty_discount) } ], e.variant_information.retail_price, true)) {
                        // return e;
                    // }else {
                    // }
                // }

            const matching_product = orderProducts.find(e => e.product_code == product.sku && isEqual(e.variant, variant?.variant_code) && (applyDiscount(1, findMaxDiscount(e.discount, e.variant_information.retail_price, false).value) == 1));
            
            if(matching_product) {
                const total_stock = matching_product.variant_information.stock.reduce((p, c) => p += (c.quantity.quantity_sellable), 0);
                // If a matching product exists; apply emendation
                new_order_products_state = orderProducts.map(e => {
                    if(total_stock <= e.quantity) return e;

                    return e.product_code == product.sku && isEqual(e.variant, variant?.variant_code) && (applyDiscount(1, findMaxDiscount(e.discount, e.variant_information.retail_price, false).value) == 1) ? { ...e, quantity: e.quantity+1 } : e
                });
            }else {
                const po: ProductPurchase = {
                    id: v4(),
                    product_code: product.sku,
                    variant: variant?.variant_code ?? [],
                    discount: [
                        {
                            source: "loyalty",
                            value: fromDbDiscount(variant.loyalty_discount)
                        }
                    ],
    
                    product_cost: variant?.retail_price ?? 0,
                    quantity: 1,
    
                    product: product,
                    variant_information: variant ?? product.variants[0]
                };
    
                new_order_products_state = [ ...orderProducts, po ]
            }
        }else {
            // Creating a new product in the order.
            const po: ProductPurchase = {
                id: v4(),
                product_code: product.sku,
                variant: variant?.variant_code ?? [],
                discount: [
                    {
                        source: "loyalty",
                        value: fromDbDiscount(variant.loyalty_discount)
                    }
                ],

                product_cost: variant?.retail_price ?? 0,
                quantity: 1,

                product: product,
                variant_information: variant ?? product.variants[0]
            };

            new_order_products_state = [ ...orderProducts, po ]
        }

        if(padState == "cart" && discount.product?.barcode == "CART") {
            setPadState("cart")
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
                    marginal_price: new_order_products_state?.reduce((prev, curr) => prev += (curr.quantity * curr.variant_information.marginal_price), 0),
                    retail_price: new_order_products_state?.reduce((prev, curr) => prev += (curr.quantity * curr.variant_information.retail_price), 0)
                },
                value: 0,
                exclusive: false
            })
        }

        return new_order_products_state;
    }

    const debouncedResults = useMemo(() => {
        return debounce(async (searchTerm: string, searchType: string) => {
            if(searchTerm == "") {
                setSearchTermState(searchTerm);
                return;
            }
    
            var myHeaders = new Headers();
            myHeaders.append("Cookie", `${document.cookie}`);
    
            setSearchTermState(searchTerm);
    
            const fetchResult = await fetch(`http://127.0.0.1:8000/${searchType}/${searchType == "transaction" ? "ref" : "search"}/${searchTerm}`, {
                method: "GET",
                headers: myHeaders,
                redirect: "follow",
                credentials: "include"
            });
    
            const data: any[] = await fetchResult.json();

            if(data.length == 1 && searchType == "product") {
                const e: Product = data[0];

                let vmap_list = [];
                let active_variant = null;
                let active_product_variant = null;

                for(let i = 0; i < e.variants.length; i++) {
                    const var_map = e.variants[i].variant_code.map(k => {
                        // Replace the variant code with the variant itself.
                        return e.variant_groups.map(c => {
                            let nc = c.variants.map(l => k == l.variant_code ? { category: c.category, variant: l } : false)

                            return nc.filter(l => l)
                        });
                    }).flat();

                    // Flat map of the first variant pair. 
                    const vlist: StrictVariantCategory[] = var_map.map(e => e.length > 0 ? e[0] : false).filter(e => e) as StrictVariantCategory[];

                    if(e.variants[i].barcode == searchTerm) {
                        active_variant = vlist;
                        active_product_variant = e.variants[i];
                    }
                    
                    vmap_list.push(vlist);
                }

                if(active_product_variant) {
                    let cOs = orderState.find(e => e.order_type == "Direct");

                    if(!cOs?.products) {
                        if(orderState[0].products) {
                            cOs = orderState[0];
                        }else {
                            return;
                        }
                    }

                    const new_pdt_list = addToCart(e, active_product_variant, cOs.products);
                    const new_order_state = orderState.map(e => e.id == cOs?.id ? { ...cOs, products: new_pdt_list } : e);

                    setOrderState(sortOrders(new_order_state))
                }else {
                    setActiveProduct(e);
                    setActiveVariantPossibilities(vmap_list);
                    setActiveVariant(active_variant ?? vmap_list[0]);
                    setActiveProductVariant(active_product_variant ?? e.variants[0]);
                }
            }
    
            setResult(data);
        }, 50);
    }, [orderState, discount]);

    const input_ref = createRef<HTMLInputElement>();

    useEffect(() => {
        return () => {
            debouncedResults.cancel();
        };
    });

    return (
        <>
            <ReactBarcodeReader
                onScan={(e: any) => {
                    setSearchFocused(false);
                    input_ref.current?.value ? input_ref.current.value = e : {};

                    setSearchType("product");
                    debouncedResults(e, "product");
                }}
                onError={() => {}}
            />

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
                            }} width="20" height="20" src="/icons/arrow-narrow-left.svg" className="select-none cursor-pointer" alt={''} draggable={false} ></Image>
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
                                                                if(orderState[0].products) {
                                                                    cOs = orderState[0];
                                                                }else {
                                                                    return;
                                                                }
                                                            }

                                                            const new_pdt_list = addToCart(activeProduct, activeProductVariant, cOs.products)
                                                            const new_order_state = orderState.map(e => e.id == cOs?.id ? { ...cOs, products: new_pdt_list } : e);

                                                            setOrderState(sortOrders(new_order_state))
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

            {
                (() => {
                    switch(padState) {
                        case "cart":
                            return (
                                <div className="bg-gray-900 min-w-[550px] max-w-[550px] p-6 flex flex-col h-full">
                                    <div className="flex flex-col gap-4 flex-1 max-h-full">
                                        {/* Order Information */}
                                        <div className="flex flex-row items-center justify-between max-h-screen overflow-hidden">
                                            <div className="text-white">
                                                {
                                                    customerState ?
                                                    <div className="flex flex-row items-center gap-2">
                                                        <h2 className="font-semibold text-lg">{customerState.name}</h2>

                                                        <Image
                                                            onClick={() => {
                                                                setCustomerState(null)

                                                                // setOrderState({
                                                                //     ...orderState,
                                                                //     products: orderState.products.map(e => {
                                                                //         return {
                                                                //             ...e,
                                                                //             discount: e.discount.filter(e => e.source !== "loyalty")
                                                                //         }
                                                                //     })
                                                                // })
                                                            }} 
                                                            className="cursor-pointer" height={15} width={15} src="/icons/x-2.svg" alt="" style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }}></Image>
                                                    </div>
                                                    :
                                                    <div 
                                                        onClick={() => {
                                                            setResult([]); 
                                                            setSearchType("customer");    

                                                            input_ref.current?.value ? input_ref.current.value = "" : {};
                                                            input_ref.current?.focus()
                                                        }}
                                                        className="bg-gray-800 rounded-md px-2 py-[0.1rem] flex flex-row items-center gap-2 cursor-pointer">
                                                        <p>Select Customer</p>
                                                        <Image 
                                                            className=""
                                                            height={15} width={15} src="/icons/arrow-narrow-right.svg" alt="" style={{ filter: "invert(100%) sepia(5%) saturate(7417%) hue-rotate(235deg) brightness(118%) contrast(101%)" }}></Image>
                                                    </div>
                                                }
                                                <div className="text-sm text-gray-400">
                                                    {
                                                        orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) == 0
                                                        ? 
                                                        "Cart Empty" 
                                                        : 
                                                        <p>
                                                            {orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0)} item{(orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) > 1 ? "s" : "")}
                                                        </p>
                                                    }
                                                </div>
                                            </div>

                                            <div className="flex flex-row items-center gap-[0.75rem] bg-gray-800 p-2 px-4 rounded-md cursor-pointer">
                                                <p className="text-white" onClick={() => {
                                                    // const reduced = orderState.filter(e => e.order_type == "direct");
                                                    // const cleared = reduced.map(e => { return {...e, products: []} });

                                                    setOrderState([{
                                                        id: v4(),
                                                        destination: null,
                                                        origin: {
                                                            code: master_state.store_id,
                                                            contact: master_state.store_contact
                                                        },
                                                        products: [],
                                                        status: {
                                                            status: "Queued",
                                                            assigned_products: [],
                                                            timestamp: getDate()
                                                        },
                                                        status_history: [],
                                                        order_history: [],
                                                        previous_failed_fulfillment_attempts: [],
                                                        order_notes: [],
                                                        reference: "",
                                                        creation_date: getDate(),
                                                        discount: "a|0",
                                                        order_type: "Direct"
                                                    }])
                                                }}>Clear Cart</p>
                                                {/* <Image style={{ filter: "invert(100%) sepia(12%) saturate(7454%) hue-rotate(282deg) brightness(112%) contrast(114%)" }} width="25" height="25" src="/icons/x-square.svg" alt={''}></Image> */}
                                            </div>
                                        </div>
                                        

                                        <hr className="border-gray-400 opacity-25"/>
                                        
                                        <div className="flex flex-col flex-1 h-full gap-4 overflow-auto max-h-full py-2">
                                        {
                                            orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) <= 0 ?
                                            <div className="flex flex-col items-center w-full">
                                                <p className="text-sm text-gray-400 py-4 select-none">No products in cart</p>
                                            </div>
                                            :
                                            sortOrders(orderState).map((n, indx) => {
                                                console.log(n);

                                                return (
                                                    <div key={n.id} className="flex flex-col gap-4">
                                                        {
                                                            orderState.length !== 1 ?
                                                                n.order_type !== "Direct" ?
                                                                    <div className={`flex select-none flex-row w-full justify-between gap-2 ${indx == 0 ? "" : "mt-4"}`}>
                                                                        <div className="flex flex-col gap-1">
                                                                            <div className="flex flex-row items-center gap-2">
                                                                                {
                                                                                    n.order_type == "Pickup" ?
                                                                                    <Image src="/icons/building-02.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                                                    :
                                                                                    n.order_type == "Quote" ?
                                                                                    <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                                                    :
                                                                                    <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                                                }
                                                                                <div className="text-white font-semibold flex flex-row items-center gap-2">{n.origin.contact.name} <p className="text-gray-400">({n.origin?.code})</p> <p className="text-gray-400"> -&gt; {n.destination?.contact.address.street}</p></div>
                                                                            </div>
                                                                            <p className="text-gray-400">{n.origin.contact.address.street}, {n.origin.contact.address.street2}, {n.origin.contact.address.po_code}</p>
                                                                        </div>
                                                                    </div>
                                                                :
                                                                    <div className="flex select-none flex-col w-full justify-between gap-2">
                                                                        <div className="flex flex-1 flex-row-reverse items-center gap-2">
                                                                            <p className="text-gray-400 text-sm font-semibold">TAKE HOME TODAY</p>
                                                                            {/* <hr className="border-gray-400 opacity-25 flex-1 w-full"/> */}
                                                                        </div>
                                                                    </div>
                                                            :
                                                                orderState[0].order_type !== "Direct" ?
                                                                <div className={`flex select-none flex-row w-full justify-between gap-2 ${indx == 0 ? "" : "mt-4"}`}>
                                                                        <div className="flex flex-col gap-1">
                                                                            <div className="flex flex-row items-center gap-2">
                                                                                {
                                                                                    n.order_type == "Pickup" ?
                                                                                    <Image src="/icons/building-02.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                                                    :
                                                                                    n.order_type == "Quote" ?
                                                                                    <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                                                    :
                                                                                    <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                                                                }
                                                                                <div className="text-white font-semibold flex flex-row items-center gap-2">
                                                                                    {n.origin.contact.name} 
                                                                                    <p className="text-gray-400">({n.origin?.code})</p> 
                                                                                    
                                                                                    {
                                                                                        n.order_type !== "Pickup" ?
                                                                                        <p className="text-gray-400"> -&gt; {n.destination?.contact.address.street}</p>
                                                                                        :
                                                                                        <></>
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <p className="text-gray-400">{n.origin.contact.address.street}, {n.origin.contact.address.street2}, {n.origin.contact.address.po_code}</p>
                                                                        </div>
                                                                    </div>
                                                                :
                                                                <></>
                                                        }
                                                        
                                                        {
                                                            n.products.map(e => {
                                                                // Find the variant of the product for name and other information...
                                                                const total_stock = e.variant_information.stock.reduce((prev, curr) => {
                                                                    return prev += (curr.quantity.quantity_sellable) 
                                                                }, 0)

                                                                const q_here = e.variant_information.stock.find(e => e.store.code == master_state.store_id);

                                                                return (
                                                                    <div
                                                                        key={e.id} className="text-white">
                                                                        <div className="flex flex-row items-center gap-4">
                                                                            <div className="relative">
                                                                                <Image height={60} width={60} quality={100} alt="" className="rounded-sm" src={e.variant_information.images[0]}></Image>
                
                                                                                {
                                                                                    n.order_type == "Direct" ?
                                                                                        (n.products.reduce((t, i) => t += (i.variant_information.barcode == e.variant_information.barcode ? i.quantity : 0), 0) ?? 1) 
                                                                                        >
                                                                                        (q_here?.quantity.quantity_sellable ?? 0)
                                                                                        ?
                                                                                        <div className="bg-red-500 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{e.quantity}</div>
                                                                                        :
                                                                                        // e.variant_information.stock.map(e => (e.store.code == master_state.store_id) ? 0 : e.quantity.quantity_on_hand).reduce(function (prev, curr) { return prev + curr }, 0)
                                                                                        // Determine the accurate representation of a non-diminishing item.
                                                                                        e.variant_information.stock_information.non_diminishing ?
                                                                                        <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{e.quantity}</div>
                                                                                        :
                                                                                        <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{e.quantity}</div>
                                                                                    :
                                                                                        <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{e.quantity}</div>
                                                                                }
                                                                            </div>
                
                                                                            <div className="flex flex-col gap-2 items-center justify-center">
                                                                                <Image
                                                                                    onClick={() => {
                                                                                        if(!((n.products.reduce((p, k) => p += k.variant_information.barcode == e.variant_information.barcode && isEqual(k.variant, e.variant) ? k.quantity : 0, 0) ?? 1) >= total_stock)) {
                                                                                            const product_list_clone = n.products.map(k => {
                                                                                                if(k.id == e.id) {
                                                                                                    return {
                                                                                                        ...k,
                                                                                                        quantity: k.quantity+1
                                                                                                    }
                                                                                                }else {
                                                                                                    return k
                                                                                                }
                                                                                            })

                                                                                            const new_state = {
                                                                                                ...n,
                                                                                                products: product_list_clone
                                                                                            }

                                                                                            const new_order = orderState.map(e => e.id == n.id ? new_state : e)

                                                                                            setOrderState(sortOrders(new_order))
                                                                                        }
                                                                                    }} 
                                                                                    onMouseOver={(v) => {
                                                                                        if(!((n.products.reduce((p, k) => p += k.variant_information.barcode == e.variant_information.barcode && isEqual(k.variant, e.variant) ? k.quantity : 0, 0) ?? 1) >= total_stock))
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
                                                                                        (n.products.reduce((t, i) => t += (i.variant_information.barcode == e.variant_information.barcode ? i.quantity : 0), 0) ?? 1) 
                                                                                        <= 
                                                                                        total_stock
                                                                                        // ((n.products.reduce((p, k) => p += k.variant_information.barcode == e.variant_information.barcode && isEqual(k.variant, e.variant) ? k.quantity : 0, 0)) >= total_stock)
                                                                                        ? 
                                                                                        "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)"
                                                                                        :
                                                                                        "invert(35%) sepia(47%) saturate(1957%) hue-rotate(331deg) brightness(99%) contrast(93%)" 
                                                                                    }} ></Image>
                                                                                <Image
                                                                                    onClick={() => {
                                                                                        const product_list_clone = n.products.map(k => {
                                                                                            if(k.id == e.id) {
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
                                                                                            ...n,
                                                                                            products: product_list_clone.filter(k => k) as ProductPurchase[]
                                                                                        }

                                                                                        const new_order = orderState.map(e => e.id == n.id ? new_state : e)

                                                                                        setOrderState(sortOrders(new_order))
                                                                                    }} 
                                                                                    draggable="false"
                                                                                    className="select-none"
                                                                                    onMouseOver={(b) => {
                                                                                        b.currentTarget.style.filter = (n.products.find(k => k.id == e.id)?.quantity ?? 1) <= 1 ? 
                                                                                        "invert(50%) sepia(98%) saturate(3136%) hue-rotate(332deg) brightness(94%) contrast(99%)"
                                                                                        : 
                                                                                        "invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";
                                                                                    }}
                                                                                    onMouseLeave={(e) => {
                                                                                        e.currentTarget.style.filter = "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
                                                                                    }}
                                                                                    width="15" height="15" src={
                                                                                        (n.products.find(k => k.id == e.id)?.quantity ?? 1) <= 1 ? 
                                                                                        "/icons/x-square.svg" 
                                                                                        : 
                                                                                        "/icons/arrow-block-down.svg"
                                                                                    } alt={''} style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }}></Image>
                                                                            </div>
                                                                            
                                                                            <div className="flex-1 cursor-pointer"
                                                                                onClick={() => {
                                                                                    setActiveProduct(e.product)
                                                                                    setActiveProductVariant(e.variant_information)
                                                                                }} >
                                                                                <p className="font-semibold">{e.product.company} {e.product.name}</p>
                                                                                <p className="text-sm text-gray-400">{e.variant_information.name}</p>
                                                                                
                                                                                {
                                                                                    n.order_type == "Direct" ?
                                                                                        (n.products.reduce((t, i) => t += (i.variant_information.barcode == e.variant_information.barcode ? i.quantity : 0), 0) ?? 1) 
                                                                                        > 
                                                                                        (q_here?.quantity.quantity_sellable ?? 0)
                                                                                        ?
                                                                                            <p className="text-sm text-red-400">Out of stock - {(q_here?.quantity.quantity_sellable ?? 0)} here, {(total_stock - (q_here?.quantity.quantity_sellable ?? 0)) ?? 0} in other stores</p>
                                                                                        :
                                                                                            <></>
                                                                                    :
                                                                                        <></>
                                                                                }
                                                                            </div>
                
                                                                            <div className="flex flex-row items-center gap-2">
                                                                                <Image 
                                                                                    onClick={() => {
                                                                                        setPadState("discount");
                                                                                        setDiscount({
                                                                                            ...stringValueToObj(findMaxDiscount(e.discount, e.product_cost, false).value),
                                                                                            product: e.variant_information,
                                                                                            for: "product",
                                                                                            exclusive: false
                                                                                        })
                                                                                    }}
                                                                                    style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }} height={20} width={20} alt="Discount" className="rounded-sm hover:cursor-pointer" src="/icons/sale-03.svg" 
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
                                                                                    applyDiscount(e.variant_information.retail_price, findMaxDiscount(e.discount, e.variant_information.retail_price, !(!customerState)).value) == e.variant_information.retail_price ?
                                                                                    <p>${(e.variant_information.retail_price * 1.15).toFixed(2)}</p>
                                                                                    :
                                                                                    <>
                                                                                        <p className="text-gray-500 line-through text-sm">${(e.variant_information.retail_price * 1.15).toFixed(2)}</p>
                                                                                        <p className={`${findMaxDiscount(e.discount, e.variant_information.retail_price, !(!customerState)).source == "loyalty" ? "text-gray-300" : ""}`}>${((applyDiscount(e.variant_information.retail_price  * 1.15, findMaxDiscount(e.discount, e.variant_information.retail_price, !(!customerState)).value) ?? 1)).toFixed(2)}</p>
                                                                                    </>
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })
                                                        }
                                                    </div>
                                                )
                                            })
                                        }
                                        </div>

                                        <hr className="border-gray-400 opacity-25"/>
                                        
                                        <div className="flex flex-row items-center text-white justify-between px-2">
                                            <div>
                                                <p className="text-gray-400 font-bold">Sub Total</p>
                                                <p className="text-gray-600 font-bold">Tax</p>
                                                <p className="font-bold text-lg">Total</p>
                                            </div>
                                            
                                            <div className="flex flex-col gap-0">
                                                {/* {
                                                    applyDiscount(orderState.products.reduce(function (prev, curr) {
                                                        return prev + applyDiscount(curr.variant_information.retail_price * curr.quantity, curr.discount)
                                                    }, 0), orderState.discount) == orderState.products.reduce(function (prev, curr) {
                                                        return prev + applyDiscount(curr.variant_information.retail_price * curr.quantity, curr.discount)
                                                    }, 0) ?
                                                        <></>
                                                        :
                                                        <p>${orderState.products.reduce(function (prev, curr) {
                                                            return prev + applyDiscount(curr.variant_information.retail_price * curr.quantity, curr.discount)
                                                        }, 0)}</p>
                                                } */}
                                                <p className="text-gray-400 font-bold items-end self-end">
                                                    ${
                                                        orderState.reduce(
                                                            (p,c) => 
                                                                p + applyDiscount(
                                                                    c.products.reduce(function (prev, curr) {
                                                                        return prev + (applyDiscount(curr.variant_information.retail_price, findMaxDiscount(curr.discount, curr.variant_information.retail_price, !(!customerState)).value) * curr.quantity)
                                                                    }, 0)
                                                                , c.discount)
                                                            , 0)
                                                        .toFixed(2)
                                                    } {
                                                        orderState.reduce(
                                                            (p,c) => 
                                                                p + applyDiscount(
                                                                    c.products.reduce(function (prev, curr) {
                                                                        return prev + (applyDiscount(curr.variant_information.retail_price, findMaxDiscount(curr.discount, curr.variant_information.retail_price, !(!customerState)).value) * curr.quantity)
                                                                    }, 0)
                                                                , c.discount)
                                                            , 0)
                                                        == 
                                                        orderState.reduce(
                                                            (p,c) => 
                                                                p + 
                                                                    c.products.reduce(function (prev, curr) {
                                                                        return prev + (applyDiscount(curr.variant_information.retail_price, findMaxDiscount(curr.discount, curr.variant_information.retail_price, !(!customerState)).value) * curr.quantity)
                                                                    }, 0)
                                                            , 0) 
                                                        ?
                                                        <></>
                                                        :
                                                        `(-${
                                                            orderState.reduce(
                                                                (p,c) => 
                                                                    p + applyDiscount(
                                                                        c.products.reduce(function (prev, curr) {
                                                                            return prev + (applyDiscount(curr.variant_information.retail_price, findMaxDiscount(curr.discount, curr.variant_information.retail_price, !(!customerState)).value) * curr.quantity)
                                                                        }, 0)
                                                                    , c.discount)
                                                                , 0)
                                                            -
                                                            (orderState.reduce((p,c) => 
                                                                p + applyDiscount(
                                                                        c.products.reduce(function (prev, curr) {
                                                                            return prev + (applyDiscount(curr.variant_information.retail_price, findMaxDiscount(curr.discount, curr.variant_information.retail_price, !(!customerState)).value) * curr.quantity)
                                                                        }, 0), c.discount
                                                                    )
                                                                , 0))
                                                        })`
                                                    }
                                                </p>
                                                <p className="text-gray-600 font-bold items-end self-end">+15% (${
                                                    (
                                                        (orderState.reduce(
                                                            (p,c) => 
                                                                p += applyDiscount(
                                                                    c.products.reduce(function (prev, curr) {
                                                                        return prev + applyDiscount(curr.variant_information.retail_price * curr.quantity * 1.15, findMaxDiscount(curr.discount, curr.variant_information.retail_price, !(!customerState)).value)
                                                                    }, 0) 
                                                                , c.discount) 
                                                            , 0)
                                                        )
                                                        -
                                                        (orderState.reduce(
                                                            (p,c) => 
                                                                p += applyDiscount(
                                                                    c.products.reduce(function (prev, curr) {
                                                                        return prev + applyDiscount(curr.variant_information.retail_price * curr.quantity, findMaxDiscount(curr.discount, curr.variant_information.retail_price, !(!customerState)).value)
                                                                    }, 0)
                                                                , c.discount)
                                                            , 0)
                                                        )
                                                    ).toFixed(2)
                                                })</p>
                                                <p className="font-bold text-lg items-end self-end">
                                                ${
                                                    (
                                                        orderState.reduce(
                                                            (p,c) => 
                                                                p += applyDiscount(
                                                                    c.products.reduce(function (prev, curr) {
                                                                        return prev + (applyDiscount(curr.variant_information.retail_price * 1.15, findMaxDiscount(curr.discount, curr.variant_information.retail_price, !(!customerState)).value) * curr.quantity)
                                                                    }, 0) 
                                                                , c.discount) 
                                                            , 0)
                                                    ).toFixed(2)
                                                }
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-row items-center gap-4">
                                            <div className={`bg-gray-300 w-full rounded-md p-4 flex items-center justify-center cursor-pointer ${orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) > 0 ? "" : "bg-opacity-10 opacity-20"}`}>
                                                <p className="text-gray-800 font-semibold">Park Sale</p>
                                            </div>

                                            <div
                                                onClick={() => {
                                                    setPadState("select-payment-method");

                                                    const price =  
                                                        orderState.reduce(
                                                        (p,c) => 
                                                            p += applyDiscount(
                                                                c.products.reduce(function (prev, curr) {
                                                                    return prev + (applyDiscount(curr.variant_information.retail_price * 1.15, findMaxDiscount(curr.discount, curr.variant_information.retail_price, !(!customerState)).value) * curr.quantity)
                                                                }, 0) 
                                                            , c.discount) 
                                                        , 0)
                                                    .toFixed(2);

                                                    setKioskState({
                                                        ...kioskState,
                                                        order_total: parseFloat(price)
                                                    })

                                                    setCurrentTransactionPrice(parseFloat(price));
                                                }} 
                                                className={`${orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) > 0 ? "bg-blue-700 cursor-pointer" : "bg-blue-700 bg-opacity-10 opacity-20"} w-full rounded-md p-4 flex items-center justify-center`}>
                                                <p className={`text-white font-semibold ${""}`}>Checkout</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        case "select-payment-method":
                            return (
                                <PaymentMethod customer={!(!customerState)} setPadState={setPadState} orderState={orderState} kioskState={kioskState} ctp={[ currentTransactionPrice, setCurrentTransactionPrice ]} />
                            )
                        case "await-debit":
                            // On completion of this page, ensure all payment segments are made, i.e. if a split payment is forged, return to the payment select screen with the new amount to complete the payment. 
                            return (
                                <div className="bg-blue-500 min-w-[550px] max-w-[550px] p-6 flex flex-col h-full items-center">
                                    <div className="flex flex-row justify-between cursor-pointer w-full">
                                        <div 
                                            onClick={() => {
                                                setPadState("select-payment-method")
                                            }}
                                            className="flex flex-row items-center gap-2"
                                        >
                                            <Image src="/icons/arrow-narrow-left (1).svg" height={20} width={20} alt="" style={{ filter: "invert(100%) sepia(99%) saturate(0%) hue-rotate(119deg) brightness(110%) contrast(101%)" }} />
                                            <p className="text-white">Cancel</p>
                                        </div>
                                        <p className="text-white">Awaiting Customer Payment</p>
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col items-center justify-center">
                                        <p className="text-white text-3xl font-bold">${currentTransactionPrice?.toFixed(2)}</p>
                                        <p className="text-gray-200">Tap, Insert or Swipe</p>
                                    </div>

                                    <p onClick={() => {
                                        const new_payment: PaymentIntent[] = [ ...kioskState.payment, {
                                            amount: {quantity: currentTransactionPrice ?? 0, currency: 'NZD'},
                                            delay_action: "Cancel",
                                            delay_duration: "PT12H",
                                            fulfillment_date: getDate(),
                                            id: v4(),
                                            order_ids: ["?"],
                                            payment_method: "Card",
                                            processing_fee: {quantity: 0.1, currency: 'NZD'},
                                            processor: {location: '001', employee: 'EMPLOYEE_ID', software_version: 'k0.5.2', token: 'dec05e7e-4228-46c2-8f87-8a01ee3ed5a9'},
                                            status: "Complete"
                                        }];

                                        // amount: {quantity: 115, currency: 'NZD'}
                                        // delay_action: "Cancel"
                                        // delay_duration: "PT12H"
                                        // fulfillment_date: "2023-01-11T07:58:58.244506404Z"
                                        // id: "dffc8e97-2c98-4deb-b2c3-e1f6350935e6"
                                        // order_id: "5982da33-1582-4f2f-994d-2f151c148f0e"
                                        // payment_method: "Card"
                                        // processing_fee: {quantity: 0.1, currency: 'NZD'}
                                        // processor: {location: '001', employee: 'EMPLOYEE_ID', software_version: 'k0.5.2', token: 'dec05e7e-4228-46c2-8f87-8a01ee3ed5a9'}
                                        // status: "Unfulfilled"

                                        setKioskState({
                                            ...kioskState,
                                            payment: new_payment
                                        });

                                        const qua = new_payment.reduce(function (prev, curr) {
                                            return prev + (curr.amount.quantity ?? 0)
                                        }, 0);

                                        if(qua < (kioskState.order_total ?? 0)) {
                                            setCurrentTransactionPrice((kioskState.order_total ?? 0) - qua)
                                            setPadState("select-payment-method")
                                        }else {
                                            setPadState("completed");

                                            const date = getDate();

                                            // Following state change is for an in-store purchase, modifications to status and destination are required for shipments
                                            // Fulfil the orders taken in-store and leave the others as open.
                                            const new_state: DbOrder[] = orderState.map(e => {
                                                if(e.order_type == "Direct") {
                                                    return {
                                                        ...e,
                                                        discount: toDbDiscount(e.discount),
                                                        origin: {
                                                            code: master_state.store_id,
                                                            contact: master_state.store_contact
                                                        },
                                                        destination: {
                                                            code: "000",
                                                            contact: customerState?.contact ?? master_state.store_contact
                                                        },
                                                        products: e.products.map(k => { return { discount: [toDbDiscount(findMaxDiscount(k.discount, k.variant_information.retail_price, !(!customerState)).value)], product_cost: k.product_cost, product_code: k.product_code, quantity: k.quantity, variant: k.variant, id: k.id}}) as DbProductPurchase[],
                                                        status: {   
                                                            status: "Fulfilled",
                                                            assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                                                            timestamp: date
                                                        } as OrderStatus,
                                                        status_history: [
                                                            ...e.status_history as StatusHistory[],
                                                            {
                                                                item: {   
                                                                    status: "Fulfilled",
                                                                    assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                                                                    timestamp: date
                                                                } as OrderStatus,
                                                                reason: "",
                                                                timestamp: date
                                                            } as StatusHistory
                                                        ]
                                                    }
                                                }else {
                                                    return {
                                                        ...e,
                                                        discount: toDbDiscount(e.discount),
                                                        status: {   
                                                            status: "Queued",
                                                            assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                                                            timestamp: date
                                                        } as OrderStatus,
                                                        products: e.products.map(k => { return { discount: [toDbDiscount(findMaxDiscount(k.discount, k.variant_information.retail_price, !(!customerState)).value)], product_cost: k.product_cost, product_code: k.product_code, quantity: k.quantity, variant: k.variant, id: k.id}}) as DbProductPurchase[],
                                                        status_history: [
                                                            ...e.status_history as StatusHistory[],
                                                            {
                                                                item: {   
                                                                    status: "Queued",
                                                                    assigned_products: e.products.map<string>(e => { return e.id }) as string[],
                                                                    timestamp: date
                                                                } as OrderStatus,
                                                                reason: "",
                                                                timestamp: date
                                                            } as StatusHistory
                                                        ]
                                                    }
                                                }
                                            });

                                            // setOrderState(sortDbOrders(new_state));

                                            const transaction = {
                                                ...kioskState,
                                                customer: customerState?.id,
                                                payment: new_payment,
                                                products: sortDbOrders(new_state),
                                                order_date: date,
                                                salesperson: master_state.employee?.id ?? "",
                                                till: master_state.kiosk
                                            };
                                            
                                            console.log(transaction)

                                            fetch('http://127.0.0.1:8000/transaction', {
                                                method: "POST",
                                                body: JSON.stringify(transaction),
                                                credentials: "include",
                                                redirect: "follow"
                                            }).then(async k => {
                                                console.log(await k.json())
                                            })
                                        }
                                    }}>skip to completion</p>
                                </div>
                            )
                        case "completed":
                            return (
                                <div className="bg-gray-900 min-w-[550px] max-w-[550px] p-6 flex flex-col h-full gap-4">
                                    <div>
                                        <p className="text-gray-600">{customerState?.name ?? "Guest"}</p>
                                        <p className="text-white font-bold text-2xl">${kioskState.order_total}</p>
                                    </div>

                                    <div className="flex flex-col flex-1 gap-2">
                                        {
                                            orderState.map(n => {
                                                return (
                                                    <div key={`COMPLETE-${n.id}`}>
                                                        {
                                                            n.products?.map(e => {
                                                                return (
                                                                    <div key={`PRD${e.product_code}-${e.variant}`} className="flex flex-row items-center gap-8">
                                                                        <p className="text-white font-bold">{e.quantity}</p>
                
                                                                        <div className="flex flex-col gap-0 flex-1">
                                                                            <p className="text-white">{e.product.name}</p>
                                                                            <p className="text-gray-600">{e.variant_information.name}</p>
                                                                        </div>
                
                                                                        <p className="text-white font-bold">${applyDiscount(e.variant_information.retail_price * 1.15, findMaxDiscount(e.discount, e.variant_information.retail_price, !(!customerState)).value)?.toFixed(2)}</p>
                                                                    </div>
                                                                )
                                                            })
                                                        }
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                    
                                    <p className="text-gray-600">PAYMENT(S)</p>
                                    <div className="flex flex-col gap-2 w-full">
                                        {
                                            kioskState.payment.map(e => {
                                                return (
                                                    <div key={`${e.amount}-${e.fulfillment_date}-${e.payment_method}`} className="flex flex-row justify-between items-center text-white gap-4 w-full flex-1">
                                                        <p className="text-gray-300 font-bold">{e.payment_method?.toUpperCase()}</p>
                                                        <hr className="flex-1 border-gray-500 h-[3px] border-[2px] bg-gray-500 rounded-md" />
                                                        <p>${e.amount?.quantity.toFixed(2)}</p>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>

                                    <br />
                                    
                                    <p className="text-gray-600">RECEIPT OPTIONS</p>
                                    <div className="flex flex-row items-center justify-between">
                                        <p className="bg-gray-700 text-white px-4 py-2 rounded-md cursor-pointer">Print receipt</p>
                                        
                                        {
                                            customerState?.contact.email ?
                                            <p className="bg-gray-700 text-white px-4 py-2 rounded-md cursor-pointer">Email receipt</p>
                                            :
                                            <p className="bg-gray-800 text-gray-400 px-4 py-2 rounded-md select-none">Email receipt</p>
                                        }

                                        {
                                            customerState?.contact.mobile ?
                                            <p className="bg-gray-700 text-white px-4 py-2 rounded-md cursor-pointer">Text receipt</p>
                                            :
                                            <p className="bg-gray-800 text-gray-400 px-4 py-2 rounded-md select-none">Text receipt</p>
                                        }
                                        
                                        <p className="bg-gray-700 text-white px-4 py-2 rounded-md cursor-pointer">Gift receipt</p>
                                    </div>

                                    <div className="flex flex-row items-center gap-4">
                                        <div
                                            onClick={() => {
                                                setKioskState({
                                                    customer: null,
                                                    transaction_type: "Out",
                                                    products: [],
                                                    order_total: null,
                                                    payment: [],
                                                    order_date: null,
                                                    order_notes: null,
                                                    salesperson: null,
                                                    till: null
                                                })
                                                
                                                setOrderState([{
                                                    id: v4(),
                                                    destination: null,
                                                    origin: {
                                                        contact: master_state.store_contact,
                                                        code: master_state.store_id
                                                    },
                                                    products: [],
                                                    status: {
                                                        status: "Queued",
                                                        assigned_products: [],
                                                        timestamp: getDate()
                                                    },
                                                    status_history: [],
                                                    order_history: [],
                                                    order_notes: [],
                                                    reference: "",
                                                    creation_date: getDate(),
                                                    discount: "a|0",
                                                    order_type: "Direct",
                                                    previous_failed_fulfillment_attempts: []
                                                }])
                                                
                                                setCustomerState(null)
                                            
                                                setPadState("cart")
                                            }} 
                                            className={`${orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) > 0 ? "bg-blue-700 cursor-pointer" : "bg-blue-700 bg-opacity-10 opacity-20"} w-full rounded-md p-4 flex items-center justify-center`}>
                                            <p className={`text-white font-semibold ${""}`}>Complete</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        case "discount":
                            return (
                                <div className="bg-gray-900 min-w-[550px] max-w-[550px] p-6 flex flex-col h-full justify-between flex-1">
                                    <div className="flex flex-row justify-between cursor-pointer">
                                        <div 
                                            onClick={() => {
                                                setPadState("cart")
                                            }}
                                            className="flex flex-row items-center gap-2"
                                        >
                                            <Image src="/icons/arrow-narrow-left.svg" height={20} width={20} alt="" />
                                            <p className="text-gray-400">Back</p>
                                        </div>
                                        <p className="text-gray-400">Select Discount</p>
                                    </div>

                                    <DiscountMenu discountGroup={[ discount, setDiscount ]} callback={(dcnt: {
                                        type: "absolute" | "percentage",
                                        product: VariantInformation | null,
                                        value: number,
                                        for: "cart" | "product",
                                        exclusive: boolean
                                    }) => {
                                        setPadState("cart")

                                        if(dcnt.for == "product") {
                                            if(dcnt.exclusive) {
                                                let overflow_quantity = 0;
                                                let overflow_product: (ProductPurchase | null) = null;

                                                const new_state = orderState.map(n => {
                                                    //?? impl! Add option to only apply to a product in a SINGLE order, as opposed to the same item mirrored across multiple orders...?
                                                    let new_products = n.products.map(e => {
                                                        if(e.variant_information.barcode == dcnt.product?.barcode) {
                                                            if(e.quantity > 1) {
                                                                overflow_quantity = e.quantity - 1
                                                                overflow_product = e
                                                            }
    
                                                            return {
                                                                ...e,
                                                                quantity: 1,
                                                                discount: [
                                                                    // Will replace any currently imposed discounts
                                                                    ...e.discount.filter(e => {
                                                                        return e.source !== "user"
                                                                    }),
                                                                    {
                                                                        source: "user",
                                                                        value: `${dcnt.type == "absolute" ? "a" : "p"}|${dcnt.value}` 
                                                                    } as DiscountValue
                                                                ]
                                                            };
                                                        } else return e;
                                                    });
    
                                                    if(overflow_product !== null) {
                                                        new_products.push({
                                                            ...overflow_product as ProductPurchase,
                                                            quantity: overflow_quantity,
                                                            id: v4()
                                                        })
                                                    }

                                                    return {
                                                        ...n,
                                                        products: new_products
                                                    }
                                                })

                                                setOrderState(sortOrders(new_state))
                                            }else {
                                                const new_state = orderState.map(n => {
                                                    return {
                                                        ...n,
                                                        products: n.products.map(e => {
                                                            if(e.variant_information.barcode == dcnt.product?.barcode) {
                                                                return {
                                                                    ...e,
                                                                    discount: [
                                                                        // Will replace any currently imposed discounts
                                                                        ...e.discount.filter(e => {
                                                                            return e.source !== "user"
                                                                        }),
                                                                        {
                                                                            source: "user",
                                                                            value: `${dcnt.type == "absolute" ? "a" : "p"}|${dcnt.value}` 
                                                                        } as DiscountValue
                                                                    ]
                                                                };
                                                            } else return e;
                                                        })
                                                    }
                                                });

                                                setOrderState(sortOrders(new_state))
                                            }
                                        }else {
                                            const new_state = orderState.map(n => {
                                                return {
                                                    ...n,
                                                    discount: `${dcnt.type == "absolute" ? "a" : "p"}|${dcnt.value}`
                                                }
                                            });

                                            setOrderState(sortOrders(new_state))
                                        }
                                    }} multiple={orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) > 0} />
                                </div>
                            )
                        case "await-cash":
                            // On completion of this page, ensure all payment segments are made, i.e. if a split payment is forged, return to the payment select screen with the new amount to complete the payment. 
                            return (
                                <div className="bg-blue-500 min-w-[550px] max-w-[550px] p-6 flex flex-col h-full items-center">
                                    <div className="flex flex-row justify-between cursor-pointer w-full">
                                        <div 
                                            onClick={() => {
                                                setPadState("select-payment-method")
                                            }}
                                            className="flex flex-row items-center gap-2"
                                        >
                                            <Image src="/icons/arrow-narrow-left (1).svg" height={20} width={20} alt="" style={{ filter: "invert(100%) sepia(99%) saturate(0%) hue-rotate(119deg) brightness(110%) contrast(101%)" }} />
                                            <p className="text-white">Back</p>
                                        </div>
                                        <p className="text-white">Awaiting Customer Payment</p>
                                    </div>
                                    
                                    <CashSelect totalCost={currentTransactionPrice ?? 0} changeCallback={(_val: number, deg: number) => {
                                        setCashContinuable(deg >= 0)
                                    }} />

                                    <div className="flex w-full flex-row items-center gap-4 cursor-pointer">
                                        <div
                                            className={`${cashContinuable ? "bg-white" : "bg-blue-400"} w-full rounded-md p-4 flex items-center justify-center`}
                                            onClick={() => {
                                                // const new_payment = [ ...kioskState.payment, {
                                                //     payment_method: "cash",
                                                //     fulfillment_date: new Date().toString(),
                                                //     amount: currentTransactionPrice
                                                // }];

                                                const new_payment: PaymentIntent[] = [ ...kioskState.payment, {
                                                    amount: {quantity: currentTransactionPrice ?? 0, currency: 'NZD'},
                                                    delay_action: "Cancel",
                                                    delay_duration: "PT12H",
                                                    fulfillment_date: getDate(),
                                                    id: v4(),
                                                    order_ids: ["?"],
                                                    payment_method: "Card",
                                                    processing_fee: {quantity: 0.1, currency: 'NZD'},
                                                    processor: {location: '001', employee: 'EMPLOYEE_ID', software_version: 'k0.5.2', token: 'dec05e7e-4228-46c2-8f87-8a01ee3ed5a9'},
                                                    status: "Complete"
                                                }];
        
                                                setKioskState({
                                                    ...kioskState,
                                                    payment: new_payment
                                                });
        
                                                const qua = new_payment.reduce(function (prev, curr) {
                                                    return prev + (curr.amount.quantity ?? 0)
                                                }, 0);
        
                                                if(qua < (kioskState.order_total ?? 0)) {
                                                    setCurrentTransactionPrice((kioskState.order_total ?? 0) - qua)
                                                    setPadState("select-payment-method")
                                                }else {
                                                    setPadState("completed")
                                                }
                                            }}
                                            >
                                            <p className={`${cashContinuable ? "text-blue-600" : "text-blue-500"} font-semibold ${""}`}>Complete</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        case "note":
                            return (
                                <div className="bg-gray-900 max-h-[calc(100vh - 18px)] min-w-[550px] max-w-[550px] p-6 flex flex-col h-full justify-between flex-1 gap-8">
                                    <div className="flex flex-row justify-between cursor-pointer">
                                        <div 
                                            onClick={() => {
                                                setPadState("cart")
                                            }}
                                            className="flex flex-row items-center gap-2"
                                        >
                                            <Image src="/icons/arrow-narrow-left.svg" height={20} width={20} alt="" />
                                            <p className="text-gray-400">Back</p>
                                        </div>
                                        <p className="text-gray-400">Add Note</p>
                                    </div>
                                    
                                    
                                    <NotesMenu notes={orderState} callback={(active_order: string, note: string) => {
                                        if(master_state?.employee) {
                                            const note_obj: Note = {
                                                message: note,
                                                timestamp: getDate(),
                                                author: master_state?.employee
                                            }

                                            const new_order_state = orderState.map(e => e.id == active_order ? { ...e, order_notes: [...e.order_notes, note_obj] } : e)
                                            setOrderState(sortOrders(new_order_state))
                                        }
                                    }} />
                                </div>
                            )
                        case "pickup-from-store":
                            return (
                                customerState ? 
                                <PickupMenu orderJob={[ orderState, setOrderState ]} customerJob={[ customerState, setCustomerState ]} setPadState={setPadState} currentStore={master_state.store_id} />
                                :
                                <div className="bg-gray-900 max-h-[calc(100vh - 18px)] min-w-[550px] max-w-[550px] p-6 flex flex-col h-full justify-between flex-1 gap-8">
                                    <div className="flex flex-row justify-between cursor-pointer">
                                        <div 
                                            onClick={() => {
                                                setPadState("cart")
                                            }}
                                            className="flex flex-row items-center gap-2"
                                        >
                                            <Image src="/icons/arrow-narrow-left.svg" height={20} width={20} alt="" />
                                            <p className="text-gray-400">Back</p>
                                        </div>
                                        <p className="text-gray-400">Pickup from Store</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-center flex-1 gap-8 flex-col">
                                        <p className="text-gray-400">Must have an assigned customer to pickup products.</p>

                                        <div 
                                            onClick={() => {
                                                setResult([]); 
                                                setSearchType("customer");    

                                                input_ref.current?.value ? input_ref.current.value = "" : {};
                                                input_ref.current?.focus()
                                            }}
                                            className="bg-gray-800 text-white rounded-md px-2 py-[0.1rem] flex flex-row items-center gap-2 cursor-pointer">
                                            <p>Select Customer</p>
                                            <Image 
                                                className=""
                                                height={15} width={15} src="/icons/arrow-narrow-right.svg" alt="" style={{ filter: "invert(100%) sepia(5%) saturate(7417%) hue-rotate(235deg) brightness(118%) contrast(101%)" }}></Image>
                                        </div>
                                    </div>
                                </div>
                            )
                        case "ship-to-customer":
                            return (
                                    customerState ? 
                                    <DispatchMenu orderJob={[ orderState, setOrderState ]} customerJob={[ customerState, setCustomerState ]} setPadState={setPadState} currentStore={master_state.store_id} />
                                    :
                                    <div className="bg-gray-900 max-h-[calc(100vh - 18px)] min-w-[550px] max-w-[550px] p-6 flex flex-col h-full justify-between flex-1 gap-8">
                                        <div className="flex flex-row justify-between cursor-pointer">
                                            <div 
                                                onClick={() => {
                                                    setPadState("cart")
                                                }}
                                                className="flex flex-row items-center gap-2"
                                            >
                                                <Image src="/icons/arrow-narrow-left.svg" height={20} width={20} alt="" />
                                                <p className="text-gray-400">Back</p>
                                            </div>
                                            <p className="text-gray-400">Ship order to customer</p>
                                        </div>
                                        
                                        
                                        <div className="flex items-center justify-center flex-1 gap-8 flex-col">
                                            <p className="text-gray-400">Must have an assigned customer to send products.</p>

                                            <div 
                                                onClick={() => {
                                                    setResult([]); 
                                                    setSearchType("customer");    

                                                    input_ref.current?.value ? input_ref.current.value = "" : {};
                                                    input_ref.current?.focus()
                                                }}
                                                className="bg-gray-800 text-white rounded-md px-2 py-[0.1rem] flex flex-row items-center gap-2 cursor-pointer">
                                                <p>Select Customer</p>
                                                <Image 
                                                    className=""
                                                    height={15} width={15} src="/icons/arrow-narrow-right.svg" alt="" style={{ filter: "invert(100%) sepia(5%) saturate(7417%) hue-rotate(235deg) brightness(118%) contrast(101%)" }}></Image>
                                            </div>
                                        </div>
                                    </div>
                            )
                    }
                })()
            }
        </>
    )
}

function sortOrders(orders: Order[]) {
    return orders.sort((a, b) => a.order_type == "Direct" ? -1 : 0)
}

function sortDbOrders(orders: DbOrder[]) {
    return orders.sort((a, b) => a.order_type == "Direct" ? -1 : 0)
}

export function getDate(): string {
    return new Date().toString()
    // return moment(new Date()).format()
}