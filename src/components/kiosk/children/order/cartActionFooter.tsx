import { useAtomValue, useSetAtom } from "jotai";
import {useCallback} from "react";

import { priceAtom, probingPricePayableAtom } from "@atoms/payment";
import { kioskPanelLogAtom, parkSaleAtom } from "@atoms/kiosk";
import {totalProductQuantityAtom} from "@atoms/cart";

export function CartActionFooter() {
    const orderInfo = useAtomValue(priceAtom)
    const orderProductQuantity = useAtomValue(totalProductQuantityAtom)

    const parkSale = useSetAtom(parkSaleAtom)
    const setKioskPanel = useSetAtom(kioskPanelLogAtom)
    const setProbePrice = useSetAtom(probingPricePayableAtom)

    const moveToCheckout = useCallback(() => {
        setKioskPanel("select-payment-method");
        setProbePrice(orderInfo?.total);
    }, [orderInfo?.total, setKioskPanel, setProbePrice])

    return (
        <div className="flex flex-row items-center gap-4">
            <div 
                onClick={parkSale}
                className={`
                    bg-gray-500 hover:bg-gray-200 flex-nowrap w-full rounded-md p-4 flex items-center justify-center cursor-pointer 
                    ${Boolean(orderProductQuantity <= 0) && "bg-opacity-10 opacity-20 hover:bg-gray-500!"}
                `}
            >
                <p className="text-gray-800 font-semibold">Park Sale</p>
            </div>

            <div
                onClick={moveToCheckout}
                className={
                    (
                        orderProductQuantity > 0
                        ? "bg-blue-700 cursor-pointer"
                        : "bg-blue-700 bg-opacity-10 opacity-20"
                    ) + " w-full rounded-md p-4 flex items-center justify-center"
                }
            >
                <p className="text-white font-semibold">Checkout</p>
            </div>
        </div>
    )
}