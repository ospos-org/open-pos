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
        <div className="text-white">
            <p className="text-2xl font-bold">{activeOrder.reference}</p>
            <p>{customerInfo?.name}</p>
        </div>
    )
}