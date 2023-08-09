import { useAtom, useAtomValue, useSetAtom } from "jotai"

import { customerAtom } from "@atoms/customer"
import Image from "next/image"
import { searchTypeHandlerAtom } from "@/src/atoms/search"
import { useResetAtom } from "jotai/utils"
import { defaultKioskAtom, perfAtom } from "@/src/atoms/kiosk"
import { ordersAtom } from "@/src/atoms/transaction"

export function CartActionHeader() {
    const perfState = useAtomValue(perfAtom)
    const orderState = useAtomValue(ordersAtom)

    const setSearchType = useSetAtom(searchTypeHandlerAtom)
    const resetCart = useResetAtom(defaultKioskAtom)

    const [ customerState, setCustomerState ] = useAtom(customerAtom)

    return (
        <div className="flex flex-row items-center justify-between max-h-screen overflow-hidden">
            <div className="text-white">
                {
                    customerState ?
                    <div className="flex flex-row items-center gap-2">
                        <h2 className="font-semibold text-lg">{customerState.name}</h2>

                        <Image
                            onClick={() => setCustomerState(null)} 
                            className="cursor-pointer" height={15} width={15} src="/icons/x-2.svg" alt="" style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }}></Image>
                    </div>
                    :
                    <div 
                        onClick={() => setSearchType("customers")}
                        className="bg-gray-800 rounded-md px-2 py-[0.125rem] flex flex-row items-center gap-2 cursor-pointer">
                        <p>Select Customer</p>
                        <Image 
                            className=""
                            height={15} width={15} src="/icons/arrow-narrow-right.svg" alt="" style={{ filter: "invert(100%) sepia(5%) saturate(7417%) hue-rotate(235deg) brightness(118%) contrast(101%)" }}></Image>
                    </div>
                }
                <div className="text-sm text-gray-400">
                    {
                        orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) == 0
                        ? 
                        "Cart Empty" 
                        : 
                        <p>
                            {orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0)} item{((orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) ?? 0) > 1 ? "s" : "")}
                        </p>
                    }
                </div>
            </div>
            
            <div className="flex flex-row items-center gap-4">
                { perfState.type === "continuative" ? 
                        <div className="flex flex-row items-center gap-[0.75rem] bg-blue-800 py-1 px-3 rounded-md">
                            <Image className="select-none svg cursor-pointer" width={15} height={15} src="/icons/coins-hand.svg" alt="" style={{ filter: "invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)" }}></Image>
                            <p className="text-white uppercase select-none font-bold text-sm">Refund</p>
                        </div> 
                    : 
                        <></> 
                }
                

                <div className="flex flex-row items-center gap-[0.75rem] bg-gray-800 p-2 px-4 rounded-md cursor-pointer">
                    <p className="text-white select-none" onClick={() => {
                        resetCart()
                    }}>Clear Cart</p>
                </div>
            </div>
        </div> 
    )
}