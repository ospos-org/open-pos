import Image from "next/image";
import { createRef, useEffect, useMemo, useRef, useState } from "react";
import { debounce, divide, isEqual, uniqueId, values } from "lodash";
import { ReactBarcodeReader } from "./scanner";
import BarcodeReader from 'react-barcode-reader'
import CashSelect from "./cashSelect";
import { v4 } from "uuid"
import DiscountMenu from "./discountMenu";
import { ContactInformation, Customer, DbOrder, DbProductPurchase, DiscountValue, Employee, KioskState, MasterState, Note, Order, OrderStatus, PaymentIntent, Product, ProductPurchase, Promotion, StatusHistory, StrictVariantCategory, Transaction, TransactionInput, VariantInformation } from "./stock-types";
import NotesMenu from "./notesMenu";
import { applyDiscount, findMaxDiscount, fromDbDiscount, isEquivalentDiscount, isValidVariant, parseDiscount, stringValueToObj, toAbsoluteDiscount, toDbDiscount } from "./discount_helpers";
import PaymentMethod from "./paymentMethodMenu";
import DispatchMenu from "./dispatchMenu";
import PickupMenu from "./pickupMenu";
import { customAlphabet } from "nanoid";
import CartMenu from "./cartMenu";
import KioskMenu from "./kioskMenu";
import moment from "moment"
import TransactionMenu from "./transactionMenu";
import {fileTransaction, OPEN_STOCK_URL, resetOrder, useWindowSize} from "./helpers";
import CustomerMenu from "./customerMenu";
import RelatedOrders from "./relatedMenu";

export default function Kiosk({ master_state, setLowModeCartOn, lowModeCartOn }: { master_state: MasterState, setLowModeCartOn: Function, lowModeCartOn: boolean }) {
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
            store_code: master_state.store_id,
            store_id: master_state.store_id,
            contact: master_state.store_contact
        },
        products: [],
        status: {
            status: {
                Queued: getDate()
            },
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
    const [ padState, setPadState ] = useState<"cart" | "customer" | "related-orders" | "customer-create" | "inv-transaction" | "select-payment-method" | "await-debit" | "await-cash" | "completed" | "discount" | "note" | "ship-to-customer" | "pickup-from-store">("cart");
    const [ previousPadState, setPreviousPadState ] = useState<"cart" | "customer" | "related-orders" | "customer-create" | "inv-transaction" | "select-payment-method" | "await-debit" | "await-cash" | "completed" | "discount" | "note" | "ship-to-customer" | "pickup-from-store">("cart");

    const [ activeProduct, setActiveProduct ] = useState<Product | null>(null);
    const [ activeVariant, setActiveVariant ] = useState<StrictVariantCategory[] | null>(null);
    const [ activeProductVariant, setActiveProductVariant ] = useState<VariantInformation | null>(null);
    const [ activeVariantPossibilities, setActiveVariantPossibilities ] = useState<(StrictVariantCategory[] | null)[] | null>(null);
    const [ activeCustomer, setActiveCustomer ] = useState<Customer | null>(null);

    const [ searchTermState, setSearchTermState ] = useState("");
    const [ result, setResult ] = useState<{ product: Product, promotions: Promotion[]}[] | Customer[] | Transaction[]>([]);
    const [ searchFocused, setSearchFocused ] = useState(false); 

    const [ discount, setDiscount ] = useState<{
        type: "absolute" | "percentage",
        product: VariantInformation | null,
        value: number,
        for: "cart" | "product",
        exclusive: boolean,
        orderId: string
    }>({
        type: "absolute",
        for: "product",
        product: null,
        value: 0.00,
        exclusive: false,
        orderId: ""
    })

    const [ currentTransactionPrice, setCurrentTransactionPrice ] = useState<number | null>(null);
    const [ cashContinuable, setCashContinuable ] = useState(false);
    const [ currentViewedTransaction, setCurrentViewedTransaction ] = useState<[Transaction, string] | null>(); 
    const [ activeProductPromotions, setActiveProductPromotions ] = useState<Promotion[]>();

    const addToCart = (product: Product, promotions: Promotion[], variant: VariantInformation, orderProducts: ProductPurchase[]) => {
        const existing_product = orderProducts.find(k => k.product_code == variant.barcode ); // && isEqual(k.variant, variant?.variant_code)
        let new_order_products_state = [];

        if(existing_product) {
            // Editing the quantity of an existing product in the order.
            // if(e.product_code == product.sku && isEqual(e.variant, variant?.variant_code)) {
                    // if(findMaxDiscount(e.discount, e.variant_information.retail_price, true) !== findMaxDiscount([ { source: "loyalty", value: fromDbDiscount(variant.loyalty_discount) } ], e.variant_information.retail_price, true)) {
                        // return e;
                    // }else {
                    // }
                // }

            const matching_product = orderProducts.find(e => e.product_code == variant.barcode); // && (applyDiscount(1, findMaxDiscount(e.discount, e.variant_information.retail_price, false).value) == 1)
            
            if(matching_product) {
                const total_stock = matching_product.variant_information.stock.reduce((p, c) => p += (c.quantity.quantity_sellable), 0);
                // If a matching product exists; apply emendation
                new_order_products_state = orderProducts.map(e => {
                    if(total_stock <= e.quantity) return e;

                    return e.product_code == variant.barcode ? { ...e, quantity: e.quantity+1 } : e  //  && (applyDiscount(1, findMaxDiscount(e.discount, e.variant_information.retail_price, false).value) == 1)
                });
            }else {
                const po: ProductPurchase = {
                    id: v4(),
                    product_code: variant.barcode ?? product.sku ?? "",
                    discount: [{
                        source: "loyalty",
                        value: fromDbDiscount(variant.loyalty_discount),
                        applicable_quantity: -1
                    }],
                    product_cost: variant?.retail_price ?? 0,
                    product_name: product.company + " " + product.name,
                    product_variant_name: variant.name,
                    product_sku: product.sku,
                    quantity: 1,
                    transaction_type: "Out",

                    product: product,
                    variant_information: variant ?? product.variants[0],
                    active_promotions: promotions,

                    tags: product.tags 
                };
    
                new_order_products_state = [ ...orderProducts, po ]
            }
        }else {
            // Creating a new product in the order.
            const po: ProductPurchase = {
                id: v4(),
                product_code: variant.barcode ?? product.sku ?? "",
                discount: [{
                    source: "loyalty",
                    value: fromDbDiscount(variant.loyalty_discount),
                    applicable_quantity: -1
                }],
                product_cost: variant?.retail_price ?? 0,
                product_name: product.company + " " + product.name,
                product_variant_name: variant.name,
                product_sku: product.sku,
                quantity: 1,
                transaction_type: "Out",

                product: product,
                variant_information: variant ?? product.variants[0],
                active_promotions: promotions,

                tags: product.tags
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
                        non_diminishing: false,
                        shippable: true
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
                exclusive: false,
                orderId: ""
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
    
            const fetchResult = await fetch(`${OPEN_STOCK_URL}/${searchType}/${searchType == "transaction" ? "ref" : searchType == "product" ? "search/with_promotions" : "search"}/${searchTerm.trim()}`, {
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

                    const new_pdt_list = addToCart(e, data[0].promotions, active_product_variant, cOs.products);
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
    const [ triggerRefresh, setTriggerRefresh ] = useState(["a"]);

    const window_size = useWindowSize();
    

    useEffect(() => {
        return () => {
            debouncedResults.cancel();
        };
    });

    return (
        <>
            {/* <ReactKeyboardShortcuts></ReactKeyboardShortcuts> */}
            <ReactBarcodeReader
                onScan={(e: any) => {
                    setSearchFocused(false);
                    input_ref.current?.value ? input_ref.current.value = e : {};

                    setSearchType("product");
                    debouncedResults(e, "product");
                }}
                onError={() => {}}
            />

            {
                ((window_size.width ?? 0) < 640 && lowModeCartOn) || ((window_size.width ?? 0) < 640 && padState !== "cart") ?
                    <></>
                    :
                    <KioskMenu
                        setSearchFocused={setSearchFocused} searchFocused={searchFocused}
                        setActiveProduct={setActiveProduct} activeProduct={activeProduct}
                        setActiveCustomer={setActiveCustomer} activeCustomer={activeCustomer}
                        setSearchType={setSearchType} searchType={searchType}
                        setCustomerState={setCustomerState} customerState={customerState}
                        setOrderState={setOrderState} orderState={orderState}
                        setTriggerRefresh={setTriggerRefresh} triggerRefresh={triggerRefresh}
                        setActiveProductPromotions={setActiveProductPromotions} activeProductPromotions={activeProductPromotions ?? []}
                        setSearchTermState={setSearchTermState} searchTermState={searchTermState}
                        setActiveVariantPossibilities={setActiveVariantPossibilities} activeVariantPossibilities={activeVariantPossibilities}
                        setActiveVariant={setActiveVariant} activeVariant={activeVariant}
                        setCurrentViewedTransaction={setCurrentViewedTransaction} currentViewedTransaction={currentViewedTransaction ?? null}
                        setKioskState={setKioskState} kioskState={kioskState}
                        setPadState={setPadState} padState={padState}
                        setPreviousPadState={setPreviousPadState}
                        setDiscount={setDiscount}
                        setActiveProductVariant={setActiveProductVariant} activeProductVariant={activeProductVariant}
                        lowModeCartOn={lowModeCartOn} setLowModeCartOn={setLowModeCartOn}
                        setResult={setResult} result={result}
                        input_ref={input_ref} master_state={master_state}
                        addToCart={addToCart}
                        debouncedResults={debouncedResults}
                    />
            }

            {
                ((window_size.width ?? 0) < 640 && lowModeCartOn) || ((window_size.width ?? 0) >= 640) || (padState !== "cart") ?
                (() => {
                    switch(padState) {
                        case "cart":
                            return (
                                <CartMenu
                                    setActiveProductPromotions={setActiveProductPromotions}
                                    customerState={customerState}
                                    setCustomerState={setCustomerState} 
                                    orderState={orderState}
                                    setTriggerRefresh={setTriggerRefresh} triggerRefresh={triggerRefresh}
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
                        case "customer":
                            return (
                                <CustomerMenu 
                                    defaultValue={customerState} setCustomerState={setCustomerState}
                                    setActiveCustomer={setActiveCustomer} activeCustomer={activeCustomer}
                                    setPadState={setPadState} 
                                    create={false}
                                    />
                            )
                        case "customer-create":
                            return (
                                <CustomerMenu 
                                    defaultValue={null} setCustomerState={setCustomerState}
                                    setActiveCustomer={setActiveCustomer} activeCustomer={activeCustomer}
                                    setPadState={setPadState} 
                                    create={true}
                                    />
                            )
                        case "related-orders":
                            return (
                                <RelatedOrders
                                    setPadState={setPadState} setPreviousPadState={setPreviousPadState} 
                                    activeProductVariant={activeProductVariant}
                                    setCurrentViewedTransaction={setCurrentViewedTransaction} currentViewedTransaction={currentViewedTransaction}
                                    />
                            )
                        case "select-payment-method":
                            return (
                                <PaymentMethod 
                                    customerState={customerState} 
                                    setPadState={setPadState} 
                                    orderState={orderState} 
                                    master_state={master_state}
                                    kioskState={kioskState} setKioskState={setKioskState}
                                    ctp={[ currentTransactionPrice, setCurrentTransactionPrice ]} 
                                    />
                            )
                        case "inv-transaction":
                            return (
                                <div className="bg-gray-900 p-6 flex flex-col h-full gap-4" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
                                    <div className="flex flex-row justify-between cursor-pointer">
                                        <div 
                                            onClick={() => {
                                                if(previousPadState == "related-orders") setPadState("related-orders")
                                                else setPadState("cart")
                                            }}
                                            className="flex flex-row items-center gap-2"
                                        >
                                            <Image src="/icons/arrow-narrow-left.svg" height={20} width={20} alt="" />
                                            <p className="text-gray-400">Back</p>
                                        </div>
                                        <p className="text-gray-400">Transaction</p>
                                    </div>

                                    <TransactionMenu transaction={currentViewedTransaction ?? null} />
                                </div>
                            )
                        case "await-debit":
                            // On completion of this page, ensure all payment segments are made, i.e. if a split payment is forged, return to the payment select screen with the new amount to complete the payment. 
                            return (
                                <div className="bg-blue-500 p-6 flex flex-col h-full items-center" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
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
                                            status: {
                                                Complete: {
                                                    CardDetails: {
                                                        card_brand: "VISA",
                                                        last_4: "4025",
                                                        exp_month: "03",
                                                        exp_year: "2023",
                                                        fingerprint: "a20@jA928ajsf9a9828",
                                                        card_type: "DEBIT",
                                                        prepaid_type: "NULL",
                                                        bin: "",

                                                        entry_method: "PIN",
                                                        cvv_accepted: "TRUE",
                                                        avs_accepted: "TRUE",
                                                        auth_result_code: "YES",
                                                        statement_description: "DEBIT ACCEPTED",
                                                        card_payment_timeline: {
                                                            authorized_at: "",
                                                            captured_at: ""
                                                        }
                                                    }
                                                }
                                            }
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

                                        const transaction = fileTransaction(new_payment, setKioskState, kioskState, setCurrentTransactionPrice, setPadState, orderState, master_state, customerState);

                                        if(transaction) {
                                            fetch(`${OPEN_STOCK_URL}/transaction`, {
                                                method: "POST",
                                                body: JSON.stringify(transaction),
                                                credentials: "include",
                                                redirect: "follow"
                                            }).then(async k => {
                                                if(k.ok) {
                                                    setPadState("completed");
                                                }else {
                                                    alert("Something went horribly wrong")
                                                }
                                            })
                                        }
                                    }}>skip to completion</p>
                                </div>
                            )
                        case "completed":
                            return (
                                <div className="bg-gray-900 p-6 flex flex-col h-full gap-4" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
                                    <div>
                                        <p className="text-gray-600">{customerState?.name ?? "Guest"}</p>
                                        <p className="text-white font-bold text-2xl">${kioskState.order_total}</p>

                                        {kioskState.transaction_type == "Quote" ? <p>Quote</p>: <></>}
                                    </div>

                                    <div className="flex flex-col flex-1 gap-2">
                                        {
                                            orderState.map(n => {
                                                return (
                                                    <div key={`COMPLETE-${n.id}`}>
                                                        {
                                                            n.products?.map(e => {
                                                                return (
                                                                    <div key={`PRD${e.product_code}-${e.id}`} className="flex flex-row items-center gap-8">
                                                                        <p className="text-white font-bold">{e.quantity}</p>
                
                                                                        <div className="flex flex-col gap-0 flex-1">
                                                                            <p className="text-white">{e.product.name}</p>
                                                                            <p className="text-gray-600">{e.variant_information.name}</p>
                                                                        </div>
                
                                                                        <p className="text-white font-bold">${applyDiscount(e.variant_information.retail_price * 1.15, findMaxDiscount(e.discount, e.variant_information.retail_price, !(!customerState))[0].value)?.toFixed(2)}</p>
                                                                    </div>
                                                                )
                                                            })
                                                        }
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                    
                                    {
                                        kioskState.transaction_type != "Quote" ?
                                        <>
                                            <p className="text-gray-600">PAYMENT(S)</p>
                                            <div className="flex flex-col gap-2 w-full">
                                                {
                                                    kioskState.payment.map(e => {
                                                        return (
                                                            <div key={`${e.amount}-${e.fulfillment_date}-${e.payment_method}`} className="flex flex-row justify-between items-center text-white gap-4 w-full flex-1">
                                                                <p className="text-gray-300 font-bold">{JSON.stringify(e.payment_method)}</p>
                                                                <hr className="flex-1 border-gray-500 h-[3px] border-[2px] bg-gray-500 rounded-md" />
                                                                <p>${e.amount?.quantity.toFixed(2)}</p>
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </div>
                                        </>
                                        :
                                        <></>
                                    }

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
                                                resetOrder(setKioskState, setOrderState, setCustomerState, setPadState, master_state);
                                            }} 
                                            className={`${orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) > 0 ? "bg-blue-700 cursor-pointer" : "bg-blue-700 bg-opacity-10 opacity-20"} w-full rounded-md p-4 flex items-center justify-center`}>
                                            <p className={`text-white font-semibold ${""}`}>Complete</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        case "discount":
                            return (
                                <div className="bg-gray-900 p-6 flex flex-col h-full justify-between flex-1" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
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
                                        exclusive: boolean,
                                        order_id: string
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

                                                    // Merge any new duplicate products with the same discount.
                                                    const merged = new_products.map((p, i) => {
                                                        console.log(`${p.product_name}: Product Match? `);

                                                        const indx = new_products.findIndex(a => 
                                                            a.variant_information.barcode == p.variant_information.barcode
                                                            && isEquivalentDiscount(
                                                                findMaxDiscount(a.discount, a.product_cost, customerState != null)[0], 
                                                                findMaxDiscount(p.discount, p.product_cost, customerState != null)[0],
                                                                p.product_cost
                                                            )
                                                        );

                                                        if(
                                                            indx != -1 && indx != i
                                                        ) {
                                                            //... Merge the values!
                                                            return {
                                                                ...p,
                                                                quantity: p.quantity + new_products[indx].quantity
                                                            };
                                                        }else {
                                                            return p;
                                                        }
                                                    });

                                                    if(overflow_product !== null) {
                                                        // !impl check and compare discount values so quantity does not increase for non-similar product 
                                                        const indx = new_products.findIndex(a => 
                                                            a.variant_information.barcode == overflow_product?.variant_information.barcode
                                                            && isEquivalentDiscount(
                                                                findMaxDiscount(a.discount, a.product_cost, customerState != null)[0], 
                                                                findMaxDiscount(overflow_product.discount, overflow_product.product_cost, customerState != null)[0],
                                                                overflow_product.product_cost
                                                            )
                                                        );

                                                        console.log("Dealing with overflow value, ", indx);
                                                        
                                                        // If overflow product already exists (in exact kind), increase quantity - otherwise ...
                                                        if(indx != -1) {
                                                            merged[indx].quantity += overflow_quantity;
                                                        }else {
                                                            merged.push({
                                                                ...overflow_product as ProductPurchase,
                                                                quantity: overflow_quantity,
                                                                id: v4()
                                                            })
                                                        }
                                                    }

                                                    return {
                                                        ...n,
                                                        products: merged.filter(b => b !== null) as ProductPurchase[]
                                                    }
                                                })

                                                setOrderState(sortOrders(new_state))
                                            }else {
                                                const new_state = orderState.map(n => {
                                                    let clone = [...n.products] as ProductPurchase[];

                                                    for(let i = 0; i < clone.length; i++) {
                                                        let e = clone[i];
                                                        if(e == null) continue;

                                                        const indx = clone.findIndex((a, ind) => 
                                                            a != null && i != ind &&
                                                            a.variant_information.barcode == e?.variant_information.barcode
                                                            && isEquivalentDiscount(
                                                                findMaxDiscount([{
                                                                    source: "user",
                                                                    value: `${dcnt.type == "absolute" ? "a" : "p"}|${dcnt.value}` 
                                                                } as DiscountValue], a.product_cost, customerState != null)[0], 
                                                                findMaxDiscount(e.discount, e.product_cost, customerState != null)[0],
                                                                e.product_cost
                                                            )
                                                        );

                                                        console.log(`Value at ${i}, has index ${indx}, name ${e.product_name}`);
                                                        
                                                        if(indx != -1) {
                                                            clone[indx].quantity += e.quantity;
                                                            //@ts-ignore
                                                            clone[i] = null;
                                                            continue;
                                                        }

                                                        if(e.variant_information.barcode == dcnt.product?.barcode) {
                                                            clone[i] = {
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
                                                        }
                                                    }

                                                    return {
                                                        ...n,
                                                        products: clone.filter(b => b != null) as ProductPurchase[]
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
                                <div className="bg-blue-500 p-6 flex flex-col h-full items-center" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
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
                                                    status: { 
                                                        Complete: {
                                                            CardDetails: {
                                                                card_brand: "VISA",
                                                                last_4: "4025",
                                                                exp_month: "03",
                                                                exp_year: "2023",
                                                                fingerprint: "a20@jA928ajsf9a9828",
                                                                card_type: "DEBIT",
                                                                prepaid_type: "NULL",
                                                                bin: "",
            
                                                                entry_method: "PIN",
                                                                cvv_accepted: "TRUE",
                                                                avs_accepted: "TRUE",
                                                                auth_result_code: "YES",
                                                                statement_description: "DEBIT ACCEPTED",
                                                                card_payment_timeline: {
                                                                    authorized_at: "",
                                                                    captured_at: ""
                                                                }
                                                            }
                                                        }
                                                    }
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
                                <div className="bg-gray-900 max-h-[calc(100vh - 18px)] p-6 flex flex-col h-full justify-between flex-1 gap-8" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
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
                                                author: master_state?.employee.id ?? ""
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
                                <PickupMenu master_state={master_state} orderJob={[ orderState, setOrderState ]} customerJob={[ customerState, setCustomerState ]} setPadState={setPadState} currentStore={master_state.store_id} />
                                :
                                <div className="bg-gray-900 max-h-[calc(100vh - 18px)] p-6 flex flex-col h-full justify-between flex-1 gap-8" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
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
                                <DispatchMenu master_state={master_state} orderJob={[ orderState, setOrderState ]} customerJob={[ customerState, setCustomerState ]} setPadState={setPadState} currentStore={master_state.store_id} />
                                :
                                <div className="bg-gray-900 max-h-[calc(100vh - 18px)] p-6 flex flex-col h-full justify-between flex-1 gap-8" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
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
                :
                <></>
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
    // return new Date().toString()
    return moment(new Date(), 'DD/MM/YYYY', true).format()
}

function unite(...data: any[]) {
    return [].concat.apply([], data).reduce((result, current) => {
      return ~result.indexOf(current)
      ? result
      : result.concat(current)
    }, []);
}