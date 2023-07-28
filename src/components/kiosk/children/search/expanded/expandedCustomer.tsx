import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useResetAtom } from "jotai/utils";
import { useEffect, useState } from "react";
import moment from "moment";
import Image from "next/image";

import { searchFocusedAtom, searchResultsAtom, searchTypeHandlerAtom } from "@atoms/search";
import { customerAtom, inspectingCustomerAtom } from "@atoms/customer";
import { inspectingTransactionAtom } from "@atoms/transaction";
import { kioskPanelLogAtom } from "@atoms/kiosk";
import { Transaction } from "@utils/stockTypes";
import { BLOCK_SIZE } from "@components/kiosk/kioskMenu";
import { OPEN_STOCK_URL } from "@/src/utils/environment";


export function ExpandedCustomer() {
    const clearSearchResults = useResetAtom(searchResultsAtom)

    const inspectingCustomer = useAtomValue(inspectingCustomerAtom) 

    const setInspectingTransaction = useSetAtom(inspectingTransactionAtom)
    const setSearchFocused = useSetAtom(searchFocusedAtom)
    const setKioskPanel = useSetAtom(kioskPanelLogAtom)
    const setSearchType = useSetAtom(searchTypeHandlerAtom)

    const [ customerState, setCustomerState ] = useAtom(customerAtom)
    const [ activeCustomerTransactions, setActiveCustomerTransactions ] = useState<Transaction[] | null>(null);

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

    if (!inspectingCustomer) return <></>

    return (
        <div className="p-4 text-white flex flex-col gap-8 bg-opacity-50 rounded-sm">
            <div className="flex flex-1 flex-row items-start h-full justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-2">
                        <p className="text-xl font-semibold text-white">{inspectingCustomer.name}</p>
                        <div 
                            onClick={() => { 
                                setKioskPanel("customer")
                            }}
                            className="px-2 bg-gray-100 bg-opacity-10 cursor-pointer rounded-md">Edit</div>
                    </div>
                    <p className="text-gray-400">{inspectingCustomer.contact.address.street} {inspectingCustomer.contact.address.street2}, {inspectingCustomer.contact.address.city} {inspectingCustomer.contact.address.po_code}, {inspectingCustomer.contact.address.country}</p>

                    <div className="flex 2xl:flex-row flex-col 2xl:items-center 2xl:gap-4 gap-2">
                        <div className="bg-gray-700 w-fit flex flex-row items-center gap-4 px-2 py-2 rounded-md">
                            <Image src="/icons/mail-01.svg" alt="" width="20" height="20" style={{ filter: "invert(58%) sepia(32%) saturate(152%) hue-rotate(176deg) brightness(91%) contrast(87%)" }}></Image>

                            <p className="text-gray-200 font-semibold">{inspectingCustomer.contact.email.full}</p>
                        </div>

                        <div className="bg-gray-700 w-fit flex flex-row items-center gap-4 px-2 py-2 rounded-md">
                            <Image src="/icons/phone.svg" alt="" width="20" height="20" style={{ filter: "invert(58%) sepia(32%) saturate(152%) hue-rotate(176deg) brightness(91%) contrast(87%)" }}></Image>

                            <p className="text-gray-200 font-semibold">{
                                (() => {
                                    const k = inspectingCustomer.contact.mobile.number.match(/^(\d{3})(\d{3})(\d{4})$/);
                                    if(!k) return ""
                                    return `${k[1]} ${k[2]} ${k[3]}`
                                })()
                            }</p>
                        </div>
                    </div>
                </div>

                <div className={`flex 2xl:flex-row flex-row items-center 2xl:gap-4 gap-2`}>
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
                                    setSearchFocused(false);
                                    setSearchType("products");
                                    clearSearchResults()
                                    setCustomerState(inspectingCustomer)
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
                                    <p onClick={() => {
                                        setKioskPanel("inv-transaction")
                                        setInspectingTransaction({ item: b, identifier: b.products[0].id });
                                    }} className="bg-gray-600 px-2 rounded-md cursor-pointer">View Details</p>
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
                                                            case "direct":
                                                                return `${k.origin.contact.name} (${k.origin.store_code})`
                                                            case "pickup":
                                                                return `${k.origin.contact.name} (${k.origin.store_code})`
                                                            case "quote":
                                                                return `By ${b.salesperson} at ${k.origin.contact.name} (${k.origin.store_code})`
                                                            case "shipment":
                                                                return `${k.origin.contact.name} (${k.origin.store_code}) -> ${k.destination?.store_code !== "000" ? k.destination?.store_code : k.destination?.contact.address.street} ${k.destination?.store_code !== "000" ? k.destination?.contact.name : k.destination?.contact.address.street2}`
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
    )
}