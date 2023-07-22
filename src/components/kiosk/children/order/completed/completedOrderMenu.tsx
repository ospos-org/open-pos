import { aCustomerActiveAtom, customerAtom } from "@/src/atoms/customer"
import { currentOrderAtom, defaultKioskAtom, kioskPanelAtom, kioskPanelHistory, transactingOrderAtom } from "@/src/atoms/kiosk"
import { ordersAtomsAtom } from "@/src/atoms/transaction"
import { useAtomValue, useSetAtom } from "jotai"
import { useResetAtom } from "jotai/utils"
import { IndividualProduct } from "./individualProduct"

export function CompletedOrderMenu() {
    const customerState = useAtomValue(customerAtom)
    const customerActive = useAtomValue(aCustomerActiveAtom)

    const kioskState = useAtomValue(defaultKioskAtom)
    const orderState = useAtomValue(ordersAtomsAtom)

    const resetKiosk = useResetAtom(defaultKioskAtom)
    const resetOrder = useResetAtom(currentOrderAtom)
    const resetCustomer = useResetAtom(customerAtom)

    const resetKioskPanel = useResetAtom(kioskPanelAtom)
    const resetKioskPanelHistory = useResetAtom(kioskPanelHistory)

    return (
        <div className="bg-gray-900 p-6 flex flex-col h-full gap-4" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
            <div>
                <p className="text-gray-600">{customerState?.name ?? "Guest"}</p>
                <p className="text-white font-bold text-2xl">${kioskState.order_total}</p>

                {kioskState.transaction_type == "Quote" ? <p>Quote</p>: <></>}
            </div>

            <div className="flex flex-col flex-1 gap-2">
                {
                    orderState.map((product) => <IndividualProduct key={product.toString()} productAtom={product} customerActive={customerActive} />)
                }
            </div>
            
            {
                kioskState.transaction_type != "Quote" ?
                <>
                    <p className="text-gray-600">PAYMENT(S)</p>
                    <div className="flex flex-col gap-2 w-full">
                        {
                            kioskState.payment.map(e => {
                                return (
                                    <div key={`${e.amount}-${e.fulfillment_date}-${e.payment_method}`} className="flex flex-row justify-between items-center text-white gap-4 w-full flex-1">
                                        <p className="text-gray-300 font-bold">{typeof e.payment_method !== "string" ? e.payment_method.Other : e.payment_method}</p>
                                        <hr className="flex-1 border-gray-500 h-[3px] border-[2px] bg-gray-500 rounded-md" />
                                        <p>${e.amount?.quantity.toFixed(2)}</p>
                                    </div>
                                )
                            })
                        }
                    </div>
                </>
                :
                <></>
            }

            <br />
            
            <p className="text-gray-600">RECEIPT OPTIONS</p>
            <div className="flex flex-row items-center justify-between">
                <p className="bg-gray-700 text-white px-4 py-2 rounded-md cursor-pointer">Print receipt</p>
                
                {
                    customerState?.contact.email ?
                    <p className="bg-gray-700 text-white px-4 py-2 rounded-md cursor-pointer">Email receipt</p>
                    :
                    <p className="bg-gray-800 text-gray-400 px-4 py-2 rounded-md select-none">Email receipt</p>
                }

                {
                    customerState?.contact.mobile ?
                    <p className="bg-gray-700 text-white px-4 py-2 rounded-md cursor-pointer">Text receipt</p>
                    :
                    <p className="bg-gray-800 text-gray-400 px-4 py-2 rounded-md select-none">Text receipt</p>
                }
                
                <p className="bg-gray-700 text-white px-4 py-2 rounded-md cursor-pointer">Gift receipt</p>
            </div>

            <div className="flex flex-row items-center gap-4">
                <div
                    onClick={() => {
                        resetKiosk()
                        resetOrder()
                        resetCustomer()

                        resetKioskPanel()
                        resetKioskPanelHistory()
                    }} 
                    className="bg-blue-700 cursor-pointer w-full rounded-md p-4 flex items-center justify-center">
                    <p className={`text-white font-semibold ${""}`}>Complete</p>
                </div>
            </div>
        </div>
    )
}