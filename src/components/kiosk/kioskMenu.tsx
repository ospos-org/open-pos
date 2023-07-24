import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { useEffect, useState } from "react"
import { customAlphabet } from "nanoid"
import { useResetAtom } from "jotai/utils"
import { isEqual } from "lodash"
import moment from "moment"
import { v4 } from "uuid"
import Image from "next/image"

import { ProductPurchase, StrictVariantCategory, Transaction } from "@utils/stockTypes"
import { applyDiscount, fromDbDiscount, isValidVariant } from "@utils/discountHelpers"
import { getDate, sortOrders } from "@/src/utils/utils"
import { OPEN_STOCK_URL } from "@utils/environment"
import { useWindowSize } from "@hooks/useWindowSize"
import useKeyPress from "@hooks/useKeyPress"

import { querySearchTerm, searchFocusedAtom, searchResultsAtom, searchResultsAtomic, searchTermAtom, searchTypeHandlerAtom } from "@atoms/search"
import { activeDiscountAtom, kioskPanelLogAtom, parkSaleAtom } from "@atoms/kiosk"
import { inspectingTransactionAtom, ordersAtom } from "@atoms/transaction"
import { customerAtom, inspectingCustomerAtom } from "@atoms/customer"
import { inspectingProductAtom } from "@atoms/product"
import { masterStateAtom } from "@atoms/openpos"

import { SearchResultsTransaction } from "./children/search/groupers/searchResultsTransaction"
import { SearchResultsCustomers } from "./children/search/groupers/searchResultsCustomers"
import { SearchResultsProducts } from "./children/search/groupers/searchResultsProducts"
import { SavedTransactionItem } from "./children/order/savedTransactionItem"
import PromotionList from "./children/promotion/promotionList"
import { SearchBar } from "./children/search/searchBar"
import { ExpandedCustomer } from "./children/search/expanded/expandedCustomer"
import { ExpandedProduct } from "./children/search/expanded/expandedProduct"

export const BLOCK_SIZE = "sm:min-w-[250px] min-w-[49%]";
const MINUTE_MS = 5_000;

interface KioskMenuProps {
    addToCart: (orderProducts: ProductPurchase[]) => ProductPurchase[],
}

export default function KioskMenu({
    addToCart,
}: KioskMenuProps) {
    const resetProductInspection = useResetAtom(inspectingProductAtom)
    const clearSearchResults = useResetAtom(searchResultsAtom)

    const searchTermState = useAtomValue(searchTermAtom)
    const searchResults = useAtomValue(searchResultsAtomic)
    const currentStore = useAtomValue(masterStateAtom)
    
    const setInspectingTransaction = useSetAtom(inspectingTransactionAtom)
    const setKioskPanel = useSetAtom(kioskPanelLogAtom)
    const setDiscount = useSetAtom(activeDiscountAtom)
    const parkSale = useSetAtom(parkSaleAtom)

    const [ inspectingCustomer, setInspectingCustomer ] = useAtom(inspectingCustomerAtom) 
    const [ inspectingProduct, setInspectingProduct ] = useAtom(inspectingProductAtom)
    
    const [ searchFocused, setSearchFocused ] = useAtom(searchFocusedAtom)
    const [ customerState, setCustomerState ] = useAtom(customerAtom)
    const [ searchType, setSearchType ] = useAtom(searchTypeHandlerAtom)
    const [ orderState, setOrderState ] = useAtom(ordersAtom)

    // WATCH THIS ONE
    const [ activeCustomerTransactions, setActiveCustomerTransactions ] = useState<Transaction[] | null>(null);
    const [ activeTransactions, setActiveTransactions ] = useState<Transaction[] | null>(null);

    const windowSize = useWindowSize();
    const escapePressed = useKeyPress(['Escape'])

    useEffect(() => {
        resetProductInspection()
        setSearchFocused(false)
        setInspectingCustomer(null)
    }, [escapePressed]);

    useEffect(() => {
        if(inspectingCustomer) {
            fetch(`${OPEN_STOCK_URL}/customer/transactions/${inspectingCustomer.id}`, {
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
    }, [inspectingCustomer]);

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
    }, [])

    return (
        <div className="flex flex-col justify-between h-[calc(100vh-18px)] max-h-[calc(100vh-18px)] min-h-[calc(100vh-18px)] overflow-hidden flex-1" 
            onKeyDownCapture={(e) => {
                if(e.key == "Escape") setSearchFocused(false)
            }}>

            {/* <div style={{ position: "absolute", top: 0, left: 0, zIndex: 500, background: "black", padding: "15px" }}>
                <p className="text-white">Input: {searchTermState}</p>
                <p className="text-white">Type: {searchType}</p>
            </div> */}

            <SearchBar />

            <div className="flex flex-col p-4 gap-4 h-full max-h-full overflow-auto">
                <div className="w-full max-w-full h-full max-h-full">
                    {
                        searchFocused && (searchTermState !== "") ?
                            <div className="flex flex-1 flex-col flex-wrap bg-gray-700 rounded-sm text-white overflow-hidden">
                                {
                                    (() => {
                                        switch(searchType) {
                                            case "products":
                                                return <SearchResultsProducts />
                                            case "customers":
                                                return <SearchResultsCustomers />
                                            case "transactions":
                                                return <SearchResultsTransaction />
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
                        inspectingCustomer ? 
                            <ExpandedCustomer />
                        :
                        inspectingProduct.activeProduct ? 
                            <ExpandedProduct addToCart={addToCart} />
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
                                        <Image className="select-none" width="25" height="25" src="/icons/user-01.svg" style={{ filter: "invert(86%) sepia(34%) saturate(4038%) hue-rotate(295deg) brightness(88%) contrast(86%)" }} alt={''}></Image>
                                        <p className="font-medium select-none">Remove Customer</p>
                                    </div>
                                    :
                                    <div className={`flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}
                                        onClick={() => { 
                                            clearSearchResults()
                                            setSearchType("customers");
                                        }}
                                    >
                                        <Image className="select-none" width="25" height="25" src="/icons/user-01.svg" style={{ filter: "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)" }} alt={''}></Image>
                                        <p className="font-medium select-none">Select Customer</p>
                                    </div>
                                }

                                <div
                                    onClick={() => {
                                        setKioskPanel("discount")
                                        setDiscount({
                                            type: "absolute",
                                            for: "cart",
                                            orderId: "",
                                            source: "user",
                                            product: {
                                                id: "",
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
                                                barcode: "CART",
                                                marginal_price: orderState.reduce((p, c) => p += c.products?.reduce((prev, curr) => prev += (curr.quantity * curr.variant_information.marginal_price), 0), 0),
                                                retail_price: orderState.reduce((p, c) => p += c.products?.reduce((prev, curr) => prev += (curr.quantity * curr.variant_information.retail_price), 0), 0)
                                            },
                                            value: 0,
                                            exclusive: false
                                        })
                                    }}
                                    className={`flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}>
                                    <Image className="select-none" width="25" height="25" src="/icons/sale-03.svg" style={{ filter: "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)" }} alt={''}></Image>
                                    <p className="font-medium select-none">Add Cart Discount</p>
                                </div>
        
                                <div 
                                    onClick={() => {
                                        setKioskPanel("ship-to-customer")
                                    }}
                                    className={`flex flex-col justify-between gap-8  ${customerState ? "bg-[#243a4e]" : "bg-[#101921]"} backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}>
                                    <Image className="select-none" width="25" height="25" src="/icons/globe-05.svg" style={{ filter: customerState ? "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" : "invert(46%) sepia(7%) saturate(675%) hue-rotate(182deg) brightness(94%) contrast(93%)" }} alt={''}></Image>
                                    <p className={`select-none ${customerState ? "text-white" : "text-gray-500"} font-medium`}>Ship to Customer</p>
                                </div>
        
                                <div 
                                    onClick={() => {
                                        setKioskPanel("note")
                                    }}
                                    className={`flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}>
                                    <Image className="select-none" width="25" height="25" src="/icons/file-plus-02.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                    <p className="font-medium select-none">Add Note</p>
                                </div>
        
                                <div 
                                    onClick={() => {
                                        setKioskPanel("pickup-from-store")
                                    }}
                                    className={`flex flex-col justify-between gap-8 ${customerState ? "bg-[#243a4e]" : "bg-[#101921]"}  backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}>
                                    <Image className="select-none" width="25" height="25" src="/icons/building-02.svg" style={{ filter: customerState ? "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" : "invert(46%) sepia(7%) saturate(675%) hue-rotate(182deg) brightness(94%) contrast(93%)" }} alt={''}></Image>
                                    <p className={`select-none ${customerState ? "text-white" : "text-gray-500"} font-medium`}>Pickup from Store</p>
                                </div>
        
                                <div 
                                    onClick={() => {
                                        parkSale()
                                    }}
                                    className={`flex flex-col justify-between gap-8 ${(orderState?.reduce((p, c) => p + c.products.length, 0) ?? 0) >= 1 ? "bg-[#2f4038] text-white" : "bg-[#101921] text-gray-500"}  backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md  max-w-fit cursor-pointer`}>
                                    <Image className="select-none" width="25" height="25" src="/icons/save-01.svg" style={{ filter: ((orderState?.reduce((p, c) => p + c.products.length, 0) ?? 0) >= 1) ? "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)" : "invert(46%) sepia(7%) saturate(675%) hue-rotate(182deg) brightness(94%) contrast(93%)" }} alt={''}></Image>
                                    <p className="font-medium select-none">Save Cart</p>
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
                            <SavedTransactionItem 
                                transaction={k} 
                                key={k.id} 
                            />
                        )
                    })
                }
            </div>
        </div>
    )
}