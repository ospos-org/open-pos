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
import PickupMenu from "./pickupMenu";
import { customAlphabet } from "nanoid";
import CartMenu from "./cartMenu";
import KioskMenu from "./kioskMenu";

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
        reference: `RF${customAlphabet(`1234567890abcdef`, 10)(8)}`,
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
                    id: "",
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
    
            const fetchResult = await fetch(`http://127.0.0.1:8000/${searchType}/${searchType == "transaction" ? "ref" : "search/with_promotions"}/${searchTerm}`, {
                method: "GET",
                headers: myHeaders,
                redirect: "follow",
                credentials: "include"
            });
    
            const data: { product: any, promotions: any[] }[] = await fetchResult.json();

            console.log(data);

            if(data.length == 1 && searchType == "product") {
                const e: Product = data[0].product;

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
    
            setResult(data.map(l => l.product));
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

            <KioskMenu 
                setSearchFocused={setSearchFocused} searchFocused={searchFocused}
                setActiveProduct={setActiveProduct} activeProduct={activeProduct}
                setSearchType={setSearchType} searchType={searchType}
                setCustomerState={setCustomerState} customerState={customerState}
                setOrderState={setOrderState} orderState={orderState}
                setSearchTermState={setSearchTermState} searchTermState={searchTermState}
                setActiveVariantPossibilities={setActiveVariantPossibilities} activeVariantPossibilities={activeVariantPossibilities}
                setActiveVariant={setActiveVariant} activeVariant={activeVariant}
                setPadState={setPadState}
                setDiscount={setDiscount}
                setActiveProductVariant={setActiveProductVariant} activeProductVariant={activeProductVariant}
                setResult={setResult} result={result}
                input_ref={input_ref} master_state={master_state}
                addToCart={addToCart}
                debouncedResults={debouncedResults}
            />

            {
                (() => {
                    switch(padState) {
                        case "cart":
                            return (
                                <CartMenu
                                    customerState={customerState}
                                    setCustomerState={setCustomerState} 
                                    orderState={orderState}
                                    setOrderState={setOrderState}
                                    setResult={setResult} 
                                    setSearchType={setSearchType} 
                                    master_state={master_state}
                                    setActiveProduct={setActiveProduct} 
                                    setActiveProductVariant={setActiveProductVariant}
                                    setPadState={setPadState}
                                    setDiscount={setDiscount}
                                    setKioskState={setKioskState}
                                    kioskState={kioskState}
                                    setCurrentTransactionPrice={setCurrentTransactionPrice}
                                    input_ref={input_ref}
                                />
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
                                                    payment_method: "Cash",
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

export function sortOrders(orders: Order[]) {
    return orders.sort((a, b) => a.order_type == "Direct" ? -1 : 0)
}

export function sortDbOrders(orders: DbOrder[]) {
    return orders.sort((a, b) => a.order_type == "Direct" ? -1 : 0)
}

export function getDate(): string {
    return new Date().toString()
    // return moment(new Date()).format()
}