import { useSetAtom } from 'jotai'
import {useCallback, useEffect, useState} from 'react'
import Image from 'next/image';
import moment from 'moment';

import { fromDbDiscount } from '@utils/discountHelpers'
import { customerAtom } from '@atoms/customer'
import { ordersAtom } from '@atoms/transaction'
import {Customer, Store, Transaction} from "@/generated/stock/Api";
import {openStockClient} from "~/query/client";
import {ContextualOrder, ContextualProductPurchase} from "@utils/stockTypes";
import {toast} from "sonner";
import Tooltip from "@components/common/tooltip";

const GRAY_FILTER = "invert(100%) sepia(17%) saturate(7473%) hue-rotate(290deg) brightness(122%) contrast(114%)"

interface TransactionItemProps {
    transaction: Transaction
}

export function SavedTransactionItem({ transaction }: TransactionItemProps) {
    const [ customer, setCustomer ] = useState<Customer | Store | null>();

    const setOrderState = useSetAtom(ordersAtom)
    const setCustomerState = useSetAtom(customerAtom)

    useEffect(() => {
        if(transaction?.customer.customer_type != "Store") {
            if (transaction?.customer.customer_id)
                openStockClient.customer.get(transaction?.customer.customer_id)
                    .then(data => data.ok && setCustomer(data.data))
        }else {
            openStockClient.store.getByCode(transaction?.customer.customer_id)
                .then(data => data.ok && setCustomer(data.data))
        }
    }, [transaction]);

    const openTransaction = useCallback(async () => {
        // Order's product purchases contain the following properties which we must fetch for.
        // product: Product,
        // variant_information: VariantInformation,
        // active_promotions: Promotion[]

        const updated_orders: ContextualOrder[] = await Promise.all(transaction.products.map(async k => {
            const new_products = k.products.map(async b => {
                const response = await openStockClient.product.getWithAssociatedPromotions(parseInt(b.product_sku))
                if (!response.ok) return

                const variant = response.data.product.variants.find(k => k.barcode == b.product_code);

                if (variant)
                    return {
                        ...b,
                        discount: [ {
                            value: fromDbDiscount(b.discount),
                            source: fromDbDiscount(b.discount) == fromDbDiscount(variant?.loyalty_discount ?? { Absolute: 0 }) ? "loyalty" : "user",
                            applicable_quantity: -1
                        } ],
                        product: response.data.product,
                        variant_information: variant,
                        active_promotions: response.data.promotions
                    } as ContextualProductPurchase;
            }) as Promise<ContextualProductPurchase>[];

            const pdts = await Promise.all(new_products);

            return {
                ...k,
                products: pdts,
                discount: fromDbDiscount(k.discount)
            }
        }));

        setOrderState(updated_orders);
        if (customer && "balance" in customer) setCustomerState(customer);
    }, [customer, setCustomerState, setOrderState, transaction.products])

    const deleteTransaction = useCallback(() => {
        toast.promise(openStockClient.transaction.delete(transaction.id), {
            loading: `Deleting saved transaction`,
            error: (error) => `Failed to delete, ${error}`,
            success: `Deleted transaction. `
        })
    }, [transaction.id])

    if(!transaction) return (<></>);
    else return (
        <div className="flex flex-col gap-[4px] items-center p-4 text-white border-r-2 border-gray-600">
            <div className="flex-1 w-full px-2">
                <div className="flex flex-row gap-2 justify-between w-full flex-1 items-center">
                    <h3 className="text-gray-400 flex-1 w-full flex-nowrap whitespace-nowrap">{customer?.name}</h3>
                    <hr className="border-gray-600 w-full border-2 rounded-full" />
                    <div className="flex flex-row items-center gap-[0.2rem] flex-1 w-full">
                        <p className="text-sm whitespace-nowrap">{transaction.products.reduce((p, c) => p + c.products.length, 0)} item{transaction.products.reduce((p, c) => p + c.products.length, 0) > 1 ? "s" : ""} </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-row items-center w-full gap-2 rounded-full px-1">
                <div className="flex flex-row items-center gap-2 bg-gray-600 px-[4px] pr-[8px] py-[2px] rounded-full h-[26px]">
                    <Image src="/icons/clock.svg" alt="" height={18} width={18} style={{ filter: "invert(100%) sepia(17%) saturate(7473%) hue-rotate(290deg) brightness(122%) contrast(114%)" }} />
                    <p className="text-sm">expires {moment(new Date(new Date(transaction.order_date).getTime() + 3_600_000).getTime()).fromNow()}</p>
                </div>
                
                <div className="flex flex-row items-center gap-2 px-[4px] pr-[8px] py-[4px] rounded-full bg-gray-600">
                    <Tooltip name="Delete Transaction" side="top">
                        <Image
                            className="cursor-pointer"
                            onClick={deleteTransaction}
                            src="/icons/x-close-01.svg" alt=""
                            height={18} width={18}
                            style={{ filter: GRAY_FILTER }}
                        />
                    </Tooltip>

                    <Tooltip name="Refresh Transaction" side="top">
                        <Image
                            className="cursor-pointer"
                            src="/icons/refresh-ccw-05.svg" alt=""
                            height={18} width={18}
                            style={{ filter: GRAY_FILTER }}
                        />
                    </Tooltip>

                    <Tooltip name="Open Transaction" side="top">
                        <Image
                            className="cursor-pointer"
                            onClick={openTransaction}
                            src="/icons/expand-01.svg" alt=""
                            height={16} width={16}
                            style={{ filter: GRAY_FILTER }}
                        />
                    </Tooltip>
                </div>
            </div>
        </div>
    )
}