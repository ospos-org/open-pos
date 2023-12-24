import {useAtom, useAtomValue, useSetAtom} from "jotai"
import {v4} from "uuid"
import Image from "next/image"

import {defaultKioskAtom, generateTransactionAtom, kioskPanelLogAtom} from "@atoms/kiosk"
import {paymentIntentsAtom, probingPricePayableAtom} from "@atoms/payment"
import {getDate} from "@utils/utils"
import {toast} from "sonner"
import {openStockClient} from "~/query/client";
import {Payment, PaymentAction} from "@/generated/stock/Api";

export function TerminalPayment() {
    const setKioskPanel = useSetAtom(kioskPanelLogAtom)
    
    const computeTransaction = useAtomValue(generateTransactionAtom)
    const kioskState = useAtomValue(defaultKioskAtom)
    
    const [ paymentIntents, setPaymentIntents ] = useAtom(paymentIntentsAtom)
    const [ probingPrice, setProbingPrice ] = useAtom(probingPricePayableAtom)

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
                const payment_intents: Payment[] = [ ...paymentIntents, {
                    amount: {quantity: probingPrice ?? 0, currency: 'NZD'},
                    delay_action: PaymentAction.Cancel,
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

                setPaymentIntents([ ...payment_intents ]);

                // Determine how much has been paid.
                const qua = payment_intents.reduce(function (prev, curr) {
                    return prev + (curr.amount.quantity ?? 0)
                }, 0);

                // If the current payment is still suboptimal, return otherwise continue.
                // Unless the transaction is a quote, then proceed as normal regardless. 
                if(qua < (kioskState.order_total ?? 0) && kioskState.transaction_type != "Quote") {
                    setProbingPrice((kioskState.order_total ?? 0) - qua)
                    setKioskPanel("select-payment-method")
            
                    return null;
                }

                openStockClient.transaction.create({
                    ...computeTransaction,
                    payment: payment_intents
                }).then(data => {
                    if (data.ok) setKioskPanel("completed")
                    else toast.message("Failed to save transaction", { description: `Server gave ${data.error}` })
                })
            }}>skip to completion</p>
        </div>
    )
}