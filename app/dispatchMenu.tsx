import Image from "next/image";
import { FC, useState } from "react";
import { v4 } from "uuid";
import { applyDiscount, findMaxDiscount } from "./discount_helpers";
import { Customer, Order, ProductPurchase, VariantInformation } from "./stock-types";

const DispatchMenu: FC<{ orderJob: [ Order[], Function ], customerJob: [ Customer | null, Function ] }> = ({ orderJob, customerJob }) => {
    const [ orderState, setOrderState ] = orderJob;
    const [ customerState, setCustomerState ] = customerJob;
    
    const [ selectedItems, setSelectedItems ] = useState<string[]>([]);

    const [ pageState, setPageState ] = useState();
    const [ selectedOrder, setSelectedOrder ] = useState(orderState[0]);

    return (
        <div className="flex flex-col flex-1 gap-8">
            <div className="flex flex-row items-center gap-4 self-center text-white w-full">
                <p className="bg-gray-800 py-2 px-4 rounded-md ">Select Products</p>
                <hr className="flex-1 border-gray-600 h-[3px] border-[2px] bg-gray-600 rounded-md" />
                <p className="text-gray-600">Set Origin</p>
                <hr className="flex-1 border-gray-600 h-[3px] border-[2px] bg-gray-600 rounded-md" />
                <p className="text-gray-600">Set Destination</p>
            </div>

            <div className="flex-col flex gap-4 flex-1">
                <div>
                    <p className="text-white">Select Products</p>
                </div>

                <div className="flex-col flex gap-4 flex-1">
                    {
                        orderState
                            .filter(e => e.order_type == "direct")
                            .map(k => 
                                k.products.length == 0 ?
                                <div key={k.id}>
                                    <p>No products in cart</p>
                                </div>
                                :
                                k?.products.map(e => {
                                    const arr = [...Array.from(Array(e.quantity), (_, i) => i + 1)]
                                    console.log(arr);

                                    return arr.map(k => {
                                        return (
                                            <div key={e.id} onClick={() => {
                                                if(selectedItems?.find(k => k == e.id)) {
                                                    setSelectedItems([ ...selectedItems.filter(k => k !== e.id) ])
                                                }else {
                                                    setSelectedItems([ ...selectedItems, e.id ])
                                                }
                                            }} className="flex cursor-pointer select-none flex-col w-full items-center gap-2 text-white">
                                                <div key={e.id} className="text-white flex flex-row flex-1 w-full">
                                                    <div className="flex flex-1 w-full flex-row items-center gap-4">
                                                        <div className="relative">
                                                            <Image height={60} width={60} quality={100} alt="" className="rounded-sm" src={e.variant_information.images[0]}></Image>
                                                        </div>

                                                        <br />
                                                        
                                                        <div className="flex-1">
                                                            <p className="font-semibold">{e.product.company} {e.product.name}</p>
                                                            <p className="text-sm text-gray-400">{e.variant_information.name}</p>
                                                        </div>

                                                        <div className="flex">
                                                            {
                                                                !selectedItems?.find(k => k == e.id) ?
                                                                <Image src="/icons/square.svg" alt="selected" width={20} height={20}  style={{ filter: "invert(78%) sepia(15%) saturate(224%) hue-rotate(179deg) brightness(82%) contrast(84%)" }}></Image>
                                                                :
                                                                <Image src="/icons/check-square.svg" alt="selected" width={20} height={20}  style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(168deg) brightness(105%) contrast(107%)" }}></Image>
                                                            }
                                                        </div>

                                                        <div className="min-w-[75px] flex flex-col items-center">
                                                            {
                                                                applyDiscount(e.variant_information.retail_price, findMaxDiscount(e.discount, e.variant_information.retail_price, !(!customerState)).value) == e.variant_information.retail_price ?
                                                                <p>${(e.variant_information.retail_price * 1.15).toFixed(2)}</p>
                                                                :
                                                                <>
                                                                    <p className="text-gray-500 line-through text-sm">${(e.variant_information.retail_price * 1.15).toFixed(2)}</p>
                                                                    <p className={`${findMaxDiscount(e.discount, e.variant_information.retail_price, !(!customerState)).source == "loyalty" ? "text-indigo-300" : ""}`}>${((applyDiscount(e.variant_information.retail_price  * 1.15, findMaxDiscount(e.discount, e.variant_information.retail_price, !(!customerState)).value) ?? 1)).toFixed(2)}</p>
                                                                </>
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                })
                        )
                    } 
                </div>
            </div>
            
            <div className="flex flex-col">
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
            </div>
        </div>
    )
}

export default DispatchMenu;