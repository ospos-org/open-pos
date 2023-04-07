import { isEqual } from "lodash";
import moment from "moment";
import { customAlphabet } from "nanoid";
import Image from "next/image";
import { RefObject, useEffect, useState } from "react";
import useKey from "use-key";
import { v4 } from "uuid";
import { applyDiscount, findMaxDiscount, fromDbDiscount, isValidVariant, toDbDiscount } from "./discount_helpers";
import {computeOrder, OPEN_STOCK_URL, parkSale, resetOrder, useWindowSize} from "./helpers";
import { getDate, sortOrders } from "./kiosk";
import PromotionList from "./promotionList";
import { SavedTransactionItem } from "./savedTransactionItem";
import { SearchFieldTransaction } from "./searchFieldTransaction";
import { ContactInformation, Customer, DbOrder, DbProductPurchase, Employee, KioskState, Order, OrderStatus, Product, Promotion, StatusHistory, StrictVariantCategory, Transaction, TransactionInput, VariantInformation } from "./stock-types";

const BLOCK_SIZE = "sm:min-w-[250px] min-w-[49%]";

export default function KioskMenu({
    setSearchFocused, searchFocused,
    setActiveProduct, activeProduct,
    setSearchType, searchType,
    setCustomerState, customerState,
    setOrderState, orderState,
    setSearchTermState, searchTermState,
    setActiveProductPromotions, activeProductPromotions,
    setActiveVariantPossibilities, activeVariantPossibilities,
    setActiveVariant, activeVariant,
    setLowModeCartOn, lowModeCartOn,
    setKioskState, kioskState,
    setCurrentViewedTransaction, currentViewedTransaction,
    setTriggerRefresh, triggerRefresh,
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
    setLowModeCartOn: Function, lowModeCartOn: boolean,
    setCustomerState: Function, customerState: Customer | null,
    setResult: Function, result: { product: Product, promotions: Promotion[]}[] | Customer[] | Transaction[],
    setOrderState: Function, orderState: Order[],
    setActiveVariantPossibilities: Function, activeVariantPossibilities: (StrictVariantCategory[] | null)[] | null,
    setCurrentViewedTransaction: Function, currentViewedTransaction: [Transaction, string] | null,
    setKioskState: Function, kioskState: KioskState,
    setActiveProductPromotions: Function, activeProductPromotions: Promotion[],
    setPadState: Function,
    setDiscount: Function,
    setTriggerRefresh: Function, triggerRefresh: string[],
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
    const [ activeCustomer, setActiveCustomer ] = useState<Customer | null>(null);
    const [ editCustomerState, setEditCustomerState ] = useState(false);
    const [ activeCustomerTransactions, setActiveCustomerTransactions ] = useState<Transaction[] | null>(null);
    const [ activeTransactions, setActiveTransactions ] = useState<Transaction[] | null>(null);

    useKey({
        'Escape': () => { 
            setActiveProduct(null)
            setActiveProductVariant(null)
            setActiveVariant(null)
            // setCurrentViewedTransaction(null)
            setActiveCustomer(null)
            setSearchFocused(false)
        }
    })

    useEffect(() => {
        if(activeCustomer) {
            fetch(`${OPEN_STOCK_URL}/customer/transactions/${activeCustomer.id}`, {
                method: "GET",
				credentials: "include",
				redirect: "follow"
            }).then(async k => {
                if(k.ok) {
                    const data: Transaction[] = await k.json();

                    setActiveCustomerTransactions(data)
                }
            })
        }
    }, [activeCustomer]);

    const MINUTE_MS = 5_000;
    const windowSize = useWindowSize();

    useEffect(() => {
        fetch(`${OPEN_STOCK_URL}/transaction/saved`, {
            method: "GET",
            credentials: "include",
            redirect: "follow"
        }).then(async k => {
            if(k.ok) {
                const data: Transaction[] = await k.json();

                setActiveTransactions(data)
            }
        })
        
        const interval = setInterval(() => {
            fetch(`${OPEN_STOCK_URL}/transaction/saved`, {
                method: "GET",
                credentials: "include",
                redirect: "follow"
            }).then(async k => {
                if(k.ok) {
                    const data: Transaction[] = await k.json();

                    setActiveTransactions(data)
                }
            })
        }, MINUTE_MS);

        return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
    }, [triggerRefresh])

    return (
            <div className="flex flex-col justify-between h-[calc(100vh-18px)] max-h-[calc(100vh-18px)] min-h-[calc(100vh-18px)] overflow-hidden flex-1" onKeyDownCapture={(e) => {
                if(e.key == "Escape") setSearchFocused(false)
            }}>
                <div className="p-4 pb-0">
                    <div className={`flex flex-1 flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 ${searchFocused ? "border-2 border-blue-500" : "border-2 border-gray-700"}`}>
                        {
                        activeProduct || activeCustomer || searchFocused ?
                        <Image onClick={() => {
                            setActiveProduct(null);
                            setActiveCustomer(null);
                            setSearchFocused(false);
                        }} width="20" height="20" src="/icons/arrow-narrow-left.svg" className="select-none cursor-pointer" alt={''} draggable={false} />
                        :
                        <Image width="20" height="20" src="/icons/search-sm.svg" className="select-none" alt={''} draggable={false}></Image>
                    }

                        <input
                            ref={input_ref}
                            placeholder={`Search for ${searchType}`} className="bg-transparent focus:outline-none text-white max-w-[100%] min-w-[0px]"
                            style={{ flex: "1 0" }}
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

                        <div className="flex flex-row items-center gap-2 bg-gray-600 px-1 py-1 rounded-md flex-shrink-0">
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
                </div>


                <div className="flex flex-col p-4 gap-4 h-full max-h-full overflow-auto">
                    <div className="w-full max-w-full h-full max-h-full">
                        {
                    searchFocused && (searchTermState !== "") ?
                        <div className="flex flex-1 flex-col flex-wrap bg-gray-700 rounded-sm text-white overflow-hidden">
                            {
                                (() => {
                                    switch(searchType) {
                                        case "product":
                                            return (
                                                    result.length == 0 ?
                                                    <p className="self-center text-gray-400 py-6">No products with this name</p>
                                                    :
                                                    (result as { product: Product, promotions: Promotion[]}[]).map((b: { product: Product, promotions: Promotion[]}, indx) => {
                                                        const e = b.product;

                                                        return (
                                                                <div key={e.sku} className="flex flex-col overflow-hidden h-fit" onClick={() => {
                                                                    setActiveProduct(e);
                                                                    setActiveCustomer(null);

                                                                    setActiveProductPromotions(b.promotions);
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
                                                                    <div className="grid items-center gap-4 p-4 hover:bg-gray-400 hover:bg-opacity-10 cursor-pointer" style={{ gridTemplateColumns: (windowSize?.width ?? 0) < 1536 ? "50px minmax(180px, 1fr) 225px 100px" : "50px minmax(200px, 1fr) minmax(300px, 2fr) 250px 125px" }}>
                                                                        <Image height={50} width={50} alt="" src={e.images[0]} className="rounded-sm"></Image>

                                                                        <div className="flex flex-col gap-0 max-w-[26rem] w-full flex-1">
                                                                            <p>{e.name}</p>
                                                                            <p className="text-sm text-gray-400">{e.company}</p>
                                                                        </div>

                                                                        <div className="hidden 2xl:flex flex-row items-center gap-2 flex-1 flex-wrap ">
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
                                                                    (indx == result.length-1) ? <></> : <hr className="border-gray-500" />
                                                                }
                                                                </div>
                                                                )
                                                    })
                                                    )
                                        case "customer":
                                            return (
                                                    !result || result.length == 0 ?
                                                    <p className="self-center text-gray-400 py-6">No customers with this name</p>
                                                    :
                                                    (result as Customer[])?.map((e: Customer, indx) => {
                                                        return (
                                                                <div
                                                                    key={`CUSTOMER-${e.id}`} className="flex flex-col overflow-hidden h-fit"
                                                                    onClick={(v) => {
                                                                    if((v.target as any).id !== "assign-to-cart") {
                                                                        setSearchFocused(false);

                                                                        setActiveCustomer(e);
                                                                        setActiveProduct(null);
                                                                    }
                                                                }}
                                                                    >
                                                                    <div className="select-none grid items-center md:gap-4 gap-2 p-4 hover:bg-gray-400 hover:bg-opacity-10 cursor-pointer" style={{ gridTemplateColumns: (windowSize.width ?? 0) >= 640 ? "150px 1fr 100px 150px" : `0.25fr 1fr 150px` }}>
                                                                        <div className="flex flex-col gap-0 max-w-[26rem] w-full flex-1">
                                                                            <p>{e.name}</p>
                                                                            <p className="text-sm text-gray-400">{e?.transactions?.split(",")?.length} Past Order{e?.transactions?.split(",")?.length > 1 ? "s" : ""}</p>
                                                                        </div>

                                                                        {
                                                                        (windowSize.width ?? 0) < 640 ?
                                                                        <></>
                                                                        :
                                                                        <div className="flex 2xl:flex-row flex-col items-center 2xl:gap-4 flex-1">
                                                                            <p>({e.contact.mobile.region_code}) {
                                                                                (() => {
                                                                                    const k = e.contact.mobile.root.match(/^(\d{3})(\d{3})(\d{4})$/);
                                                                                    if(!k) return ""
                                                                                    return `${k[1]} ${k[2]} ${k[3]}`
                                                                                })()
                                                                            }</p>
                                                                            <p>{e.contact.email.full}</p>
                                                                        </div>
                                                                    }

                                                                        <p className="text-gray-400 flex flex-1 self-center items-center justify-self-center justify-center text-center">${e.balance} Credit</p>

                                                                        <p
                                                                            onClick={(v) => {
                                                                            v.preventDefault();

                                                                            setCustomerState(e);
                                                                            setSearchFocused(false);
                                                                            setSearchType("product");
                                                                            setResult([]);

                                                                            input_ref.current?.value ? input_ref.current.value = "" : {};
                                                                        }}
                                                                            id="assign-to-cart"
                                                                            className="whitespace-nowrap justify-self-end pr-4">Assign to cart</p>
                                                                    </div>

                                                                    {
                                                                    (indx == result.length-1) ? <></> : <hr className="border-gray-500" />
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
                                                    (result as Transaction[]).map((e: Transaction, indx) => {
                                                        return (
                                                                <SearchFieldTransaction key={`TRANSACTION-${e.id}`} setCurrentViewedTransaction={setCurrentViewedTransaction} setPadState={setPadState} transaction={e} searchTermState={searchTermState} notEnd={!(indx == result.length-1)} />
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
                        activeCustomer ? 
                            <div className="p-4 text-white flex flex-col gap-8 bg-opacity-50 rounded-sm">
                                <div className="flex flex-1 flex-row items-start h-full justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-xl font-semibold text-white">{activeCustomer.name}</p>
                                        <p className="text-gray-400">{activeCustomer.contact.address.street} {activeCustomer.contact.address.street2}, {activeCustomer.contact.address.city} {activeCustomer.contact.address.po_code}, {activeCustomer.contact.address.country}</p>

                                        <div className="flex 2xl:flex-row flex-col 2xl:items-center 2xl:gap-4 gap-2">
                                            <div className="bg-gray-700 w-fit flex flex-row items-center gap-4 px-2 py-2 rounded-md">
                                                <Image src="/icons/mail-01.svg" alt="" width="20" height="20" style={{ filter: "invert(58%) sepia(32%) saturate(152%) hue-rotate(176deg) brightness(91%) contrast(87%)" }}></Image>

                                                <p className="text-gray-200 font-semibold">{activeCustomer.contact.email.full}</p>
                                            </div>

                                            <div className="bg-gray-700 w-fit flex flex-row items-center gap-4 px-2 py-2 rounded-md">
                                                <Image src="/icons/phone.svg" alt="" width="20" height="20" style={{ filter: "invert(58%) sepia(32%) saturate(152%) hue-rotate(176deg) brightness(91%) contrast(87%)" }}></Image>

                                                <p className="text-gray-200 font-semibold">({activeCustomer.contact.mobile.region_code}) {
                                                    (() => {
                                                        const k = activeCustomer.contact.mobile.root.match(/^(\d{3})(\d{3})(\d{4})$/);
                                                        if(!k) return ""
                                                        return `${k[1]} ${k[2]} ${k[3]}`
                                                    })()
                                                }</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`flex 2xl:flex-row flex-col flex-row items-center 2xl:gap-4 gap-2`}>
                                        <div>
                                            {
                                                editCustomerState ? 
                                                <div className={`flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}
                                                    onClick={() => { 
                                                        setEditCustomerState(false)
                                                    }}
                                                >
                                                    <Image width="25" height="25" src="/icons/save-01.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                                    <p className="font-medium select-none">Save Changes</p>
                                                </div>
                                                :
                                                <div className={`flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}
                                                    onClick={() => { 
                                                        setEditCustomerState(true)
                                                    }}
                                                >
                                                    <Image width="25" height="25" src="/icons/edit-03.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                                    <p className="font-medium select-none">Edit Customer</p>
                                                </div>
                                            }
                                        </div>

                                        <div>
                                            {
                                                customerState ? 
                                                <div className={`flex flex-col justify-between gap-8 bg-[#4c2f2d] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}
                                                    onClick={() => { 
                                                        setCustomerState(null)
                                                    }}
                                                >
                                                    <Image width="25" height="25" src="/icons/user-01.svg" style={{ filter: "invert(86%) sepia(34%) saturate(4038%) hue-rotate(295deg) brightness(88%) contrast(86%)" }} alt={''}></Image>
                                                    <p className="font-medium select-none">Remove Customer</p>
                                                </div>
                                                :
                                                <div className={`flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}
                                                    onClick={() => { 
                                                        setCustomerState(activeCustomer);
                                                        setSearchFocused(false);
                                                        setSearchType("product");
                                                        setResult([]);

                                                        input_ref.current?.value ? input_ref.current.value = "" : {};
                                                    }}
                                                >
                                                    <Image width="25" height="25" src="/icons/user-01.svg" style={{ filter: "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)" }} alt={''}></Image>
                                                    <p className="font-medium select-none">Select Customer</p>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 max-h-full overflow-auto">
                                    <p className="text-gray-400">ORDER HISTORY</p>

                                    <div className="flex flex-col gap-2">
                                    {
                                        activeCustomerTransactions?.sort((a,b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime())?.map(b => {
                                            return (
                                                <div key={b.id} className="bg-gray-700 px-4 py-4 pt-2 rounded-md gap-2 flex flex-col">
                                                    <div className="flex flex-row items-center gap-4">
                                                        <p className="font-semibold">{moment(b.order_date).format("DD/MM/YY hh:ss")}</p>
                                                        <p className="font-semibold">${b.order_total}</p>
                                                    </div>
                                                    
                                                    {b.products.map(k => {
                                                        return (
                                                            <div key={k.id} className="bg-gray-900 px-4 py-2 rounded-md">
                                                                <div className="flex flex-row items-center gap-4 ">
                                                                    <p className="font-bold">{k.reference}</p>
                                                                    <p className="bg-gray-800 text-white text-semibold px-2 rounded-full">{k.order_type}</p>

                                                                    <p>
                                                                        {(() => {
                                                                            switch(k.order_type) {
                                                                                case "Direct":
                                                                                    return `Taken from ${k.origin.contact.name} (${k.origin.code})`
                                                                                case "Pickup":
                                                                                    return `Pickup for ${k.origin.contact.name} (${k.origin.code})`
                                                                                case "Quote":
                                                                                    return `Quote given by ${b.salesperson} at ${k.origin.contact.name} (${k.origin.code})`
                                                                                case "Shipment":
                                                                                    return `Shipped from ${k.origin.contact.name} (${k.origin.code}) to ${k.destination?.contact.address.street} ${k.destination?.contact.address.street2}`
                                                                                default:
                                                                                    return ""
                                                                            }
                                                                        })()}
                                                                    </p>
                                                                </div>

                                                                <div>
                                                                    {
                                                                        k.products.map(n => {
                                                                            return (
                                                                                <div key={n.id} className="flex flex-row items-center gap-2">
                                                                                    <p className="text-gray-400">{n.quantity}x</p>
                                                                                    <p>{n.product_name}</p>

                                                                                    <p>${n.product_cost}</p>
                                                                                </div>
                                                                            )
                                                                        })
                                                                    }
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        })
                                    }
                                    </div>
                                    
                                </div>
                            </div>
                        :
                        activeProduct ? 
                            <div className="p-4 text-white flex flex-col gap-8 bg-opacity-50 rounded-sm">
                                <div className="flex flex-row items-start gap-4">
                                    <Image src={activeProductVariant?.images?.[0] ?? activeProduct.images[0]} className="rounded-md" height={150} width={150} alt={activeProduct.name}></Image>

                                    <div className="flex flex-row items-start h-full justify-between flex-1">
                                        <div className="flex flex-col">
                                            <h2 className="text-xl font-medium">{activeProduct.name}</h2>
                                            <p className="text-gray-400">{activeProduct.company}</p>
                                            <br />

                                            <div className="flex 2xl:flex-col flex-row justify-between gap-4 w-full flex-1">
                                                <div className="flex flex-col 2xl:flex-row 2xl:gap-4 2xl:items-center">
                                                    <div className="flex flex-row items-center gap-4">
                                                        <p className="text-gray-400">SKU:</p>
                                                        <p>{activeProduct.sku}</p>
                                                    </div>
                                                    <div className="flex flex-row items-center gap-4">
                                                        <p className="text-gray-400">BAR:</p>
                                                        <p>{activeProductVariant?.barcode}</p>
                                                    </div>
                                                    <div className="flex flex-row items-center gap-4">
                                                        <p className="text-gray-400">LOP:</p>
                                                        <p>${(activeProductVariant ? applyDiscount(activeProductVariant?.retail_price * 1.15 ?? 0, fromDbDiscount(activeProductVariant?.loyalty_discount)) : 0.00).toFixed(2)}</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex flex-col items-end 2xl:flex-row 2xl:items-center gap-2">
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
                                            </div>
                                            
                                            {/* <p className="text-sm text-gray-300 truncate max-w-4">{activeProduct.description.substring(0, 150)+"..."}</p> */}
                                        </div>

                                        <div className="hidden 2xl:flex self-center flex-row items-center gap-4">
                                            <div 
                                                className={`select-none cursor-pointer flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit`}
                                                onClick={() => {
                                                    if(activeProductVariant) {
                                                        let cOs = orderState.find(e => e.order_type == "Direct");

                                                        if(!cOs?.products) {
                                                            const new_pdt_list = addToCart(activeProduct, activeProductPromotions, activeProductVariant, [])

                                                            cOs = {
                                                                id: v4(),
                                                                destination: null,
                                                                origin: {
                                                                    code: master_state.store_id,
                                                                    contact: master_state.store_contact
                                                                },
                                                                products: new_pdt_list,
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
                                                                order_notes: orderState.map(b => b.order_notes).flat(),
                                                                reference: `RF${customAlphabet(`1234567890abcdef`, 10)(8)}`,
                                                                creation_date: getDate(),
                                                                discount: "a|0",
                                                                order_type: "Direct"
                                                            };

                                                            setOrderState([...sortOrders([ ...orderState, cOs])])
                                                        }else {
                                                            const new_pdt_list = addToCart(activeProduct, activeProductPromotions, activeProductVariant, cOs.products)
                                                            const new_order_state = orderState.map(e => e.id == cOs?.id ? { ...cOs, products: new_pdt_list } : e);

                                                            setOrderState(sortOrders(new_order_state))
                                                        }
                                                    }
                                                }}
                                                >
                                                <Image width="25" height="25" src="/icons/plus-lge.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                                <p className="font-medium">Add to cart</p>
                                            </div>

                                            <div className={`select-none flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit`}>
                                                <Image width="25" height="25" src="/icons/search-sm.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                                <p className="font-medium">Show Related Orders</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex 2xl:flex-row flex-col-reverse items-start gap-8">
                                    <div className="flex flex-col gap-8 max-w-[550px] w-full">
                                        <PromotionList promotions={activeProductPromotions} cart={orderState}/>

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

                                    <div className="w-full flex flex-col gap-8 2xl:gap-2">
                                        <div className="flex 2xl:hidden items-center justify-center">
                                            {/* Buttons go here for smaller displays !skipto */}
                                            <div className="self-center flex flex-row items-center gap-4">
                                                <div
                                                    className={`select-none cursor-pointer flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit`}
                                                    onClick={() => {
                                                    if(activeProductVariant) {
                                                        let cOs = orderState.find(e => e.order_type == "Direct");

                                                        if(!cOs?.products) {
                                                            const new_pdt_list = addToCart(activeProduct, activeProductPromotions, activeProductVariant, [])

                                                            cOs = {
                                                                id: v4(),
                                                                destination: null,
                                                                origin: {
                                                                    code: master_state.store_id,
                                                                    contact: master_state.store_contact
                                                                },
                                                                products: new_pdt_list,
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
                                                            };

                                                            setOrderState([...sortOrders([ ...orderState, cOs])])
                                                        }else {
                                                            const new_pdt_list = addToCart(activeProduct, activeProductPromotions, activeProductVariant, cOs.products)
                                                            const new_order_state = orderState.map(e => e.id == cOs?.id ? { ...cOs, products: new_pdt_list } : e);

                                                            setOrderState(sortOrders(new_order_state))
                                                        }
                                                    }
                                                }}
                                                    >
                                                    <Image width="25" height="25" src="/icons/plus-lge.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                                    <p className="font-medium">Add to cart</p>
                                                </div>

                                                <div className={`select-none flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit`}>
                                                    <Image width="25" height="25" src="/icons/search-sm.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                                    <p className="font-medium">Show Related Orders</p>
                                                </div>
                                            </div>

                                        </div>
                                        <div className="flex flex-col gap-2">
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
                                                                    className={`grid w-full px-[0.7rem] py-2 rounded-sm cursor-pointer ${active ? "bg-gray-600" : ""}`} style={{ gridTemplateColumns: "1fr 100px 150px 75px" }}>
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
                            </div>
                        :
                            <div className="flex flex-1 flex-row flex-wrap sm:gap-4 gap-1">
                                {/* Tiles */}
                                {
                                    customerState ? 
                                    <div className={`flex flex-col justify-between gap-8 bg-[#4c2f2d] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}
                                        onClick={() => { 
                                            setCustomerState(null)
                                        }}
                                    >
                                        <Image width="25" height="25" src="/icons/user-01.svg" style={{ filter: "invert(86%) sepia(34%) saturate(4038%) hue-rotate(295deg) brightness(88%) contrast(86%)" }} alt={''}></Image>
                                        <p className="font-medium select-none">Remove Customer</p>
                                    </div>
                                    :
                                    <div className={`flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}
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
                                    className={`flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}>
                                    <Image width="25" height="25" src="/icons/sale-03.svg" style={{ filter: "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)" }} alt={''}></Image>
                                    <p className="font-medium">Add Cart Discount</p>
                                </div>
        
                                <div 
                                    onClick={() => {
                                        setPadState("ship-to-customer")
                                    }}
                                    className={`flex flex-col justify-between gap-8  ${customerState ? "bg-[#243a4e]" : "bg-[#101921]"} backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}>
                                    <Image width="25" height="25" src="/icons/globe-05.svg" style={{ filter: customerState ? "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" : "invert(46%) sepia(7%) saturate(675%) hue-rotate(182deg) brightness(94%) contrast(93%)" }} alt={''}></Image>
                                    <p className={`${customerState ? "text-white" : "text-gray-500"} font-medium`}>Ship to Customer</p>
                                </div>
        
                                <div 
                                    onClick={() => {
                                        setPadState("note")
                                    }}
                                    className={`flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}>
                                    <Image width="25" height="25" src="/icons/file-plus-02.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                    <p className="font-medium">Add Note</p>
                                </div>
        
                                <div 
                                    onClick={() => {
                                        setPadState("pickup-from-store")
                                    }}
                                    className={`flex flex-col justify-between gap-8 ${customerState ? "bg-[#243a4e]" : "bg-[#101921]"}  backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}>
                                    <Image width="25" height="25" src="/icons/building-02.svg" style={{ filter: customerState ? "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" : "invert(46%) sepia(7%) saturate(675%) hue-rotate(182deg) brightness(94%) contrast(93%)" }} alt={''}></Image>
                                    <p className={`${customerState ? "text-white" : "text-gray-500"} font-medium`}>Pickup from Store</p>
                                </div>
        
                                <div 
                                    onClick={() => {
                                        parkSale(orderState, setTriggerRefresh, triggerRefresh, master_state, customerState, setKioskState, setOrderState, setCustomerState, setPadState, kioskState);
                                    }}
                                    className={`flex flex-col justify-between gap-8 ${(orderState?.reduce((p, c) => p + c.products.length, 0) ?? 0) >= 1 ? "bg-[#2f4038] text-white" : "bg-[#101921] text-gray-500"}  backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md  max-w-fit cursor-pointer`}>
                                    <Image width="25" height="25" src="/icons/save-01.svg" style={{ filter: ((orderState?.reduce((p, c) => p + c.products.length, 0) ?? 0) >= 1) ? "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)" : "invert(46%) sepia(7%) saturate(675%) hue-rotate(182deg) brightness(94%) contrast(93%)" }} alt={''}></Image>
                                    <p className="font-medium">Save Cart</p>
                                </div>
                            </div>
                    }
                </div>
            </div>
            
            <div className="flex flex-row items-center border-t-2 border-gray-600 min-h-[84px]">
                {/* Active Orders */}
                {
                    activeTransactions?.map(k => {
                        return (
                            <SavedTransactionItem setTriggerRefresh={setTriggerRefresh} triggerRefresh={triggerRefresh} transaction={k} key={k.id} setCustomerState={setCustomerState} kioskState={kioskState} setKioskState={setKioskState} setOrderState={setOrderState} />
                        )
                    })
                }

                {
                    (useWindowSize().width ?? 0) < 640 ?
                            <div onClick={() => setLowModeCartOn(true)}>
                                Open Cart
                            </div>
                        :
                            <></>
                }
            </div>
        </div>
    )
}