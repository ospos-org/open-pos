import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { v4 } from "uuid"
import Image from "next/image"

import { findMaxDiscount, isEquivalentDiscount } from "@utils/discountHelpers"
import { ActiveDiscountApplication, kioskPanelLogAtom } from "@atoms/kiosk"
import { DiscountValue, ProductPurchase } from "@utils/stockTypes"
import { aCustomerActiveAtom } from "@atoms/customer"
import { ordersAtom } from "@atoms/transaction"

import DiscountMenu from "./discountMenu"

export function DiscountScreen() {
    const setKioskPanel = useSetAtom(kioskPanelLogAtom)

    const customerActive = useAtomValue(aCustomerActiveAtom)
    const [ orderState, setOrderState ] = useAtom(ordersAtom)

    return (
        <div className="bg-gray-900 p-6 flex flex-col h-full justify-between flex-1" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
            <div className="flex flex-row justify-between cursor-pointer">
                <div 
                    onClick={() => {
                        setKioskPanel("cart")
                    }}
                    className="flex flex-row items-center gap-2"
                >
                    <Image src="/icons/arrow-narrow-left.svg" height={20} width={20} alt="" />
                    <p className="text-gray-400">Back</p>
                </div>
                <p className="text-gray-400">Select Discount</p>
            </div>

            <DiscountMenu callback={(dcnt: ActiveDiscountApplication) => {
                setKioskPanel("cart")

                if(dcnt.for == "product") {
                    if(dcnt.exclusive) {
                        let overflow_quantity = 0;
                        let overflow_product: (ProductPurchase | null) = null;

                        const new_state = orderState.map(n => {
                            //?? impl! Add option to only apply to a product in a SINGLE order, as opposed to the same item mirrored across multiple orders...?
                            let new_products = n.products.map(e => {
                                if(e.variant_information.barcode == dcnt.product?.barcode) {
                                    if(e.quantity > 1) {
                                        overflow_quantity = e.quantity - 1
                                        overflow_product = e
                                    }

                                    return {
                                        ...e,
                                        quantity: 1,
                                        discount: [
                                            // Will replace any currently imposed discounts
                                            ...e.discount.filter(e => {
                                                return e.source !== "user"
                                            }),
                                            {
                                                source: "user",
                                                value: `${dcnt.type == "absolute" ? "a" : "p"}|${dcnt.value}`,
                                                applicable_quantity: -1,
                                            } as DiscountValue
                                        ]
                                    };
                                } else return e;
                            });

                            // Merge any new duplicate products with the same discount.
                            const merged = new_products.map((p, i) => {
                                // console.log(`${p.product_name}: Product Match? `);

                                const indx = new_products.findIndex(a => 
                                    a.variant_information.barcode == p.variant_information.barcode
                                    && isEquivalentDiscount(
                                        findMaxDiscount(a.discount, a.product_cost, customerActive)[0], 
                                        findMaxDiscount(p.discount, p.product_cost, customerActive)[0],
                                        p.product_cost
                                    )
                                );

                                if(
                                    indx != -1 && indx != i
                                ) {
                                    //... Merge the values!
                                    return {
                                        ...p,
                                        quantity: p.quantity + new_products[indx].quantity
                                    };
                                }else {
                                    return p;
                                }
                            });

                            if(overflow_product !== null) {
                                // !impl check and compare discount values so quantity does not increase for non-similar product 
                                const indx = new_products.findIndex(a => 
                                    a.variant_information.barcode == overflow_product?.variant_information.barcode
                                    && isEquivalentDiscount(
                                        findMaxDiscount(a.discount, a.product_cost, customerActive)[0], 
                                        findMaxDiscount(
                                            overflow_product.discount, 
                                            overflow_product.product_cost, 
                                            customerActive
                                        )[0],
                                        overflow_product.product_cost
                                    )
                                );

                                // console.log("Dealing with overflow value, ", indx);
                                
                                // If overflow product already exists (in exact kind), increase quantity - otherwise ...
                                if(indx != -1) {
                                    merged[indx].quantity += overflow_quantity;
                                }else {
                                    merged.push({
                                        ...overflow_product as ProductPurchase,
                                        quantity: overflow_quantity,
                                        id: v4()
                                    })
                                }
                            }

                            return {
                                ...n,
                                products: merged.filter(b => b !== null) as ProductPurchase[]
                            }
                        })

                        setOrderState(new_state)
                    }else {
                        const new_state = orderState.map(n => {
                            let clone = [...n.products] as ProductPurchase[];

                            for(let i = 0; i < clone.length; i++) {
                                let e = clone[i];
                                if(e == null) continue;

                                const indx = clone.findIndex((a, ind) => 
                                    a != null && i != ind &&
                                    a.variant_information.barcode == e?.variant_information.barcode
                                    && isEquivalentDiscount(
                                        findMaxDiscount([{
                                            source: "user",
                                            value: `${dcnt.type == "absolute" ? "a" : "p"}|${dcnt.value}`,
                                            applicable_quantity: -1,
                                        } as DiscountValue], a.product_cost, customerActive)[0], 
                                        findMaxDiscount(e.discount, e.product_cost, customerActive)[0],
                                        e.product_cost
                                    )
                                );

                                if(indx != -1) {
                                    clone[indx].quantity += e.quantity;
                                    //@ts-ignore
                                    clone[i] = null;
                                    continue;
                                }

                                if(e.variant_information.barcode == dcnt.product?.barcode) {
                                    clone[i] = {
                                        ...e,
                                        discount: [
                                            // Will replace any currently imposed discounts
                                            ...e.discount.filter(e => {
                                                return e.source !== "user"
                                            }),
                                            {
                                                source: "user",
                                                value: `${dcnt.type == "absolute" ? "a" : "p"}|${dcnt.value}`,
                                                applicable_quantity: -1,
                                            } as DiscountValue
                                        ]
                                    };
                                }
                            }

                            return {
                                ...n,
                                products: clone.filter(b => b != null) as ProductPurchase[]
                            }
                        });

                        setOrderState(new_state)
                    }
                }else {
                    const new_state = orderState.map(n => {
                        return {
                            ...n,
                            discount: `${dcnt.type == "absolute" ? "a" : "p"}|${dcnt.value}`
                        }
                    });

                    setOrderState(new_state)
                }
            }} 
            multiple={orderState.reduce((p, c) => p + c.products.reduce((prev, curr) => { return prev + curr.quantity }, 0), 0) > 0} />
        </div>
    )
}