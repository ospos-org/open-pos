import { debounce } from "lodash";
import { customAlphabet } from "nanoid";
import Image from "next/image";
import { createRef, FC, useEffect, useMemo, useState } from "react";
import { json } from "stream/consumers";
import { v4 } from "uuid";
import { getDate } from "./kiosk";
import { Address, ContactInformation, Customer, DbOrder, DbProductPurchase, Employee, Order, ProductPurchase, StockInfo, Store, Transaction, VariantInformation } from "./stock-types";
import {OPEN_STOCK_URL} from "./helpers";
import moment from "moment";

const RelatedOrders: FC<{ setPadState: Function, activeProductVariant: VariantInformation | null }> = ({ setPadState, activeProductVariant }) => {
    const [ suggestions, setSuggestions ] = useState<Transaction[]>([]);
    const [ loading, setLoading ] = useState(true);

    useEffect(() => {
        setLoading(true);

        const data = fetch(`${OPEN_STOCK_URL}/transaction/product/${activeProductVariant?.barcode}`, {
            method: "GET",
            credentials: "include",
            redirect: "follow"
        })?.then(async e => {
            const data: Transaction[] = await e.json();
            setSuggestions(data);
            setLoading(false);
        });
    }, [activeProductVariant]);

    return (
        <div className="bg-gray-900 max-h-[calc(100vh - 18px)] overflow-auto min-w-[550px] max-w-[550px] p-6 flex flex-col h-full justify-between flex-1 gap-8">
            <div className="flex flex-row justify-between cursor-pointer">
                <div 
                    onClick={() => {
                        setPadState("cart")
                    }}
                    className="flex flex-row items-center gap-2"
                >
                    <Image src="/icons/arrow-narrow-left.svg" height={20} width={20} alt="" />
                    <p className="text-gray-400">Back</p>
                </div>
                <p className="text-gray-400">Related Orders</p>
            </div>

            <div className="flex flex-col flex-1 gap-8 h-full max-h-fit overflow-hidden" onClick={(e) => {
            }}>
                {
                    suggestions.length == 0 ? 
                    <div className="flex flex-col flex-1 items-center justify-center">
                        <p className="text-gray-400">No transactions containing this product variant</p>
                    </div>
                    :
                    <div className="flex flex-col gap-2 text-white">
                        {
                            suggestions?.sort((a,b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime())?.map(b => {
                                return (
                                    <div key={b.id} className="bg-gray-700 px-4 py-4 pt-2 rounded-md gap-2 flex flex-col">
                                        <div className="flex flex-row items-center gap-4">
                                            <p className="font-semibold">{moment(b.order_date).format("DD/MM/YY hh:ss")}</p>
                                            <p className="font-semibold">${b.order_total}</p>
                                        </div>
                                        
                                        {b.products.map(k => {
                                            return (
                                                <div key={k.id} className="bg-gray-900 px-4 py-2 rounded-md">
                                                    <div className="flex flex-row items-center gap-4 ">
                                                        <p className="font-bold">{k.reference}</p>
                                                        <p className="bg-gray-800 text-white text-semibold px-2 rounded-full">{k.order_type}</p>

                                                        <p className="text-gray-400">
                                                            {(() => {
                                                                switch(k.order_type) {
                                                                    case "Direct":
                                                                        return `${k.origin.contact.name} (${k.origin.code})`
                                                                    case "Pickup":
                                                                        return `${k.origin.contact.name} (${k.origin.code})`
                                                                    case "Quote":
                                                                        return `By ${b.salesperson} at ${k.origin.contact.name} (${k.origin.code})`
                                                                    case "Shipment":
                                                                        return `${k.origin.contact.name} (${k.origin.code}) -> ${k.destination?.code !== "000" ? k.destination?.code : k.destination?.contact.address.street} ${k.destination?.code !== "000" ? k.destination?.contact.name : k.destination?.contact.address.street2}`
                                                                    default:
                                                                        return ""
                                                                }
                                                            })()}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        {
                                                            k.products.map(n => {
                                                                return (
                                                                    <div key={n.id} className="flex flex-row items-center gap-2">
                                                                        <p className="text-gray-400">{n.quantity}x</p>
                                                                        <p>{n.product_name}</p>

                                                                        <p>${n.product_cost}</p>
                                                                    </div>
                                                                )
                                                            })
                                                        }
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })
                        }
                    </div>
                }
            </div>
        </div>
    )
}

export default RelatedOrders;