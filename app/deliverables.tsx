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

    const [ viewingMode, setViewingMode ] = useState(0);

    return (
        <>
            <div className="flex flex-col gap-4 md:p-12 p-6 w-full">
                <div className="flex w-full max-w-full flex-row items-center gap-2 bg-gray-400 bg-opacity-10 p-2 rounded-md">
                    <div className={`text-white ${viewingMode == 0 ? "bg-gray-500" : " bg-transparent"} p-2 rounded-md px-4 w-full flex flex-1 text-center justify-center cursor-pointer`} onClick={() => setViewingMode(0)}>Order</div>
                    <div className={`text-white ${viewingMode == 1 ? "bg-gray-500" : " bg-transparent"} p-2 rounded-md px-4 w-full flex flex-1 text-center justify-center cursor-pointer`} onClick={() => setViewingMode(1)}>Batch</div>
                </div>

                {
                    (() => {
                        switch(viewingMode) {
                            case 0:
                                return (
                                    <div>
                                        {
                                            deliverables.length <= 0 ?
                                            <p className="text-gray-400">No Deliverables</p>
                                            :
                                            <div className="grid grid-flow-row" style={{ gridTemplateColumns: "125px 100px 100px" }}>
                                                {
                                                    deliverables.map(b => {
                                                        let total_products = 0
                                                        let completed = 0;

                                                        b.products.map(v => {
                                                            total_products += v.quantity
                                                            completed += 1
                                                        })

                                                        return (
                                                            <>
                                                                <p className="text-white font-bold">{b.reference}</p>
                                                                
                                                                {/* <p>{b.products.map(k => k.product_name).join(', ')}</p>  */}

                    
                                                                <p className="text-white text-opacity-50">{moment(b.status.timestamp).format('D/MM/yy')}</p>
                                                                <p className="text-white text-opacity-75">{moment(b.status.timestamp).fromNow()}</p>
                                                            </>
                                                        )
                                                    })
                                                }
                                            </div>
                                        }
                                    </div>
                                )
                            case 1:
                                return (
                                    <div></div>
                                )
                        }
                    })()
                }
            </div>

            <div>
                {/* Order Information */}
            </div>
        </>
    )
}