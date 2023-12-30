import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { useResetAtom } from "jotai/utils"
import Image from "next/image"

import { defaultKioskAtom, perfAtom } from "@atoms/kiosk"
import { totalProductQuantityAtom } from "@atoms/cart"
import { searchTypeHandlerAtom } from "@atoms/search"
import { customerAtom } from "@atoms/customer"

const FILTER_GRAY =
    "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)"
const FILTER_WHITE =
    "invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)"
const FILTER_ARROW =
    "invert(100%) sepia(5%) saturate(7417%) hue-rotate(235deg) brightness(118%) contrast(101%)"

export function CartActionHeader() {
    const perfState = useAtomValue(perfAtom)
    const productQuantity = useAtomValue(totalProductQuantityAtom)

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
                            className="cursor-pointer"
                            height={15} width={15}
                            src="/icons/x-2.svg" alt=""
                            style={{ filter: FILTER_GRAY }}
                        />
                    </div>
                    :
                    <div 
                        onClick={() => setSearchType("customers")}
                        className={
                            "bg-gray-800 rounded-md px-2 py-[0.125rem] " +
                            "flex flex-row items-center gap-2 cursor-pointer"
                        }
                    >
                        <p>Select Customer</p>

                        <Image 
                            height={15} width={15}
                            src="/icons/arrow-narrow-right.svg"
                            alt="" style={{ filter: FILTER_ARROW }}
                        />
                    </div>
                }

                <div className="text-sm text-gray-400">
                    {
                        productQuantity === 0
                        ? "Cart Empty"
                        : <p>{productQuantity} item{productQuantity > 1 ? "s" : ""}</p>
                    }
                </div>
            </div>

            <div className="flex flex-row items-center gap-4">
                {Boolean(perfState.type === "continuative") &&
                    <div className="flex flex-row items-center gap-[0.75rem] bg-blue-800 py-1 px-3 rounded-md">
                        <Image
                            className="select-none svg cursor-pointer"
                            width={15} height={15} src="/icons/coins-hand.svg"
                            alt=""
                            style={{filter: FILTER_WHITE }}
                        />

                        <p className="text-white uppercase select-none font-bold text-sm">Refund</p>
                    </div>
                }

                <div
                    className={
                        "flex flex-row items-center gap-[0.75rem] " +
                        "bg-gray-800 p-2 px-4 rounded-md cursor-pointer"
                    }
                >
                    <p className="text-white select-none" onClick={() => resetCart()}>Clear Cart</p>
                </div>
            </div>
        </div> 
    )
}