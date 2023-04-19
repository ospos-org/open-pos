import { useEffect, useState } from "react";
import { MasterState, Order } from "./stock-types";
import { OPEN_STOCK_URL } from "./helpers";

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
                        <div>
                            {
                                JSON.stringify(deliverables)
                                // deliverables.map(b => {
                                //     return (
                                //         <div>
                                //             {b.id}
                                //         </div>
                                //     )
                                // })
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