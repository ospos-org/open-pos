import { customerAtom } from "@/src/atoms/customer";
import { defaultKioskAtom, kioskPanelLogAtom } from "@/src/atoms/kiosk";
import { masterStateAtom } from "@/src/atoms/openpos";
import { probingPricePayableAtom } from "@/src/atoms/payment";
import { ordersAtom } from "@/src/atoms/transaction";
import { computeOrder, fileTransaction, OPEN_STOCK_URL } from "@/src/utils/helpers";
import { PaymentIntent, TransactionInput } from "@/src/utils/stock_types";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";
import { useState } from "react";
import { v4 } from "uuid";
import { getDate, sortDbOrders } from "../../kiosk";

export function TerminalPayment() {
    const setKioskPanel = useSetAtom(kioskPanelLogAtom)
    
    const currentStore = useAtomValue(masterStateAtom)
    const customerState = useAtomValue(customerAtom)
    const orderState = useAtomValue(ordersAtom)

    const [ probingPrice, setProbingPrice ] = useAtom(probingPricePayableAtom)
    const [ kioskState, setKioskState ] = useAtom(defaultKioskAtom)

    return (
        <div className="bg-blue-500 p-6 flex flex-col h-full items-center" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
            <div className="flex flex-row justify-between cursor-pointer w-full">
                <div 
                    onClick={() => {
                        setKioskPanel("select-payment-method")
                    }}
                    className="flex flex-row items-center gap-2"
                >
                    <Image src="/icons/arrow-narrow-left-1.svg" height={20} width={20} alt="" style={{ filter: "invert(100%) sepia(99%) saturate(0%) hue-rotate(119deg) brightness(110%) contrast(101%)" }} />
                    <p className="text-white">Cancel</p>
                </div>
                <p className="text-white">Awaiting Customer Payment</p>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-white text-3xl font-bold">${probingPrice?.toFixed(2)}</p>
                <p className="text-gray-200">Tap, Insert or Swipe</p>
            </div>

            <p onClick={() => {
                const payment_intents: PaymentIntent[] = [ ...kioskState.payment, {
                    amount: {quantity: probingPrice ?? 0, currency: 'NZD'},
                    delay_action: "Cancel",
                    delay_duration: "PT12H",
                    fulfillment_date: getDate(),
                    id: v4(),
                    order_ids: ["?"],
                    payment_method: "Card",
                    processing_fee: {quantity: 0.1, currency: 'NZD'},
                    processor: {location: '001', employee: 'EMPLOYEE_ID', software_version: 'k0.5.2', token: 'dec05e7e-4228-46c2-8f87-8a01ee3ed5a9'},
                    status: {
                        Complete: {
                            CardDetails: {
                                card_brand: "VISA",
                                last_4: "4025",
                                exp_month: "03",
                                exp_year: "2023",
                                fingerprint: "a20@jA928ajsf9a9828",
                                card_type: "DEBIT",
                                prepaid_type: "NULL",
                                bin: "",

                                entry_method: "PIN",
                                cvv_accepted: "TRUE",
                                avs_accepted: "TRUE",
                                auth_result_code: "YES",
                                statement_description: "DEBIT ACCEPTED",
                                card_payment_timeline: {
                                    authorized_at: "",
                                    captured_at: ""
                                }
                            }
                        }
                    }
                }];
                
                const transaction = (() => {
                    setKioskState({
                        ...kioskState,
                        payment: payment_intents
                    });
                
                    const qua = payment_intents.reduce(function (prev, curr) {
                        return prev + (curr.amount.quantity ?? 0)
                    }, 0);
                
                    if(qua < (kioskState.order_total ?? 0) && kioskState.transaction_type != "Quote") {
                        setProbingPrice((kioskState.order_total ?? 0) - qua)
                        setKioskPanel("select-payment-method")
                
                        return null;
                    }else {
                        const date = getDate();
                
                        // Following state change is for an in-store purchase, modifications to status and destination are required for shipments
                        // Fulfil the orders taken in-store and leave the others as open.
                        const new_state = computeOrder(kioskState.transaction_type ?? "Out", orderState, currentStore, customerState);
                        // setOrderState(sortDbOrders(new_state));
                
                        const transaction = {
                            ...kioskState,
                            customer: customerState ? {
                                customer_id: customerState?.id,
                                customer_type: "Individual"
                            } : {
                                customer_id: currentStore.store_id,
                                customer_type: "Store"
                            },
                            payment: payment_intents,
                            products: sortDbOrders(new_state),
                            order_date: date,
                            salesperson: currentStore.employee?.id ?? "",
                            till: currentStore.kiosk
                        } as TransactionInput;
                
                        return transaction;
                    }
                })()

                if(transaction) {
                    fetch(`${OPEN_STOCK_URL}/transaction`, {
                        method: "POST",
                        body: JSON.stringify(transaction),
                        credentials: "include",
                        redirect: "follow"
                    }).then(async k => {
                        if(k.ok) {
                            setKioskPanel("completed");
                        }else {
                            alert("Something went horribly wrong")
                        }
                    })
                }
            }}>skip to completion</p>
        </div>
    )
}