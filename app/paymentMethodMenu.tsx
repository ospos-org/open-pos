import Image from "next/image";
import { FC, useState } from "react";
import { applyDiscount, findMaxDiscount } from "./discount_helpers";
import { KioskState, Order, VariantInformation } from "./stock-types";

const PaymentMethod: FC<{ setPadState: Function, orderState: Order[], kioskState: KioskState, ctp: [number | null, Function] }> = ({ setPadState, orderState, kioskState, ctp }) => {
    const [ editPrice, setEditPrice ] = useState(false);
    const [ currentTransactionPrice, setCurrentTransactionPrice ] = ctp;

    return (
        <div className="bg-gray-900 min-w-[550px] max-w-[550px] p-6 flex flex-col h-full">
            <div className="flex flex-col h-full gap-24">
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
            
                <div className="self-center flex flex-col items-center">
                    <p className="text-gray-400 text-sm">TO PAY</p>

                    {
                        editPrice ? 
                            <input autoFocus className="bg-transparent w-fit text-center outline-none font-semibold text-3xl text-white" placeholder={
                                ((
                                    orderState.reduce(
                                        (p,c) => 
                                            p += applyDiscount(
                                                c.products.reduce(function (prev, curr) {
                                                    return prev + (curr.variant_information.retail_price * curr.quantity)
                                                }, 0)
                                            , c.discount)
                                        , 0)
                                     - (
                                            kioskState.payment.reduce(function (prev, curr) {
                                                return prev + (curr.amount ?? 0)
                                            }, 0)
                                        ) 
                                ) * 1.15).toFixed(2)
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
                        (currentTransactionPrice ?? kioskState?.order_total ?? 0) < (kioskState?.order_total ?? 0) ?
                        <p className="text-gray-500">${(kioskState.order_total! - (currentTransactionPrice! + kioskState.payment.reduce(function (prev, curr) {
                            return prev + (curr.amount ?? 0)
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

                <div className="flex flex-col items-center gap-16 flex-1 h-full justify-center">
                    <div 
                        className="flex flex-row items-end gap-2 cursor-pointer"
                        onClick={() => {
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
                </div>

                <div className="self-center flex flex-col items-center">
                    
                </div>
            </div>
        </div>
    )
}

export default PaymentMethod;