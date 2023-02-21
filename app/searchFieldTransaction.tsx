import moment from 'moment';
import Image from 'next/image';
import { KeyboardEvent, useEffect, useState } from 'react'
import BarcodeReader from 'react-barcode-reader'
import { Customer, Transaction } from './stock-types'
import {OPEN_STOCK_URL} from "./helpers";

export const SearchFieldTransaction = ({ transaction, searchTermState, notEnd, setPadState, setCurrentViewedTransaction }: { transaction: Transaction, setCurrentViewedTransaction: Function, searchTermState: string, notEnd: boolean, setPadState: Function }) => {
    const n = transaction.products.filter(k => k.reference.toLowerCase().includes(searchTermState.toLowerCase()));
    const b_ = transaction.products.map(k => k.reference.toLowerCase().includes(searchTermState.toLowerCase()) ? null : k)

    // (indx == result.length-1)
    const [ customer, setCustomer ] = useState<Customer | null>();

    useEffect(() => {
        if(transaction.customer.customer_type != "Store") {
            fetch(`${OPEN_STOCK_URL}/customer/${transaction.customer.customer_id}`, {
                method: "GET",
                credentials: "include",
                redirect: "follow"
            }).then(async k => {
                const n = await k.json();
                setCustomer(n);
            })
        }else {
            fetch(`${OPEN_STOCK_URL}/store/code/${transaction.customer.customer_id}`, {
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
                            setPadState("inv-transaction")
                            setCurrentViewedTransaction([transaction, b.id]);
                        }} 
                        className="flex flex-col overflow-hidden h-fit">
                        <div className="grid items-center gap-4 p-4 hover:bg-gray-400 hover:bg-opacity-10 cursor-pointer" style={{ gridTemplateColumns: "25px minmax(150px, 175px) 150px minmax(300px, 2fr) 75px" }}>
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
                                {/* {JSON.stringify(customer)} */}
                                {customer?.name}
                            </div>

                            <div>
                                {b.products.map(k => k.product_name).join(", ")}
                            </div>

                            <div>
                                ${transaction.order_total.toFixed(2)}
                            </div>
                        </div>

                        {
                            (!notEnd && (indx == n.length-1)) ? <></> : <hr className="border-gray-500" />
                        }
                    </div>
                )
            }
        </div>
    )
}