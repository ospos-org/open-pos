import Image from "next/image";
import { join } from "path";
import { FC, useState } from "react";
import { v4 } from "uuid";
import { applyDiscount, findMaxDiscount } from "./discount_helpers";
import { Customer, Order, ProductPurchase, VariantInformation } from "./stock-types";

const DispatchMenu: FC<{ orderJob: [ Order[], Function ], customerJob: [ Customer | null, Function ] }> = ({ orderJob, customerJob }) => {
    const [ orderState, setOrderState ] = orderJob;
    const [ customerState, setCustomerState ] = customerJob;
    
    const [ selectedItems, setSelectedItems ] = useState<string[]>([]);

    const [ pageState, setPageState ] = useState();
    const [ generatedOrder, setGeneratedOrder ] = useState(generateOrders(generateProductMap(orderState)));

    return (
        <div className="flex flex-col flex-1 gap-8">
            <div className="flex flex-row items-center gap-4 self-center text-white w-full">
                <p className="bg-gray-800 py-2 px-4 rounded-md">Set Origin</p>
                <hr className="flex-1 border-gray-600 h-[3px] border-[2px] bg-gray-600 rounded-md" />
                <p className="text-gray-600">Set Destination</p>
                <hr className="flex-1 border-gray-600 h-[3px] border-[2px] bg-gray-600 rounded-md" />
                <p className="text-gray-600">Set Shipping Rate</p>
            </div>

            <div className="flex-col flex gap-4 flex-1">
                {
                    JSON.stringify(generatedOrder)
                }
            </div>
            
            {/* <div className="flex flex-col">
                <div className="flex flex-row items-center gap-2">
                    <p className="text-gray-400">ADDRESS</p>
                    <Image 
                        onClick={() => {

                        }}
                        height={18} width={18} quality={100} alt="Edit Address" className="rounded-sm cursor-pointer" src="/icons/edit-03.svg" style={{ filter: "invert(46%) sepia(7%) saturate(675%) hue-rotate(182deg) brightness(94%) contrast(93%)" }}></Image>
                </div>

                <div className="text-white">
                    <p>{customerState?.contact.address.street}</p>
                    <p>{customerState?.contact.address.street2}</p>
                    <p>{customerState?.contact.address.city} {customerState?.contact.address.po_code}</p>
                    <p>{customerState?.contact.address.country}</p>
                </div>
            </div> */}
        </div>
    )
}

function generateProductMap(orders: Order[]) {
    let pdt_map: ProductPurchase[] = [];

    for(let i = 0; i < orders.length; i++) {
        orders[i].products.map(e => {
            pdt_map.push(e)
        })
    }

    return pdt_map;
}

function generateOrders(product_map: ProductPurchase[]) {
    /// 1. Determine the best location for each product.
    /// 2. Ensure as many products are in the same location as possible.
    /// 3. Ensure it is close to the destination.

    /// Create a reverse map of all products to store relations...
    /// Generate a valid list of store options
    /// => Sort by closeness
    /// => Give to user

    const map = new Map<string, {
        items: { item_id: string, quantity: number }[],
        weighting: number
    }>();

    product_map.map(e => {
        e.variant_information.stock.map(k => {
            const has = k.quantity.quantity_sellable;
            const store = k.store.code;
            let curr = map.get(store);

            if(curr) {
                curr.items.push({
                    item_id: e.id,
                    quantity: has
                })
                
                map.set(store, curr);
            }else {
                map.set(store, {
                    items: [
                        {
                            item_id: e.id,
                            quantity: has
                        }
                    ],
                    weighting: 0
                })
            }
        })
    })

    console.log(map);

    // map<map<double (weighting), vector(items)>, string (strore)>
    // let m: [number, Map<string, ProductPurchase[]>][] = [];

    let kvp: [number, string, { item_id: string, quantity: number }[]][] = [];

    const total_items = product_map.reduce((p, c) => p += c.quantity, 0);

    map.forEach((val, key) => {
        val.weighting = val.items.reduce((p, e) => {
            const n = e.quantity - (product_map.find(k => k.id == e.item_id)?.quantity ?? 0);
            return p += n;
        }, 0) / total_items;

        kvp.push([val.weighting, key, val.items]);
    });

    const weighted_vector = kvp.sort((a, b) => b[0] - a[0]);

    console.log(weighted_vector);

    const product_assignment: [string, string][] = [];

    weighted_vector.map(e => {
        e[2].map(k => {
            const req = product_map.find(n => n.id == k.item_id)?.quantity ?? 0;

            if(k.quantity >= req && !(product_assignment.find(b => b[0] == k.item_id))) {
                product_assignment.push([ k.item_id, e[1] ])
            }
        })
    });

    return product_assignment.map(e => {
        return {
            item: product_map.find(k => k.id == e[0]),
            store: e[1]
        }
    });
}

export default DispatchMenu;