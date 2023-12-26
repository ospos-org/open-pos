import {useAtom, useAtomValue, useSetAtom} from "jotai"
import {useEffect, useMemo, useRef, useState} from "react"
import Image from "next/image"

import {defaultKioskAtom, generateTransactionAtom, kioskPanelLogAtom, perfAtom, transactionTypeAtom} from "@atoms/kiosk"
import {probingPricePayableAtom} from "@atoms/payment"
import {ordersAtom} from "@atoms/transaction"
import useKeyPress from "@hooks/useKeyPress"
import {toast} from "sonner"
import {TransactionType} from "@/generated/stock/Api";
import {openStockClient} from "~/query/client";
import {PayPrice} from "@components/kiosk/children/payment/payPrice";
import PayOptions from "@components/kiosk/children/payment/payOptions";
import NegativeStockWarning from "@components/kiosk/children/payment/negativeStockWarning";

export function PaymentMethod() {
    const generateTransaction = useAtomValue(generateTransactionAtom)
    const orderState = useAtomValue(ordersAtom)
    const perfState = useAtomValue(perfAtom)

    const setKioskPanel = useSetAtom(kioskPanelLogAtom)
    const setTransactionType = useSetAtom(transactionTypeAtom)

    const [ hasNegativeStock, setHasNegativeStock ] = useState(false);

    const f1Pressed = useKeyPress(['F1'])
    const f1firstUpdate = useRef(0);

    useEffect(() => {
        if (f1firstUpdate.current < 2) {
            f1firstUpdate.current += 1;
            return;
        }

        setKioskPanel("await-debit");
    }, [f1Pressed, setKioskPanel]);

    const f2Pressed = useKeyPress(['F2'])
    const f2firstUpdate = useRef(0);

    useEffect(() => {
        if (f2firstUpdate.current < 2) {
            f2firstUpdate.current += 1;
            return;
        }

        setKioskPanel("await-cash");
    }, [f2Pressed, setKioskPanel]);

    const f6Pressed = useKeyPress(['F6']);
    const f6firstUpdate = useRef(0);

    useEffect(() => {
        if (f6firstUpdate.current < 2) {
            f6firstUpdate.current += 1;
            return;
        }

        setTransactionType(TransactionType.Quote)

        openStockClient.transaction.create(generateTransaction)
            .then(data => {
                if (data.ok) setKioskPanel("completed")
                else toast.message("Failed to save transaction", {
                    description: `Server gave ${data.error}`
                })
            })
    }, [f6Pressed, generateTransaction, setKioskPanel, setTransactionType]);

    useEffect(() => {
        // When the order state updates,
        // check for if any negative stocks have been added.

        const hasNegativeStocks = orderState.some(b =>
            b.products.some(p =>
                p.product.variants.some(n => {
                    if (p.product_code === n.barcode) {
                        const storeId = b?.origin?.store_id ?? "";
                        const stockLevel = n.stock.reduce((prev, curr) =>
                            prev + (curr.store.store_id === storeId ? curr.quantity.quantity_sellable : 0),
                            0
                        );

                        return stockLevel <= 0;
                    }
                    return false;
                })
            )
        );

        setHasNegativeStock(hasNegativeStocks);
    }, [orderState])

    const showNegativeStockWarning = useMemo(() =>
        hasNegativeStock && perfState.type === "creative",
        [hasNegativeStock, perfState.type]
    )

    return (
        <div
            className="bg-gray-900 p-6 flex flex-col h-full overflow-y-scroll"
            style={{
                maxWidth: "min(550px, 100vw)",
                minWidth: "min(100vw, 550px)"
            }}
        >
            <div className={`flex flex-col h-full ${showNegativeStockWarning ? "gap-14" : "gap-20"}`}>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-row justify-between cursor-pointer">
                        <div 
                            onClick={() => setKioskPanel("cart")}
                            className="flex flex-row items-center gap-2"
                        >
                            <Image src="/icons/arrow-narrow-left.svg" height={20} width={20} alt="" />
                            <p className="text-gray-400">Back</p>
                        </div>

                        <p className="text-gray-400">Select Preferred Payment Method</p>
                    </div>

                    {Boolean(showNegativeStockWarning) && <NegativeStockWarning />}
                </div>
            
                <PayPrice />

                <PayOptions />

                <div className="self-center flex flex-col items-center" />
            </div>
        </div>
    )
}

export default PaymentMethod;