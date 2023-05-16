import { useEffect, useState } from "react";
import { MasterState, Order } from "./stock-types";
import { OPEN_STOCK_URL } from "./helpers";
import moment from "moment";

export default function Deliverables({ master_state }: { master_state: MasterState }) {
    const [ deliverables, setDeliverables ] = useState<Order[]>([]);
    const [ isLoading, setIsLoading ] = useState(true);

    useEffect(() => {
        setIsLoading(true);

        fetch(`${OPEN_STOCK_URL}/transaction/deliverables/${master_state.store_id}`, {
            method: "GET",
            credentials: "include",
            redirect: "follow"
        })
        .then(async b => {
            const data = await b.json();
            setDeliverables(data);
            setIsLoading(false);
        })
    }, [])

    return (
        <>
            <div className="p-12">
                <h2 className="text-white font-semibold text-xl">Deliverables</h2>

                <div>
                    {
                        deliverables.length <= 0 ?
                        <p className="text-gray-400">No Deliverables</p>
                        :
                        <div className="flex flex-col">
                            {
                                deliverables.map(b => {
                                    return (
                                        <div className="border-gray-400 border-[2px] rounded-md">
                                            <p className="text-white font-bold">{b.reference}</p>
                                            <p>{b.products.map(k => k.product_name).join(', ')}</p> {/* Cut this off with elipsis */}

                                            <p>{moment(b.status.timestamp).format('D/MM/yy')}</p>
                                            <p>{moment(b.status.timestamp).fromNow()}</p>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    }
                </div>
            </div>

            <div>
                {/* Order Information */}
            </div>
        </>
    )
}