import { useEffect, useState } from "react";
import { Customer, FulfillmentStatus, MasterState, Order, PickStatus, Product, ProductCategory, ProductInstance, Transaction } from "./stock-types";
import { OPEN_STOCK_URL, useWindowSize } from "./helpers";
import moment from "moment";
import Image from "next/image";

export default function OrderView({ activeOrder }: { activeOrder: Order }) {
    const [ orderInfo, setOrderInfo ] = useState<Transaction | null>(null);
    const [ customerInfo, setCustomerInfo ] = useState<Customer | null>(null);

    useEffect(() => {
        fetch(`${OPEN_STOCK_URL}/transaction/ref/${activeOrder.reference}`, {
            method: "GET",
            credentials: "include",
            redirect: "follow"
        }).then(async d => {
            if(d.ok) {
                const data: Transaction[] = await d.json();
                setOrderInfo(data[0]);

                console.log("CUST", data);

                fetch(`${OPEN_STOCK_URL}/customer/${data[0].customer.customer_id}`, {
                    method: "GET",
                    credentials: "include",
                    redirect: "follow"
                }).then(async d => {
                    if(d.ok) {
                        const data: Customer = await d.json();
                        setCustomerInfo(data);
                    }
                })
            }
        })
    }, [activeOrder])

    return (
        <div className="flex flex-col gap-4 text-white">
            <div className="flex flex-row items-center justify-between">
                <div className="flex flex-col">
                    <p className="text-2xl font-bold">{activeOrder.reference}</p>
                    <p>{customerInfo?.name}</p>
                </div>

                <div className="flex flex-row items-center">
                    <div 
                        onClick={() => {
                        }}
                        className="bg-red-800 rounded-md px-2 py-[0.125rem] flex flex-row items-center gap-2 cursor-pointer">
                        <p>Fail Order</p>
                        <Image 
                            className=""
                            height={15} width={15} src="/icons/x.svg" alt="" style={{ filter: "brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(36deg) brightness(106%) contrast(102%)" }}></Image>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <p className="text-sm opacity-20">PRODUCTS</p>

                {activeOrder.products.map((product) => (
                    <div className="flex flex-row items-center gap-4" key={`PRODUCT_LIST_ITEM_${product.id}`}>
                        <p className="opacity-40">{product.quantity}</p>


                        <div className="flex flex-col">
                            <p className="font-bold">{product.product_variant_name}</p>
                            <p className="text-sm opacity-40">{product.product_name}</p>
                        </div>  
                    </div>
                ))}
            </div>
        </div>
    )
}