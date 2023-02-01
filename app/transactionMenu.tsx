import Image from "next/image";
import { useEffect, useState } from "react";
import { Customer, DbOrder, Order, Transaction } from "./stock-types";

export default function TransactionMenu({ transaction }: { transaction: [Transaction, string] | null }) {
    const [ customer, setCustomer ] = useState<Customer | null>();
    const [ activeTransaction, setActiveTransaction ] = useState<DbOrder | null>(transaction?.[0]?.products.find(k => k.id == transaction?.[1]) ?? null);
    const [ refChoices, setRefChoices ] = useState(transaction?.[0].products);
    const [ selectorOpen, setSelectorOpen ] = useState(false);
    
    useEffect(() => {
        setActiveTransaction(transaction?.[0]?.products.find(k => k.id == transaction?.[1]) ?? null);
        // refChoices?.find(b => b.reference.includes(transaction?.[1]))
        setRefChoices(transaction?.[0].products)

        fetch(`http://127.0.0.1:8000/customer/${transaction?.[0]?.customer}`, {
            method: "GET",
            credentials: "include",
            redirect: "follow"
        }).then(async k => {
            const n = await k.json();
            setCustomer(n);
        })
    }, [transaction]);

    if(!transaction) return (<></>)

    return (
        <div className="flex flex-col">
            <div className="flex flex-row items-center justify-between">
                <div className="flex flex-col">
                    <p className="font-semibold text-white"> <i className="not-italic font-normal opacity-50">Order:</i> {activeTransaction?.reference}</p>
                    <p className="text-xl text-white font-semibold">{customer?.name}</p>
                </div>

                <div className="relative inline-block w-fit float-right">
                    <p className="text-gray-400 text-sm">Transaction contains multiple orders</p>

                    <div className={`bg-gray-800 w-full select-none text-white flex flex-row justify-between gap-4 cursor-pointer px-4 py-2 ${selectorOpen ? "rounded-t-md rounded-b-none" : "rounded-md"}`} onClick={() => {
                        setSelectorOpen(!selectorOpen)
                    }}>
                        <p className="font-semibold">{activeTransaction?.order_type.toUpperCase()} - {activeTransaction?.origin.code}</p>
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
                                        {k.order_type.toUpperCase()} - {k.origin.code}
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            </div>

            <div>
                {
                    activeTransaction?.status_history.map(k => {
                        let type = "Queued";

                        //@ts-ignore
                        if(k.item.status?.Queued) type = "Queued"
                        //@ts-ignore
                        else if(k.item.status?.Transit) type = "Transit"
                        //@ts-ignore
                        else if(k.item.status?.Processing) type = "Processing"
                        //@ts-ignore
                        else if(k.item.status?.InStore) type = "InStore"
                        //@ts-ignore
                        else if(k.item.status?.Fulfilled) type = "Fulfilled"
                        //@ts-ignore
                        else if(k.item.status?.Failed) type = "Failed"

                        return (
                            <div key={k.timestamp}>
                                <div className="bg-gray-400 h-7 w-7 rounded-full">
                                    {(() => {
                                        switch(type) {
                                            case "Queued":
                                                return (
                                                    <div>
                                                        <Image src="/icons/clock.svg" alt="" height={20} width={20}/>
                                                    </div>
                                                )
                                            default:
                                                return (
                                                    <div></div>
                                                )
                                        }
                                    })()}
                                </div>
                                
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}