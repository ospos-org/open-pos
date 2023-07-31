import { useAtomValue, useSetAtom } from "jotai"
import { useEffect } from "react"

import { masterStateAtom } from "@atoms/openpos"
import { OPEN_STOCK_URL } from "@utils/environment"
import { Order, Product } from "@utils/stockTypes"
import { 
    deliverablesProductInformationAtom, 
    deliverablesActiveOrderAtom, 
    deliverablesStateChangeAtom, 
    deliverablesMenuStateAtom, 
    productCategoriesAtom,
    deliverablesAtom
} from "@atoms/deliverables"

import { SwitchViews } from "./deliverables/switchViews"
import { OrderSummary, parseDeliverables } from "./deliverables/orderSummary"
import { ExpandedOrder } from "./deliverables/expandedOrder"
import queryOs from "@/src/utils/query-os"

export default function Deliverables() {
    const menuState = useAtomValue(deliverablesMenuStateAtom);
    const masterState = useAtomValue(masterStateAtom)
    const stateChange = useAtomValue(deliverablesStateChangeAtom);
    const activeOrder = useAtomValue(deliverablesActiveOrderAtom)

    const setDeliverables = useSetAtom(deliverablesAtom)
    const setMenuInformation = useSetAtom(deliverablesProductInformationAtom);
    const setProductCategories = useSetAtom(productCategoriesAtom);

    useEffect(() => {
        if(menuState != null)
            queryOs(`product/${menuState?.product}`, {
                method: "GET",
                credentials: "include",
                redirect: "follow"
            }).then(async k => {
                const data: Product = await k.json();
                setMenuInformation(data);
            })
    }, [menuState, setMenuInformation])


    useEffect(() => {
        setDeliverables(
            deliverables => 
                [ ...deliverables.map(
                    (order) => 
                        order.reference === activeOrder?.reference ? activeOrder : order
                    ) 
                ]
        )
    }, [activeOrder, setDeliverables])

    useEffect(() => {
        queryOs(`transaction/deliverables/${masterState.store_id}`, {
            method: "GET",
            credentials: "include",
            redirect: "follow"
        })
        .then(async b => {
            const data: Order[] = await b.json();
            setDeliverables(data);
            setProductCategories(parseDeliverables(data))
        })
    }, [masterState.store_id, setDeliverables, setProductCategories])

    return (
        <>
            <SwitchViews /> 

            { (stateChange != null || menuState != null) && <OrderSummary /> }

            <ExpandedOrder />
        </>
    )
}