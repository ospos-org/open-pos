import {TransactionType} from "@/generated/stock/Api";
import {openStockClient} from "~/query/client";
import {toast} from "sonner";
import {useAtomValue, useSetAtom} from "jotai/index";
import {generateTransactionAtom, kioskPanelLogAtom, transactionTypeAtom} from "@atoms/kiosk";
import {useCallback} from "react";

export default function PayOptions() {
    const setKioskPanel = useSetAtom(kioskPanelLogAtom)
    const setTransactionType = useSetAtom(transactionTypeAtom)
    const generateTransaction = useAtomValue(generateTransactionAtom)

    const saveQuote = useCallback(() => {
        setTransactionType(TransactionType.Quote)

        openStockClient.transaction.create(generateTransaction)
            .then(data => {
                if (data.ok) setKioskPanel("completed")
                else toast.message("Failed to save transaction", {description: `Server gave ${data.error}`})
            })
    }, [generateTransaction, setKioskPanel, setTransactionType])

    return (
        <div className="flex flex-col items-center gap-16 flex-1 h-full justify-center pb-16">
            <div
                className="flex flex-row items-end gap-2 cursor-pointer"
                onClick={() => {
                    setKioskPanel("await-debit");
                }}>
                <p className="text-white font-semibold text-2xl">Eftpos</p>
                <p className="text-sm text-gray-400">F1</p>
            </div>
            <div
                className="flex flex-row items-end gap-2 cursor-pointer"
                onClick={() => {
                    setKioskPanel("await-cash");
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
            <div
                onClick={saveQuote}
                className="flex flex-row items-end gap-2 cursor-pointer"
            >
                <p className="text-white font-semibold text-2xl">Save as Quote</p>
                <p className="text-sm text-gray-400">F6</p>
            </div>
        </div>
    )
}