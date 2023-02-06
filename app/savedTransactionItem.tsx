import moment from 'moment';
import Image from 'next/image';
import { KeyboardEvent, useEffect, useState } from 'react'
import BarcodeReader from 'react-barcode-reader'
import { Customer, Transaction } from './stock-types'

export const SavedTransactionItem = ({ transaction }: { transaction: Transaction }) => {
    const [ customer, setCustomer ] = useState<Customer | null>();

    useEffect(() => {
        if(transaction.customer.customer_type != "Store") {
            fetch(`http://127.0.0.1:8000/customer/${transaction.customer.customer_id}`, {
                method: "GET",
                credentials: "include",
                redirect: "follow"
            }).then(async k => {
                const n = await k.json();
                setCustomer(n);
            })
        }else {
            fetch(`http://127.0.0.1:8000/store/code/${transaction.customer.customer_id}`, {
                method: "GET",
                credentials: "include",
                redirect: "follow"
            }).then(async k => {
                const n = await k.json();
                setCustomer(n);
            })
        }

        
    }, [transaction]);

    // useEffect(() => {
    //     let name = customer?.name;
    //     let rgx = new RegExp(/(\p{L}{1})\p{L}+/, 'gu');

    //     let initials = [...name.matchAll(rgx)] || [];

    //     initials = (
    //     (initials.shift()?.[1] || '') + (initials.pop()?.[1] || '')
    //     ).toUpperCase();
    // }, [customer])

    if(!transaction) return (<></>);
    else return (
        <div className="flex flex-row items-center gap-4 p-4 text-white border-r-2 border-gray-600">
            <div className="bg-fuchsia-100 text-black p-2 px-[0.7rem] rounded-md font-bold">{customer?.name.split(" ").map((n)=>n[0]).join("")}</div>
            <div className="flex flex-col">
                <h3>{customer?.name}</h3>
                <div className="flex flex-row items-center gap-[0.2rem]">
                    <p className="text-sm">{transaction.products.reduce((p, c) => p + c.products.length, 0)} item{transaction.products.reduce((p, c) => p + c.products.length, 0) > 1 ? "s" : ""} </p>
                    <p className="text-gray-400 text-sm">&#8226; Kiosk {transaction.till}</p>
                </div>
            </div>
            <br />
            <Image width="25" height="25" src="/icons/expand-04.svg" alt={''}></Image>
        </div>
    )
}