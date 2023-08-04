import { useEffect, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";
import Link from "next/link";
import moment from "moment";

import { applyDiscount, fromDbDiscount, toAbsoluteDiscount } from "@utils/discountHelpers";
import { inspectingTransactionAtom, ordersAtom } from "@/src/atoms/transaction";
import { Customer, DbOrder, DbProductPurchase, Order, Product, ProductInstance, ProductPurchase, Promotion } from "@utils/stockTypes";

import { NoteElement } from "@components/common/noteElement";
import queryOs from "@/src/utils/query-os";
import { addToCartAtom, defaultKioskAtom, kioskPanelLogAtom, perfAtom } from "@/src/atoms/kiosk";
import { RESET } from "jotai/utils";
import { customerAtom } from "@/src/atoms/customer";
import { customAlphabet } from "nanoid";

export default function TransactionMenu() {
    const transaction = useAtomValue(inspectingTransactionAtom)

    const addToCart = useSetAtom(addToCartAtom)
    const setPerfState = useSetAtom(perfAtom)
    const setKioskPanel = useSetAtom(kioskPanelLogAtom)
    const setKioskState = useSetAtom(defaultKioskAtom)
    const setCustomerState = useSetAtom(customerAtom)
    const [ orderState, setOrderState ] = useAtom(ordersAtom)
    
    const [ activeTransaction, setActiveTransaction ] = useState<DbOrder | null>(transaction?.item?.products.find(k => k.id == transaction?.identifier) ?? null);
    const [ selectedItems, setSelectedItems ] = useState<{
        product_id: string,
        quantity: number
    }[]>([]); 
    const [ selectorOpen, setSelectorOpen ] = useState(false);
    const [ refChoices, setRefChoices ] = useState(transaction?.item.products);
    const [ customer, setCustomer ] = useState<Customer | null>();
    
    useEffect(() => {
        setActiveTransaction(transaction?.item?.products.find(k => k.id == transaction?.identifier) ?? null);
        // refChoices?.find(b => b.reference.includes(transaction?.identifier))
        setRefChoices(transaction?.item.products)

        if(transaction?.item?.customer.customer_type != "Store") {
            queryOs(`customer/${transaction?.item?.customer.customer_id}`, {
                method: "GET",
                credentials: "include",
                redirect: "follow"
            }).then(async k => {
                const n = await k.json();
                setCustomer(n);
            })
        }else {
            queryOs(`store/code/${transaction?.item?.customer.customer_id}`, {
                method: "GET",
                credentials: "include",
                redirect: "follow"
            }).then(async k => {
                const n = await k.json();
                setCustomer(n);
            })
        }
    }, [transaction]);

    if(!transaction) return (<></>)

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center justify-between w-full">
                    <div className="flex flex-col">
                        <p className="text-gray-300 font-semibold">{customer?.name}</p>
                        <p className="text-lg font-semibold text-white">{activeTransaction?.reference} - {activeTransaction?.order_type}</p>
                    </div>

                    {transaction.item.transaction_type == "Quote" ? <p className="flex flex-row items-center gap-[0.75rem] bg-gray-800 p-2 px-4 rounded-md cursor-pointer text-white">Quote</p> : <></>}
                </div>

                {
                    transaction.item.products.length > 1 ?
                    <div className="relative inline-block w-fit float-right flex-grow flex-shrink-0">
                        <p className="text-gray-400 text-sm">Transaction contains multiple orders</p>
                        <div className={`bg-gray-800 w-full select-none text-white flex flex-row justify-between gap-4 cursor-pointer px-4 py-2 ${selectorOpen ? "rounded-t-md rounded-b-none" : "rounded-md"}`} onClick={() => {
                            setSelectorOpen(!selectorOpen)
                        }}>
                            <p className="font-semibold">{activeTransaction?.order_type.toUpperCase()} - {activeTransaction?.origin.store_code}</p>
                            <Image src={!selectorOpen ? "/icons/chevron-down.svg" : "/icons/chevron-up.svg"} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} alt="" height={18} width={18}></Image>
                        </div>

                        <div className={`${selectorOpen ? "absolute flex flex-col items-center w-full text-white justify-center bg-gray-700 overflow-hidden z-50 rounded-t-none rounded-b-md" : "hidden absolute"}`}>
                            {
                                refChoices?.map(k => {
                                    return (
                                        <div key={k.id} className="hover:bg-gray-600 cursor-pointer px-4 py-2 w-full text-center" onClick={() => {
                                            setActiveTransaction(k)
                                            setSelectorOpen(false)
                                        }}>
                                            {k.order_type.toUpperCase()} - {k.origin.store_code}
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                    :
                    <></>
                }
            </div>

            {/* Transaction History */}
            <div className="flex flex-col">
                {
                    activeTransaction?.status_history.map((k, indx) => {
                        const type = k.item.status.type;

                        return (
                            <div key={`${k.timestamp} ${k.item} ${k.reason}`}>
                                {
                                    indx == 0 ? <div className="h-4 w-[3px] rounded-sm rounded-b-none bg-gray-400 ml-5"></div> 
                                        :
                                    <div className="h-4 w-[3px] bg-gray-400 ml-5"></div> 
                                }
                                
                                <div className="flex flex-row items-center gap-4">
                                    <div className={`${
                                            type == "queued" ? 
                                                "bg-gray-600" : 
                                            type == "processing" ? 
                                                "bg-yellow-600" : 
                                            (type == "transit" || type == "instore") ? 
                                                "bg-blue-600" : 
                                            type == "failed" ? 
                                                "bg-red-600" :
                                                "bg-green-600"
                                            } h-11 w-11 flex items-center justify-center rounded-full`}>
                                        {(() => {
                                            switch(type) {
                                                case "queued":
                                                    return (
                                                        <div>
                                                            <Image src="/icons/clock.svg" alt="" height={22} width={22} style={{ filter: "invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)" }} />
                                                        </div>
                                                    )
                                                case "transit":
                                                    return (
                                                        <div>
                                                            <Image src="/icons/truck-01.svg" alt="" height={22} width={22} style={{ filter: "invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)" }} />
                                                        </div>
                                                    )
                                                case "processing":
                                                    return (
                                                        <div>
                                                            <Image src="/icons/loading-01.svg" alt="" height={22} width={22} style={{ filter: "invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)" }} />
                                                        </div>
                                                    )
                                                case "fulfilled":
                                                    return (
                                                        <div>
                                                            <Image src="/icons/check-verified-02.svg" alt="" height={22} width={22} style={{ filter: "invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)" }} />
                                                        </div>
                                                    )
                                                case "instore":
                                                    return (
                                                        <div>
                                                            <Image src="/icons/building-02.svg" alt="" height={22} width={22} style={{ filter: "invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)" }} />
                                                        </div>
                                                    )
                                                case "failed":
                                                    return (
                                                        <div>
                                                            <Image src="/icons/x-circle.svg" alt="" height={22} width={22} style={{ filter: "invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)" }} />
                                                        </div>
                                                    )
                                                default:
                                                    return (
                                                        <div></div>
                                                    )
                                            }
                                        })()}
                                    </div>

                                    <div className="flex flex-row items-center justify-between flex-1">
                                        <div className="flex flex-col">
                                            <div className="flex flex-row items-center gap-2">
                                                <p className="text-white font-semibold">{type[0].toUpperCase()}{type.substring(1)}</p>
                                                <p className="text-gray-400 text-sm">{moment(k.timestamp).format("DD/MM/YY LT")}</p>
                                            </div>
                                            <p className="text-gray-400 font-semibold text-sm">{k.reason}</p>
                                        </div>

                                        {
                                            type == "transit" ?
                                                <Link target="_blank" rel="noopener noreferrer" className="bg-gray-800 rounded-md px-2 py-[0.125rem] flex flex-row items-center gap-2 cursor-pointer" href={k.item.status.value.query_url + k.item.status.value.tracking_code}>
                                                    <p className="text-white">Track</p>
                                                    <Image src="/icons/arrow-narrow-right.svg" alt="Redirect arrow" width={15} height={15} style={{ filter: "invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)" }} />
                                                </Link>
                                            :
                                            <></>
                                        }
                                    </div>
                                </div>

                                {
                                    (indx != activeTransaction?.status_history.length-1) ? <div className="h-4 w-[3px] bg-gray-400 ml-5"></div> : <></>
                                }
                            </div>
                        )
                    })
                }
            </div>
            
            {/* Product List */}
            <div className="flex flex-col gap-2">
                <p className="text-gray-400">PRODUCTS</p>

                {
                    activeTransaction?.products.map(k => {
                        const matchingItem = selectedItems.findIndex((elem) => elem.product_id === k.id)
                        
                        return (
                            <div key={`${k.id} ${k.product_code} ${k.quantity} ${k.product_variant_name}`} className="gap-8 px-2 items-center" style={{ display: "grid", gridTemplateColumns: "65px 1fr 75px" }}>
                                <div className="flex flex-row items-center gap-2 w-fit">
                                    <div 
                                        onClick={() => {
                                            if (matchingItem !== -1) {
                                                setSelectedItems(selectedBefore => selectedBefore.filter((element) => element.product_id !== k.id))
                                            } else {
                                                setSelectedItems([...selectedItems, {
                                                    product_id: k.id,
                                                    quantity: k.quantity
                                                }])
                                            }
                                        }}
                                        className={`flex items-center justify-center h-[20px] w-[20px] cursor-pointer`}
                                    >
                                        {
                                            matchingItem !== -1 ?
                                            <Image src="/icons/check-square.svg" alt="" height={20} width={20} style={{ filter: "invert(95%) sepia(100%) saturate(20%) hue-rotate(289deg) brightness(104%) contrast(106%)" }}></Image>
                                            :
                                            <Image src="/icons/square.svg" alt="" height={20} width={20} style={{ filter: "invert(70%) sepia(11%) saturate(294%) hue-rotate(179deg) brightness(92%) contrast(87%)" }}></Image>
                                        }
                                    </div>
                                    
                                    <div className={`flex flex-row ${matchingItem === -1 ? "bg-gray-600" : "bg-gray-100"} p-0 rounded-sm`}>
                                        <p className="px-1 cursor-pointer" onClick={() => {
                                            if (matchingItem === -1) {
                                                setSelectedItems([...selectedItems, {
                                                    product_id: k.id,
                                                    quantity: k.quantity
                                                }])
                                            }

                                            setSelectedItems(selectedBefore => selectedBefore.map((element) => element.product_id === k.id ? { ...element, quantity: Math.max(element.quantity - 1, 1) } : element))
                                        }}>-</p>
                                        <p className="text-gray-200 px-2 bg-gray-800">{matchingItem === -1 ? k.quantity : selectedItems[matchingItem].quantity}</p>
                                        <p className="px-1 cursor-pointer" onClick={() => {
                                            if (matchingItem === -1) {
                                                setSelectedItems([...selectedItems, {
                                                    product_id: k.id,
                                                    quantity: k.quantity
                                                }])
                                            }

                                            setSelectedItems(selectedBefore => selectedBefore.map((element) => element.product_id === k.id ? { ...element, quantity: Math.min(element.quantity + 1, k.quantity) } : element))
                                        }}>+</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-start">
                                    <p className="text-white font-semibold text-sm">{k.product_name}</p>
                                    <p className="text-gray-400 text-sm">{k.product_code}</p>
                                </div>
                                
                                <div className="flex flex-col items-center justify-center">
                                    <p className="text-white font-semibold text-sm">${applyDiscount(k.product_cost, fromDbDiscount(k.discount)).toFixed(2)}</p>
                                    <p className="text-gray-500 text-sm">(${k.product_cost})</p>
                                </div>
                            </div>
                        )
                    })
                }

                <hr className=" border-gray-600" />

                <div className="gap-8 px-2 items-center" style={{ display: "grid", gridTemplateColumns: "65px 1fr 75px" }}>
                    <p className="text-gray-400"></p>
                    <p className="text-white font-semibold">Total</p>
                    <p className="text-white font-semibold">${activeTransaction?.products.reduce((prev, k) => prev + applyDiscount(k.product_cost * k.quantity, fromDbDiscount(k.discount)), 0).toFixed(2)}</p>
                </div>
            </div>

            {/* Refund Selected */}
            <div className="flex flex-row items-center gap-2">
                <div className={`text-white px-4 py-2 rounded-md ${selectedItems.length > 0 ? "bg-gray-600" : "bg-gray-800"} cursor-pointer hover:bg-gray-700`} onClick={() => {
                    if (!activeTransaction) return;
                    // We will have to change the current order to reflect the active transaction.
                    // Where the products being refunded with have a `TransactionType::In` status.
                    // -- 
                    //
                    // Products list: activeTransaction?.products

                    const products_being_returned = selectedItems.map((elem) => {
                        const reference = activeTransaction?.products.find(element => element.id === elem.product_id)
                        if (!reference) return undefined;

                        reference.quantity = elem.quantity;

                        reference.instances = reference?.instances.filter((_, index) => index < elem.quantity)
                        return reference
                    }).filter((elem) => (elem !== undefined)) as DbProductPurchase[]

                    // We must restore the kiosk state to its default, upon which - we set the customer
                    // to the customer of this transaction. Following which, we set the transaction information
                    // to the active transaction, retaining the ID of the transaction, we will perform
                    // an UPDATE, instead of a POST.
                    setKioskState(RESET)
                    setPerfState({ type: "continuative" as "continuative", transaction_id: activeTransaction.id })

                    const conv_to_product_purchase = products_being_returned.map(async (product) => {
                        const returned_product_set = await queryOs(`product/with_promotions/${product.product_sku}`, {
                            method: "GET",
                            credentials: "include",
                            redirect: "follow"
                        })

                        const data: { product: Product, promotions: Promotion[] } = await returned_product_set.json()
                        const variant_info = data.product.variants.find((element) => element.barcode === product.product_code)

                        if (!variant_info) return undefined;

                        return {
                            ...product,
                            product: data.product,
                            transaction_type: "In",
                            variant_information: variant_info,
                            active_promotions: data.promotions,
                            discount: [{ source: "user", value: fromDbDiscount(product.discount), applicable_quantity: -1 }]
                        } as ProductPurchase
                    });

                    Promise.all(conv_to_product_purchase).then(fulfilled => {
                        const products = fulfilled.filter(e => e !== undefined) as ProductPurchase[]

                        const newOrder: Order = {
                            ...activeTransaction,
                            products: products,
                            discount: "a|0",
                            reference: `CT${customAlphabet(`1234567890abcdef`, 10)(8)}`
                        }

                        setOrderState([newOrder])
                        console.log([newOrder])

                        if (customer) setCustomerState(customer)
                        setKioskPanel("cart")
                    })

                }}>Refund Selected Items</div>

                <div className={`text-white px-4 py-2 rounded-md ${selectedItems.length > 0 ? "bg-gray-600" : "bg-gray-800"} cursor-pointer hover:bg-gray-700`} onClick={() => {
                    // ...
                }}>Print Order</div>
            </div>

            <div className="flex flex-col gap-2">
                <p className="text-gray-400">NOTES</p>

                {
                    (activeTransaction?.order_notes?.length ?? 0) < 1 ?
                    <div className="flex flex-1 items-center justify-center">
                        <p className="text-gray-400">No notes attached to order.</p>
                    </div>
                    :
                    activeTransaction?.order_notes.map(e => {
                        return (
                            <NoteElement note={e} key={`${e.author} ${e.message} - ${e.timestamp}`}/>
                        )
                    })
                }
            </div>
        </div>
    )
}