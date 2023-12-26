import {useEffect, useMemo} from "react";
import {useAtom, useAtomValue} from "jotai";
import {capitalize} from "lodash";

import {openStockClient} from "~/query/client";

import TransactionMultipleItem from "@components/kiosk/children/order/transaction/transactionMultipleItem";
import {inspectingTransactionAtom, transactionViewState} from "@atoms/transaction";

export default function TransactionTitle() {
    const [
        activeTransaction,
        setActiveTransaction
    ] = useAtom(transactionViewState.activeTransaction)

    const transaction = useAtomValue(inspectingTransactionAtom)

    const [ customer, setCustomer ] = useAtom(transactionViewState.attachedCustomer);

    useEffect(() => {
        setActiveTransaction(transaction?.item?.products.find(k => k.id == transaction?.identifier));

        if(transaction?.item.customer.customer_type != "Store") {
            if (transaction?.item.customer.customer_id)
                openStockClient.customer.get(transaction?.item.customer.customer_id)
                    .then(data => data.ok && setCustomer(data.data))
        }else {
            openStockClient.store.getByCode(transaction?.item.customer.customer_id)
                .then(data => data.ok && setCustomer(data.data))
        }
    }, [setActiveTransaction, setCustomer, transaction]);

    const multipleItems = useMemo(() =>
            (transaction?.item?.products?.length ?? 0) > 1,
        [transaction]
    )

    if(!transaction) return (<></>)

    return (
        <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center justify-between w-full">
                <div className="flex flex-col">
                    <p className="text-gray-300 font-semibold">{customer?.name}</p>
                    <p className="text-lg font-semibold text-white">
                        {activeTransaction?.reference} - {capitalize(activeTransaction?.order_type)}
                    </p>
                </div>

                {Boolean(transaction.item.transaction_type == "Quote") &&
                    <p className={
                        "flex flex-row items-center gap-[0.75rem] bg-gray-800 " +
                        "p-2 px-4 rounded-md cursor-pointer text-white"}
                    >
                        Quote
                    </p>
                }
            </div>

            {Boolean(multipleItems) && <TransactionMultipleItem />}
        </div>
    )
}