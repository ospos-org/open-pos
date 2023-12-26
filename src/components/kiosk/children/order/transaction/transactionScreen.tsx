import { useAtomValue, useSetAtom } from "jotai"
import Image from "next/image"

import { kioskPanelHistory, kioskPanelLogAtom } from "@atoms/kiosk"

import TransactionMenu from "./transactionMenu"

export function TransactionScreen() {
    const setKioskPanel = useSetAtom(kioskPanelLogAtom)
    const panelHistory = useAtomValue(kioskPanelHistory)

    return (
        <div className="bg-gray-900 p-6 flex flex-col h-full gap-4" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
            <div className="flex flex-row justify-between">
                <div 
                    onClick={() => {
                        if(panelHistory[panelHistory.length-1] === "related-orders") setKioskPanel("related-orders")
                        else setKioskPanel("cart")
                    }}
                    className="flex flex-row items-center gap-2 cursor-pointer"
                >
                    <Image src="/icons/arrow-narrow-left.svg" height={20} width={20} alt="" />
                    <p className="text-gray-400">Back</p>
                </div>
                <p className="text-gray-400">Transaction</p>
            </div>

            <TransactionMenu />
        </div>
    )
}