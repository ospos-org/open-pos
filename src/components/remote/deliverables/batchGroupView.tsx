import { useAtomValue, useSetAtom } from "jotai"

import { 
    deliverablesMenuStateAtom, 
    productCategoriesAtom,
    deliverablesAtom,
} from "@atoms/deliverables"
import { useWindowSize } from "@hooks/useWindowSize"

export function BatchGroupView() {
    const deliverables = useAtomValue(deliverablesAtom)
    const productCategories = useAtomValue(productCategoriesAtom)

    const setMenuState = useSetAtom(deliverablesMenuStateAtom)

    const windowSize = useWindowSize()

    return (
        <div className="flex flex-col gap-2 py-4">
            {
                deliverables.length <= 0 ?
                <div className="flex items-center justify-center h-full pt-4">
                    <p className="text-gray-400">No Deliverables</p>
                </div>
                :
                <div className="flex flex-col gap-4" style={{ gridTemplateColumns: "125px 150px 100px 100px" }}>
                    <div className="hidden sm:grid items-center justify-center text-left" style={{ gridTemplateColumns: `1fr 140px ${(windowSize?.width ?? 0) > 640 ? "100px" : ""}` }}>
                        <p className="text-white font-bold">Product Name</p>
                        <p className="text-gray-400 md:text-center">Quantity</p>
                        <p className="text-gray-400 text-end pr-4">Order</p>
                    </div>

                    {
                        productCategories.map(b => {
                            return (
                                <div key={`PRODUCT CATEGORIES: ${b.name}-${b.items.length}`} className="flex flex-col">
                                    <p className="text-gray-400 font-bold text-sm">{b.name.toUpperCase()}</p>

                                    <div className="flex flex-col gap-2">
                                        {
                                            b.items.sort((a, b) => { return a.name.localeCompare(b.name) }).map(k => {
                                                const b = k.instances.filter(n => n.state.fulfillment_status?.pick_status == "Picked")
                                                return (
                                                    <div
                                                        key={`ITEM: ${k.barcode}-${k.sku}`}
                                                        onClick={() => {
                                                            setMenuState({
                                                                instances: k.instances,
                                                                product: k.sku,
                                                                barcode: k.barcode
                                                            })
                                                        }} 
                                                        className="grid hover:bg-gray-700 p-2 px-4 rounded-md cursor-pointer items-center" 
                                                        style={{ gridTemplateColumns: `1fr ${(windowSize?.width ?? 0) > 640 ? "100px 100px" : "50px"}` }}>
                                                        <div className="flex flex-col justify-between">
                                                            <p className="text-white font-bold">{k.name}</p>
                                                            <p className="text-gray-400">{k.variant}</p>
                                                        </div>

                                                        <p className={`${b.length == k.instances.length ? "text-gray-600" : " text-gray-400"} text-end w-full font-bold md:text-center`}>{b.length} / {k.instances.length}</p>
                                                        
                                                        <p className="text-gray-400 hidden md:flex">{k.order_reference}</p>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            }
        </div>
    )
}