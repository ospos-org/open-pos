import { useAtomValue, useSetAtom } from "jotai";

import { priceAtom, probingPricePayableAtom } from "@atoms/payment";
import { kioskPanelLogAtom, parkSaleAtom } from "@atoms/kiosk";
import { ordersAtom } from "@atoms/transaction";

export function CartActionFooter() {
    const orderInfo = useAtomValue(priceAtom)
    const orderState = useAtomValue(ordersAtom)

    const parkSale = useSetAtom(parkSaleAtom)
    const setKioskPanel = useSetAtom(kioskPanelLogAtom)
    const setProbePrice = useSetAtom(probingPricePayableAtom)

    return (
        <div className="flex flex-row items-center gap-4">
            <div 
                onClick={parkSale}
                className={`bg-gray-300 w-full rounded-md p-4 flex items-center justify-center cursor-pointer ${(orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0)) ?? 0 > 0 ? "" : "bg-opacity-10 opacity-20"}`}>
                <p className="text-gray-800 font-semibold">Park Sale</p>
            </div>

            <div
                onClick={() => {
                    setKioskPanel("select-payment-method");
                    setProbePrice(orderInfo?.total);
                }} 
                className={`${(orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) ?? 0) > 0 ? "bg-blue-700 cursor-pointer" : "bg-blue-700 bg-opacity-10 opacity-20"} w-full rounded-md p-4 flex items-center justify-center`}>
                <p className={`text-white font-semibold ${""}`}>Checkout</p>
            </div>
        </div>
    )
}