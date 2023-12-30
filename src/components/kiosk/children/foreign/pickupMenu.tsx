import { useCallback, useEffect, useMemo, useState } from "react"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import Image from "next/image"

import { kioskPanelLogAtom } from "@atoms/kiosk"
import { masterStateAtom } from "@atoms/openpos"
import { ordersAtom } from "@atoms/transaction"
import { Stock, Store } from "@/generated/stock/Api";
import {ContextualOrder, ContextualProductPurchase} from "@utils/stockTypes";
import {openStockClient} from "~/query/client";
import EditPickup from "@components/kiosk/children/foreign/pickup/editPickup";
import PickupProductSelector from "@components/kiosk/children/foreign/pickup/pickupProductSelector";

export function PickupMenu() {
    const [ pageState, setPageState ] =
        useState<"origin" | "edit">("origin");
    const [ generatedOrder, setGeneratedOrder ] =
        useState<{ item: ContextualProductPurchase | undefined, store: string, alt_stores: Stock[], ship: boolean, quantity: number }[]>([]);
    const [ pickupStore, setPickupStore ] =
        useState<Store | null>(null);

    const currentStore = useAtomValue(masterStateAtom)
    const setKioskPanel = useSetAtom(kioskPanelLogAtom)

    useEffect(() => {
        const foundStore = currentStore?.store_lut?.find(k => k.id == currentStore.store_id)
        if (foundStore) setPickupStore(foundStore)
    }, [currentStore])

    const pickupPage = useMemo(() => {
        if (pageState === "origin")
            return (
                <PickupProductSelector
                    setPageState={setPageState}
                    pickupStore={pickupStore}
                    generatedOrderPair={[generatedOrder, setGeneratedOrder]}
                />
            )

        return (
            <EditPickup
                pickupStore={pickupStore}
                setPickupStore={setPickupStore}
                setPageState={setPageState}
            />
        )
    }, [generatedOrder, pageState, pickupStore])

    return (
        <div
            className="bg-gray-900 max-h-[calc(100vh - 18px)] overflow-auto p-6 flex flex-col h-full justify-between flex-1 gap-8"
            style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}
        >
            <div className="flex flex-row justify-between cursor-pointer">
                <div 
                    onClick={() => {
                        if(pageState !== "origin") setPageState("origin")
                        else setKioskPanel("cart")
                    }}
                    className="flex flex-row items-center gap-2"
                >
                    <Image src="/icons/arrow-narrow-left.svg" height={20} width={20} alt="" />
                    <p className="text-gray-400">Back</p>
                </div>
                <p className="text-gray-400">Pickup from another store</p>
            </div>

            <div className="flex flex-col flex-1 gap-8 h-full max-h-fit overflow-hidden">
                {pickupPage}
            </div>
        </div>
    )
}

export default PickupMenu;