import Image from "next/image";
import {useAtom, useAtomValue} from "jotai/index";

import {inspectingTransactionAtom, transactionMenuSelectorOpenAtom, transactionViewState} from "@atoms/transaction";

export default function TransactionMultipleItem() {
    const [
        activeTransaction,
        setActiveTransaction
    ] = useAtom(transactionViewState.activeTransaction)
    const transaction = useAtomValue(inspectingTransactionAtom)

    const [ selectorOpen, setSelectorOpen ] = useAtom(transactionMenuSelectorOpenAtom)

    return (
        <div className="relative inline-block w-fit float-right flex-grow flex-shrink-0">
            <p className="text-gray-400 text-sm">Transaction contains multiple orders</p>

            <div
                className={`
                    bg-gray-800 w-full select-none text-white flex flex-row 
                    justify-between gap-4 cursor-pointer px-4 py-2 
                    ${selectorOpen ? "rounded-t-md rounded-b-none" : "rounded-md"}
                `}
                onClick={() => setSelectorOpen(!selectorOpen)}
            >
                <p className="font-semibold">
                    {activeTransaction?.order_type.toUpperCase()} - {activeTransaction?.origin.store_code}
                </p>

                <Image
                    src={selectorOpen ? "/icons/chevron-up.svg" : "/icons/chevron-down.svg"}
                    style={{
                        filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)"
                    }}
                    alt="" height={18} width={18}
                />
            </div>

            <div className={selectorOpen
                ? "absolute flex flex-col items-center w-full text-white justify-center " +
                "bg-gray-700 overflow-hidden z-50 rounded-t-none rounded-b-md"
                : "hidden absolute"}
            >
                {transaction?.item.products?.map(k => (
                    <div
                        key={k.id}
                        className="hover:bg-gray-600 cursor-pointer px-4 py-2 w-full text-center"
                        onClick={() => {
                            setActiveTransaction(k)
                            setSelectorOpen(false)
                        }}
                    >
                        {k.order_type.toUpperCase()} - {k.origin.store_code}
                    </div>
                ))}
            </div>
        </div>
    )
}