import useKeyPress from "@/src/hooks/useKeyPress";
import Image from "next/image";
import { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import {computeOrder, OPEN_STOCK_URL} from "../../../../utils/helpers";
import { getDate } from "../../kiosk";
import { Customer, KioskState, MasterState, Order, TransactionInput, VariantInformation } from "../../../../utils/stock_types";

const PaymentMethod: FC<{ setPadState: Function, orderState: Order[], kioskState: KioskState, setKioskState: (stateset: (oldState: KioskState) => KioskState) => void, ctp: [number | null, Function], master_state: MasterState, customerState: Customer | null }> = ({ setPadState, orderState, kioskState, setKioskState, ctp, master_state, customerState }) => {
    const [ editPrice, setEditPrice ] = useState(false);
    const [ currentTransactionPrice, setCurrentTransactionPrice ] = ctp;
    const [ hasNegativeStock, setHasNegativeStock ] = useState(false);

    const f1Pressed = useKeyPress(['F1'])
    const f1firstUpdate = useRef(0);

    useEffect(() => {
        if (f1firstUpdate.current < 2) {
            f1firstUpdate.current += 1;
            return;
        }

        setKioskState((oldState: KioskState) => ({
            ...oldState,
            transaction_type: "Out"
        }));

        setPadState("await-debit");
    }, [f1Pressed]);

    const f2Pressed = useKeyPress(['F2'])
    const f2firstUpdate = useRef(0);

    useEffect(() => {
        if (f2firstUpdate.current < 2) {
            f2firstUpdate.current += 1;
            return;
        }

        setPadState("await-cash");
    }, [f2Pressed]);

    const f6Pressed = useKeyPress(['F6']);
    const f6firstUpdate = useRef(0);

    useEffect(() => {
        if (f6firstUpdate.current < 2) {
            f6firstUpdate.current += 1;
            return;
        }

        const new_state = computeOrder("Quote", orderState, master_state, customerState);
        
        const transaction = {
            ...kioskState,
            products: new_state,
            customer: customerState ? {
                customer_id: customerState?.id,
                customer_type: "Individual"
            } : {
                customer_id: master_state.store_id,
                customer_type: "Store"
            },
            order_total: 0.00,
            transaction_type: "Quote",
            payment: [],
            order_date: getDate(),
            salesperson: master_state.employee?.id ?? "",
            till: master_state.kiosk
        } as TransactionInput;

        if(transaction) {
            fetch(`${OPEN_STOCK_URL}/transaction`, {
                method: "POST",
                body: JSON.stringify(transaction),
                credentials: "include",
                redirect: "follow"
            }).then(async k => {
                console.log(k);

                if(k.ok) {
                    setPadState("completed");
                }else {
                    alert("Something went horribly wrong")
                }
            })
        }
    }, [f6Pressed]);

    useEffect(() => {
        let has_negative_stocks = false;
        orderState.map(b => {
            // All products
            b.products.map(p => {
                // All variants
                p.product.variants.map(n => {
                    if(p.product_code == n.barcode) {
                        const store_id = b.origin.store_id;
                        const stock_level = n.stock.reduce((p, c) => p + (c.store.store_id == store_id ? c.quantity.quantity_sellable : 0), 0);

                        console.log(store_id, stock_level, n.stock);
                        if(stock_level <= 0) {
                            has_negative_stocks = true;
                        }
                    }
                })
            }) 
        })

        setHasNegativeStock(has_negative_stocks);
    }, [orderState])

    return (
        <div className="bg-gray-900 p-6 flex flex-col h-full overflow-y-scroll" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
            <div className="flex flex-col h-full gap-24">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-row justify-between cursor-pointer">
                        <div 
                            onClick={() => {
                                setPadState("cart")
                            }}
                            className="flex flex-row items-center gap-2"
                        >
                            <Image src="/icons/arrow-narrow-left.svg" height={20} width={20} alt="" />
                            <p className="text-gray-400">Back</p>
                        </div>
                        <p className="text-gray-400">Select Preferred Payment Method</p>
                    </div>

                    {
                        hasNegativeStock ?
                        <div className="flex flex-col justify-between bg-red-900 px-2 pr-4 py-2 rounded-md gap-2">
                            <p className="text-white bg-red-600 px-2 rounded-md font-bold font-mono text-center">WARNING</p>
                            <p className="text-red-200 p-2">This cart contains products with negative stock levels, proceed with caution.</p>
                        </div>
                        :
                        <></>
                    }
                </div>
            
                <div className="self-center flex flex-col items-center">
                    <p className="text-gray-400 text-sm">TO PAY</p>

                    {
                        editPrice ? 
                            <input autoFocus className="bg-transparent w-fit text-center outline-none font-semibold text-3xl text-white" placeholder={
                                (
                                    (kioskState.order_total ?? 0)
                                - 
                                    (
                                        kioskState.payment.reduce(function (prev, curr) {
                                            return prev + (curr.amount.quantity ?? 0)
                                        }, 0)
                                    ) 
                                ).toFixed(2)
                            } onBlur={(e) => {
                                if(e.currentTarget.value == "") {
                                    setEditPrice(false)
                                    setCurrentTransactionPrice(kioskState.order_total)
                                }else {
                                    let p = parseFloat(e.currentTarget.value);

                                    if(p < (kioskState.order_total ?? 0)) {
                                        setCurrentTransactionPrice(p)
                                        setEditPrice(false)
                                    } else if (p == kioskState.order_total) {
                                        setEditPrice(false)
                                        setCurrentTransactionPrice(kioskState.order_total)
                                    }
                                }
                            }}
                            onKeyDown={(e) => {
                                if(e.key == "Enter") {
                                    if(e.currentTarget.value == "") {
                                        setEditPrice(false)
                                        setCurrentTransactionPrice(kioskState.order_total)
                                    } else { 
                                        let p = parseFloat(e.currentTarget.value);

                                        if(p < (kioskState.order_total ?? 0)) {
                                            setCurrentTransactionPrice(p)
                                            setEditPrice(false)
                                        } else if (p == kioskState.order_total) {
                                            setEditPrice(false)
                                            setCurrentTransactionPrice(kioskState.order_total)
                                        }
                                    }
                                }
                            }}
                            ></input>
                        :
                            <p className="font-semibold text-3xl text-white">${currentTransactionPrice?.toFixed(2)}</p>
                    }

                    {
                        (currentTransactionPrice ?? kioskState?.order_total ?? 0) < ((kioskState.order_total ?? 0)
                        - 
                            (
                                kioskState.payment.reduce(function (prev, curr) {
                                    return prev + (curr.amount.quantity ?? 0)
                                }, 0)
                            ) ) ?
                        <p className="text-gray-500">${(kioskState.order_total! - (currentTransactionPrice! + kioskState.payment.reduce(function (prev, curr) {
                            return prev + (curr.amount.quantity ?? 0)
                        }, 0))).toFixed(2)} remains</p>
                        :
                        <></>
                    }

                    <br />

                    <div
                        onClick={() => {
                            setEditPrice(true)
                        }} 
                        className="self-center flex flex-row items-center gap-2 cursor-pointer p-2"
                    >
                        <Image src="/icons/coins-stacked-03.svg" height={20} width={20} alt="" className="text-white" style={{ filter: "invert(78%) sepia(15%) saturate(224%) hue-rotate(179deg) brightness(82%) contrast(84%)" }} />
                        <p className="text-gray-400">Split Payment</p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-16 flex-1 h-full justify-center pb-16">
                    <div 
                        className="flex flex-row items-end gap-2 cursor-pointer"
                        onClick={() => {
                            setKioskState((oldState) => ({
                                ...oldState,
                                transaction_type: "Out"
                            }));

                            setPadState("await-debit");
                        }}>
                        <p className="text-white font-semibold text-2xl">Eftpos</p>
                        <p className="text-sm text-gray-400">F1</p>
                    </div>
                    <div 
                        className="flex flex-row items-end gap-2 cursor-pointer"
                        onClick={() => {
                            setPadState("await-cash");
                        }}>
                        <p className="text-white font-semibold text-2xl">Cash</p>
                        <p className="text-sm text-gray-400">F2</p>
                    </div>
                    <div className="flex flex-row items-end gap-2 cursor-pointer">
                        <p className="text-gray-400 font-semibold text-2xl">Bank Transfer</p>
                        <p className="text-sm text-gray-400">F3</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex flex-row items-end gap-2 cursor-pointer">
                            <p className="text-white font-semibold text-2xl">Gift Card</p>
                            <p className="text-sm text-gray-400">F4</p>
                        </div>
                        <div className="flex flex-row items-end gap-1 cursor-pointer">
                            <p className="text-sm text-gray-400">Check Ballance</p>
                            <p className="text-xs text-gray-400">F5</p>
                        </div>
                    </div>
                    <div
                        onClick={() => {
                            // let transaction = fileTransaction([], setKioskState, { ...kioskState, transaction_type: "quote" }, setCurrentTransactionPrice, setPadState, orderState, master_state, customerState);
                            const new_state = computeOrder("Quote", orderState, master_state, customerState);

                            const transaction = {
                                ...kioskState,
                                products: new_state,
                                customer: customerState ? {
                                    customer_id: customerState?.id,
                                    customer_type: "Individual"
                                } : {
                                    customer_id: master_state.store_id,
                                    customer_type: "Store"
                                },
                                order_total: 0.00,
                                transaction_type: "Quote",
                                payment: [],
                                order_date: getDate(),
                                salesperson: master_state.employee?.id ?? "",
                                till: master_state.kiosk
                            } as TransactionInput;

                            if(transaction) {
                                fetch(`${OPEN_STOCK_URL}/transaction`, {
                                    method: "POST",
                                    body: JSON.stringify(transaction),
                                    credentials: "include",
                                    redirect: "follow"
                                }).then(async k => {
                                    console.log(k);

                                    if(k.ok) {
                                        setPadState("completed");
                                    }else {
                                        alert("Something went horribly wrong")
                                    }
                                })
                            }
                        }} 
                        className="flex flex-row items-end gap-2 cursor-pointer">
                        <p className="text-white font-semibold text-2xl">Save as Quote</p>
                        <p className="text-sm text-gray-400">F6</p>
                    </div>
                </div>

                <div className="self-center flex flex-col items-center">
                    
                </div>
            </div>
        </div>
    )
}

export default PaymentMethod;