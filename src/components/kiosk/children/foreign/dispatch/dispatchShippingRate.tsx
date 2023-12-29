import {ContextualOrder, ContextualProductPurchase} from "@utils/stockTypes";
import {Address, Stock, Store} from "@/generated/stock/Api";
import {openStockClient} from "~/query/client";
import {v4} from "uuid";
import {getDate} from "@utils/utils";
import {customAlphabet} from "nanoid";
import {useAtom, useAtomValue, useSetAtom} from "jotai/index";
import {ordersAtom} from "@atoms/transaction";
import {customerAtom} from "@atoms/customer";
import {GeneratedOrder} from "@components/kiosk/children/foreign/dispatchMenu";
import {masterStateAtom} from "@atoms/openpos";
import {kioskPanelLogAtom} from "@atoms/kiosk";
import {useCallback} from "react";

interface DispatchShippingRateProps {
    generatedOrder: GeneratedOrder[]
}

export function DispatchShippingRate({ generatedOrder }: DispatchShippingRateProps) {
    const [ orderState, setOrderState ] = useAtom(ordersAtom);
    const [ customerState, setCustomerState ] = useAtom(customerAtom);

    const currentStore = useAtomValue(masterStateAtom)
    const setKioskPanel = useSetAtom(kioskPanelLogAtom)

    // TODO: Re-write this, with better naming and add comments
    const generateShipmentArrangement = useCallback(async () => {
        let inverse_order: {
            store: string,
            store_code: string,
            items: ContextualProductPurchase[],
            type: "direct" | "shipment"
        }[] = [];

        generatedOrder.map(k => {
            const found = inverse_order.find(e =>
                e.store == k.store && e.type == (k.ship ? "shipment" : "direct")
            );

            if(found && k.item) {
                inverse_order = inverse_order.map(e => (e.store == k.store && e.type == (k.ship ? "pickup" : "direct"))
                    ? { ...e, items: [ ...e.items, { ...k.item!, quantity: k.quantity } ] }
                    : e
                )
            } else if(k.item) {
                inverse_order.push({
                    store: k.store,
                    store_code: currentStore.store_lut?.length > 0
                        ? currentStore.store_lut?.find((b: Store) => k.store == b.id)?.code ?? k.store
                        : k.store,
                    items: [ { ...k.item, quantity: k.quantity } ],
                    type: k.ship ? "shipment" : "direct"
                })
            }
        })

        Promise.all(inverse_order.map(async k => {
            const data = await openStockClient.store.get(k.store)

            // TODO: Fix this mess.
            if (data.ok)
                return {
                    id: v4(),
                    destination: {
                        store_code: "000",
                        store_id: customerState?.id,
                        contact: customerState?.contact!
                    },
                    origin: {
                        store_code: k.store_code,
                        store_id: k.store,
                        contact: data.data.contact
                    },
                    products: k.items,
                    status: {
                        status: {
                            type: "queued",
                            value: getDate()
                        },
                        assigned_products: k.items.map(b => b.id),
                        timestamp: getDate()
                    },
                    previous_failed_fulfillment_attempts: [],
                    status_history: [],
                    order_history: [],
                    order_notes: orderState.map(b => b.order_notes).flat(),
                    reference: `DP${customAlphabet(`1234567890abcdef`, 10)(8)}`,
                    creation_date: getDate(),
                    discount: "a|0",
                    order_type: k.type
                };
        })).then((k) => {
            const job = orderState.filter(k => k.order_type != "direct")
            k.map(b => job.push(b as ContextualOrder));

            setOrderState(job);
            setKioskPanel("cart")
        });
    }, [currentStore.store_lut, customerState, generatedOrder, orderState, setKioskPanel, setOrderState])

    return (
        <>
            <p className="cursor-pointer font-semibold text-white">Shipping Rate</p>

            <div className="flex-col flex gap-2 flex-1 overflow-y-scroll max-h-full pr-2">
                <div className=" flex flex-row items-center justify-between bg-gray-200 text-gray-900 px-4 py-2 rounded-sm cursor-pointer">
                    <div className="flex flex-col items-start flex-start">
                        <p className="font-semibold">Priority Mail</p>
                        <p className="text-sm text-gray-400">1 day shipping</p>
                    </div>

                    <p className="font-semibold">${15.00}</p>
                </div>

                <div className="text-white flex flex-row items-center justify-between bg-gray-800 px-4 py-2 rounded-sm cursor-pointer">
                    <div className="flex flex-col items-start flex-start">
                        <p className="font-semibold">Express Shipping</p>
                        <p className="text-sm text-gray-400">1-3 day shipping</p>
                    </div>

                    <p className="font-semibold">${7.00}</p>
                </div>

                <div className="text-white flex flex-row items-center justify-between bg-gray-800 px-4 py-2 rounded-sm cursor-pointer">
                    <div className="flex flex-col items-start flex-start">
                        <p className="font-semibold">Standard Shipping</p>
                        <p className="text-sm text-gray-400">3+ day shipping</p>
                    </div>

                    <p className="font-semibold">${3.00}</p>
                </div>
            </div>

            <div
                onClick={generateShipmentArrangement}
                className="bg-blue-700 cursor-pointer w-full rounded-md p-4 flex items-center justify-center"
            >
                <p className="text-white font-semibold">Complete</p>
            </div>
        </>
    )
}