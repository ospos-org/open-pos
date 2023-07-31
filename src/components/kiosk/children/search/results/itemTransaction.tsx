import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react'
import Image from 'next/image';
import moment from 'moment';

import { inspectingTransactionAtom } from '@atoms/transaction';
import { Customer, Transaction } from '@utils/stockTypes'
import { kioskPanelLogAtom } from '@atoms/kiosk';
import { OPEN_STOCK_URL } from "@utils/environment";
import { searchTermAtom } from '@atoms/search';
import { useWindowSize } from '@hooks/useWindowSize';
import queryOs from '@/src/utils/query-os';

interface ItemTransactionProps {
    transaction: Transaction,
    notEnd: boolean
}

export function ItemTransaction({ transaction, notEnd }: ItemTransactionProps) {
    const searchTermState = useAtomValue(searchTermAtom)

    const setKioskPanel = useSetAtom(kioskPanelLogAtom)
    const setInspectingTransaction = useSetAtom(inspectingTransactionAtom)

    const n = transaction.products.filter(k => k.reference.toLowerCase().includes(searchTermState.toLowerCase()));

    const [ customer, setCustomer ] = useState<Customer | null>();
    const windowSize = useWindowSize();

    useEffect(() => {
        if(transaction.customer.customer_type != "Store") {
            queryOs(`customer/${transaction.customer.customer_id}`, {
                method: "GET",
                credentials: "include",
                redirect: "follow"
            }).then(async k => {
                const n = await k.json();
                setCustomer(n);
            })
        }else {
            queryOs(`store/code/${transaction.customer.customer_id}`, {
                method: "GET",
                credentials: "include",
                redirect: "follow"
            }).then(async k => {
                const n = await k.json();
                setCustomer(n);
            })
        }
    }, [transaction]);

    if(!n) return (<></>);
    else return (
        <div>
            {
                n.map((b, indx) => 
                    <div
                        key={b.id}
                        onClick={() => {
                            setKioskPanel("inv-transaction")
                            setInspectingTransaction({ item: transaction, identifier: b.id });
                        }}
                        className="flex flex-col overflow-hidden h-fit"
                    >
                        <div className="grid items-center gap-4 p-4 hover:bg-gray-400 hover:bg-opacity-10 cursor-pointer" style={{ gridTemplateColumns: `25px minmax(150px, 175px) 150px ${(windowSize.width ?? 0) >= 1578 ? "minmax(300px, 2fr)" : ""}  75px` }}>
                            <div>
                                {
                                    b.order_type == "pickup" ?
                                    <Image src="/icons/building-02.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                    :
                                    b.order_type == "quote" ?
                                    <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                    :
                                    b.order_type == "shipment" ?
                                    <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                    :
                                    <Image src="/icons/shopping-bag-01-filled.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                                }
                            
                                {/* <p className="w-full text-center px-4 rounded-full bg-gray-200 text-black">{b.order_type}</p> */}
                            </div>

                            <div className="flex flex-col gap-0 max-w-[26rem] w-full flex-1">
                                <p className="font-bold">{b.reference}</p>
                                <p>{moment(b.creation_date).format("DD/MM/YY hh:ss")}</p>
                                {/* <p className="text-sm text-gray-400">{e.order_history.length} Past Orders</p> */}
                            </div>

                            <div>
                                {/* {JSON.stringify(customer)} */}
                                {customer?.name}
                            </div>

                            <div className="text-sm text-gray-400 2xl:flex hidden">
                                {b.products.map(k => k.product_name).join(", ")}
                            </div>

                            <div>
                                ${transaction.order_total.toFixed(2)}
                            </div>
                        </div>

                        {
                            notEnd ? <></> : <hr className="border-gray-500" />
                        }
                    </div>
                )
            }
        </div>
    )
}