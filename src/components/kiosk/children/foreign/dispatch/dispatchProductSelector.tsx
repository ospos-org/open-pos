import Image from "next/image";
import {Store} from "@/generated/stock/Api";
import {useAtom, useAtomValue} from "jotai/index";
import {customerAtom} from "@atoms/customer";
import {Dispatch, useCallback, useEffect, useState} from "react";
import {masterStateAtom} from "@atoms/openpos";
import {GeneratedOrder} from "@components/kiosk/children/foreign/dispatchMenu";
import {SetStateAction} from "jotai";
import {generateOrders, generateProductMap} from "@utils/dispatchAlgorithm";
import {openStockClient} from "~/query/client";
import {ordersAtom} from "@atoms/transaction";

interface DispatchProductSelectorProps {
    generatedOrderPair: [GeneratedOrder[], Dispatch<SetStateAction<GeneratedOrder[]>>],
    setPageState: Dispatch<SetStateAction<"origin" | "rate" | "edit">>
}

export default function DispatchProductSelector({
    generatedOrderPair: [ generatedOrder, setGeneratedOrder ],
    setPageState
}: DispatchProductSelectorProps) {
    const [ selectedItems, setSelectedItems ] = useState<{ store_id: string, item_id: string, selected: boolean }[]>([]);

    const currentStore = useAtomValue(masterStateAtom)
    const customerState = useAtomValue(customerAtom);
    const orderState = useAtomValue(ordersAtom);

    const fetchDistanceData = useCallback(async () => {
        if (customerState?.id)
            return (await openStockClient.helpers.distanceToStores(customerState?.id)).data
    }, [customerState?.id]);

    useEffect(() => {
        fetchDistanceData().then(data => {
            if (data) {
                const ord = generateOrders(
                    generateProductMap(orderState),
                    data,
                    currentStore.kiosk_id ?? ""
                );

                setGeneratedOrder(ord.assignment_sheet);
                setSelectedItems(ord.assignment_sheet.map(e => {
                    return {
                        item_id: e.item?.id ?? "",
                        store_id: e.store ?? "",
                        selected: false
                    }
                }))
            }
        });
    }, [orderState, currentStore, fetchDistanceData, setGeneratedOrder])

    return (
        <div className="flex-col flex gap-8 flex-1 overflow-y-scroll max-h-full">
            <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-row items-center gap-2 text-gray-400">
                    <p>PRODUCTS</p>
                    <hr className="border-gray-400 opacity-25 w-full flex-1"/>
                </div>

                {Boolean(generatedOrder.length >= 1) && (
                    <div className="grid items-center justify-center text-gray-300 gap-4 "
                         style={{gridTemplateColumns: "25px 1fr 75px 80px"}}
                    >
                        <p className="font-semibold flex-1"></p>
                        <p className="font-semibold flex-1">Product</p>
                        <p className="font-semibold content-center self-center flex">Quantity</p>
                        <p className="font-semibold content-center self-center flex text-center justify-self-center">Source</p>
                    </div>
                )}

                {
                    generatedOrder.length < 1 ?
                        <div className="flex items-center justify-center">
                            <p className="text-gray-400 py-4">No products</p>
                        </div>
                        :
                        generatedOrder.map(k => {
                            return (
                                <div key={`PPURCH-SHIP-${k.item?.id}-${k.store}`}
                                     className="text-white grid items-center justify-center gap-4"
                                     style={{gridTemplateColumns: "25px 1fr 75px 80px"}}>
                                    <div onClick={() => {
                                        setGeneratedOrder(
                                            generatedOrder.map(b => (b?.item?.id == k?.item?.id && b.store == k.store) ? {
                                                ...b,
                                                ship: !b.ship
                                            } : b)
                                        )
                                    }} className="cursor-pointer select-none">
                                        {
                                            k.ship ?
                                                <Image src="/icons/check-square.svg" alt="" height={20} width={20}
                                                       style={{filter: "invert(95%) sepia(100%) saturate(20%) hue-rotate(289deg) brightness(104%) contrast(106%)"}}></Image>
                                                :
                                                <Image src="/icons/square.svg" alt="" height={20} width={20}
                                                       style={{filter: "invert(70%) sepia(11%) saturate(294%) hue-rotate(179deg) brightness(92%) contrast(87%)"}}></Image>
                                        }
                                    </div>

                                    <div className="flex-1">
                                        <p className="font-semibold">{k.item?.product.company} {k.item?.product.name}</p>
                                        <p className="text-sm text-gray-400">{k.item?.variant_information.name}</p>
                                    </div>

                                    <div className="self-center content-center items-center justify-center flex">
                                        <p className="font-semibold text-white"></p>{k.quantity}
                                        <p className="font-semibold text-gray-400">/{k.item?.quantity}</p>
                                    </div>
                                    <div
                                        className={`relative inline-block ${selectedItems.find(b => (b.item_id == k.item?.id && b.store_id == k.store))?.selected ? "z-50" : ""}`}>
                                        <p
                                            onClick={() => {
                                                const sel_items = selectedItems.map(b => (b.item_id == k.item?.id && b.store_id == k.store) ? {
                                                    ...b,
                                                    selected: true
                                                } : b);
                                                setSelectedItems(sel_items)
                                            }}
                                            className="self-center cursor-pointer content-center items-center justify-center font-semibold flex">{currentStore.store_lut?.length > 0 ? currentStore.store_lut?.find((b: Store) => k.store == b.id)?.code : "000"}</p>
                                        <div
                                            className={selectedItems.find(b => (b.item_id == k.item?.id && b.store_id == k.store))?.selected ? "absolute flex flex-col items-center justify-center w-full rounded-md overflow-hidden z-50" : "hidden absolute"}>
                                            {
                                                k.alt_stores.map(n => {
                                                    return (
                                                        <div
                                                            onClick={() => {
                                                                const new_order = generatedOrder.map(b => (b.item?.id == k?.item?.id && b.store == k.store) ? {
                                                                    ...b,
                                                                    store: n.store.store_id
                                                                } : b)
                                                                setGeneratedOrder(new_order)

                                                                const sel = selectedItems.map(b => (b.item_id == k.item?.id && b.store_id == k.store) ? {
                                                                    ...b,
                                                                    store_id: n.store.store_id,
                                                                    selected: false
                                                                } : b);
                                                                setSelectedItems(sel)
                                                            }}
                                                            key={`${k.item?.id}is-also-available-@${n.store.store_id}`}
                                                            className={` ${k.store == n.store.store_id ? "bg-white text-gray-700" : "bg-gray-800 hover:bg-gray-700"} cursor-pointer font-semibold w-full flex-1 h-full text-center`}>
                                                            {n.store.store_code}
                                                        </div>
                                                    )
                                                })
                                            }
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                }
            </div>

            <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-row items-center gap-2 text-gray-400">
                    <p>SHIPPING DETAILS</p>
                    <Image
                        onClick={() => setPageState("edit")}
                        src="/icons/edit-03.svg" alt="" width="16" height="16"
                        style={{filter: "invert(65%) sepia(9%) saturate(354%) hue-rotate(179deg) brightness(99%) contrast(92%)"}}/>
                    <hr className="border-gray-400 opacity-25 w-full flex-1"/>
                </div>

                <div className="text-white">
                    <p className="font-semibold">{customerState?.contact.name}</p>
                    <p className="">{customerState?.contact.email.full}</p>
                    <p className="">{customerState?.contact.mobile.number}</p>

                    <br/>

                    <p className="font-semibold">{customerState?.contact.address.street}</p>
                    <p>{customerState?.contact.address.street2}</p>
                    <p className="text-gray-400">
                        {customerState?.contact.address.city
                        } {customerState?.contact.address.po_code}
                    </p>
                    <p className="text-gray-400">{customerState?.contact.address.country}</p>
                </div>
            </div>

            <div
                onClick={() => {
                    if (generatedOrder.length >= 1) setPageState("rate");
                }}
                className={`${generatedOrder.length >= 1 
                    ? "bg-blue-700 cursor-pointer" 
                    : "bg-blue-700 cursor-not-allowed bg-opacity-10 opacity-20"
                } w-full rounded-md p-4 flex items-center justify-center`}
            >
                <p className="text-white font-semibold">Continue</p>
            </div>
        </div>
    )
}