import { useAtomValue, useSetAtom } from 'jotai';
import {useEffect, useMemo, useState} from 'react'
import Image from 'next/image';
import moment from 'moment';

import { inspectingTransactionAtom } from '@atoms/transaction';
import { kioskPanelLogAtom } from '@atoms/kiosk';
import { searchTermAtom } from '@atoms/search';
import { useWindowSize } from '@hooks/useWindowSize';
import {Customer, Store, Transaction} from "@/generated/stock/Api";
import {openStockClient} from "~/query/client";

interface ItemTransactionProps {
    value: Transaction,
    index: number,
    searchLength: number,
}

const WHITE_FILTER = "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)"

export function ItemTransaction({ value, index, searchLength }: ItemTransactionProps) {
    const searchTermState = useAtomValue(searchTermAtom)

    const setKioskPanel = useSetAtom(kioskPanelLogAtom)
    const setInspectingTransaction = useSetAtom(inspectingTransactionAtom)

    const reachedEnd = useMemo(() =>
        !(index == searchLength-1 || searchLength == 1),
        [searchLength, index]
    )

    const filteredOrders = useMemo(() =>
            value.products.filter(
            k => k.reference
                .toLowerCase()
                .includes(searchTermState.toLowerCase())
        ),
        [searchTermState, value.products]
    );

    const [ customer, setCustomer ] = useState<Customer | Store | null>();
    const windowSize = useWindowSize();

    useEffect(() => {
        if(value.customer.customer_type != "Store") {
            openStockClient.customer.get(value.customer.customer_id)
                .then(data => data.ok && setCustomer(data.data))
        }else {
            openStockClient.store.getByCode(value.customer.customer_id)
                .then(data => data.ok && setCustomer(data.data))
        }
    }, [value]);

    if(!filteredOrders) return (<></>);

    else return (
        <div>
            {
                filteredOrders.map(b =>
                    <div
                        key={b.id}
                        onClick={() => {
                            setKioskPanel("inv-transaction")
                            setInspectingTransaction({ item: value, identifier: b.id });
                        }}
                        className="flex flex-col overflow-hidden h-fit"
                    >
                        <div className="grid items-center gap-4 p-4 hover:bg-gray-400 hover:bg-opacity-10 cursor-pointer" style={{ gridTemplateColumns: `25px minmax(150px, 175px) 150px ${(windowSize.width ?? 0) >= 1578 ? "minmax(300px, 2fr)" : ""}  75px` }}>
                            <div>
                                {
                                    b.order_type == "pickup" ?
                                    <Image src="/icons/building-02.svg" alt=""
                                           height={20} width={20}
                                           style={{ filter: WHITE_FILTER }} />
                                    :
                                    b.order_type == "quote" ?
                                    <Image src="/icons/globe-05.svg" alt=""
                                           height={20} width={20}
                                           style={{ filter: WHITE_FILTER }} />
                                    :
                                    b.order_type == "shipment" ?
                                    <Image src="/icons/globe-05.svg" alt=""
                                           height={20} width={20}
                                           style={{ filter: WHITE_FILTER }} />
                                    :
                                    <Image src="/icons/shopping-bag-01-filled.svg" alt=""
                                           height={20} width={20}
                                           style={{ filter: WHITE_FILTER }} />
                                }
                            </div>

                            <div className="flex flex-col gap-0 max-w-[26rem] w-full flex-1">
                                <p className="font-bold">{b.reference}</p>
                                <p>{moment(b.creation_date).format("DD/MM/YY hh:ss")}</p>
                            </div>

                            <div>{customer?.name}</div>

                            <div className="text-sm text-gray-400 2xl:flex hidden">
                                {b.products.map(k => k.product_name).join(", ")}
                            </div>

                            <div>${value.order_total.toFixed(2)}</div>
                        </div>

                        {Boolean(reachedEnd) && <hr className="border-gray-500" />}
                    </div>
                )
            }
        </div>
    )
}