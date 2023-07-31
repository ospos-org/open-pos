import { useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import Image from 'next/image';
import moment from 'moment';

import { Customer, Order, Product, ProductPurchase, Promotion, Transaction } from '@utils/stockTypes'
import { fromDbDiscount } from '@utils/discountHelpers'
import { OPEN_STOCK_URL } from "@utils/environment"
import { customerAtom } from '@atoms/customer'
import { ordersAtom } from '@atoms/transaction'
import queryOs from '@/src/utils/query-os';

interface TransactionItemProps {
    transaction: Transaction
}

export function SavedTransactionItem({ transaction }: TransactionItemProps) {
    const [ customer, setCustomer ] = useState<Customer | null>();

    const setOrderState = useSetAtom(ordersAtom)
    const setCustomerState = useSetAtom(customerAtom)

    useEffect(() => {
        if(transaction.customer.customer_type != "Store") {
            queryOs(`customer/${transaction.customer.customer_id}`, {
                method: "GET",
                credentials: "include",
                redirect: "follow"
            }).then(async k => {
                const n = await k.json();
                setCustomer(n);
            })
        }else {
            queryOs(`store/code/${transaction.customer.customer_id}`, {
                method: "GET",
                credentials: "include",
                redirect: "follow"
            }).then(async k => {
                const n = await k.json();
                setCustomer(n);
            })
        }
    }, [transaction]);

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
                    <Image
                        className="cursor-pointer" 
                        onClick={() => {
                            queryOs(`transaction/delete/${transaction.id}`, {
                                method: "POST",
                                credentials: "include",
                                redirect: "follow",
                            })
                        }}
                        src="/icons/x-close-01.svg" alt="" height={18} width={18} style={{ filter: "invert(100%) sepia(17%) saturate(7473%) hue-rotate(290deg) brightness(122%) contrast(114%)" }} />
                    <Image
                        className="cursor-pointer"
                        src="/icons/refresh-ccw-05.svg" alt="" height={18} width={18} style={{ filter: "invert(100%) sepia(17%) saturate(7473%) hue-rotate(290deg) brightness(122%) contrast(114%)" }} />
                    <Image
                        className="cursor-pointer"
                        onClick={async () => {
                            // Order's product purchases contain the following properties which we must fetch for.
                            // product: Product,
                            // variant_information: VariantInformation,
                            // active_promotions: Promotion[]
                            const updated_orders: Order[] = await Promise.all(transaction.products.map(async k => {
                                const new_products = k.products.map(async b => {
                                    const data: { product: Product, promotions: Promotion[] } = await (await queryOs(`product/with_promotions/${b.product_sku}`, {
                                        method: "GET",
                                        credentials: "include",
                                        redirect: "follow"
                                    })).json();
                                    
                                    const variant = data.product.variants.find(k => k.barcode == b.product_code);

                                    return {
                                        ...b,
                                        discount: [ { value: fromDbDiscount(b.discount), source: fromDbDiscount(b.discount) == fromDbDiscount(variant?.loyalty_discount ?? { Absolute: 0 }) ? "loyalty" : "user" } ],
                                        product: data.product,
                                        variant_information: variant,
                                        active_promotions: data.promotions
                                    } as ProductPurchase;
                                }) as Promise<ProductPurchase>[];

                                const pdts = await Promise.all(new_products);

                                return {
                                    ...k,
                                    products: pdts,
                                    discount: fromDbDiscount(k.discount)
                                }
                            }));

                            setOrderState(updated_orders);

                            if (customer) {
                                setCustomerState(customer);
                            }
                        }}
                        src="/icons/expand-01.svg" alt="" height={16} width={16} style={{ filter: "invert(100%) sepia(17%) saturate(7473%) hue-rotate(290deg) brightness(122%) contrast(114%)" }} />
                </div>
            </div>
        </div>
    )
}