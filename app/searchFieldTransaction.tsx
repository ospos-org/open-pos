import moment from 'moment';
import Image from 'next/image';
import { KeyboardEvent, useEffect, useState } from 'react'
import BarcodeReader from 'react-barcode-reader'
import { Customer, Transaction } from './stock-types'

export const SearchFieldTransaction = ({ transaction, searchTermState, notEnd }: { transaction: Transaction, searchTermState: string, notEnd: boolean }) => {
    const b = transaction.products.find(k => k.reference.toLowerCase().includes(searchTermState.toLowerCase()));
    const b_ = transaction.products.map(k => k.reference.toLowerCase().includes(searchTermState.toLowerCase()) ? null : k)

    // (indx == result.length-1)
    const [ customer, setCustomer ] = useState<Customer | null>();

    useEffect(() => {
        fetch(`http://127.0.0.1:8000/customer/${transaction.customer}`, {
            method: "GET",
            credentials: "include",
            redirect: "follow"
        }).then(async k => {
            const n = await k.json();
            setCustomer(n);
        })
    }, [transaction]);

    if(!b) return (<></>);
    else return (
        <div className="flex flex-col overflow-hidden h-fit">
            <div className="grid items-center gap-4 p-4 hover:bg-gray-400 hover:bg-opacity-10 cursor-pointer" style={{ gridTemplateColumns: "25px minmax(150px, 175px)  minmax(300px, 2fr) 225px 75px" }}>
                <div>
                    {
                        b.order_type == "Pickup" ?
                        <Image src="/icons/building-02.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                        :
                        b.order_type == "Quote" ?
                        <Image src="/icons/globe-05.svg" alt="" height={20} width={20} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} />
                        :
                        b.order_type == "Shipment" ?
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
                    {b.products.map(k => k.product_name).join(", ")}
                </div>

                <div>
                    {customer?.name}
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