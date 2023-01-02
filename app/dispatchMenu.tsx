import Image from "next/image";
import { FC, useState } from "react";
import { applyDiscount } from "./discount_helpers";
import { Customer, Order, VariantInformation } from "./stock-types";

const DispatchMenu: FC<{ orderJob: [ Order[], Function ], customerJob: [ Customer | null, Function ] }> = ({ orderJob, customerJob }) => {
    const [ orderState, setOrderState ] = orderJob;
    const [ customerState, setCustomerState ] = customerJob;
    
    const [ selectedItems, setSelectedItems ] = useState<string[]>([]);

    const [ pageState, setPageState ] = useState();
    const [ selectedOrder, setSelectedOrder ] = useState(orderState[0].id);

    return (
        <div className="flex flex-col flex-1">
            <div className="flex-col flex gap-4 flex-1">
                <div>
                    <p className="text-white text-lg">Select Products</p>
                </div>

                <div className="flex-col flex gap-2 flex-1">
                    {
                        orderState.filter(e => e.order_type == "direct").map(k => k?.products.map(e => {
                            return (
                                <div key={e.id} onClick={() => {
                                    if(selectedItems?.find(k => k == e.id)) {
                                        setSelectedItems([ ...selectedItems.filter(k => k !== e.id) ])
                                    }else {
                                        setSelectedItems([ ...selectedItems, e.id ])
                                    }
                                }} className="flex cursor-pointer select-none flex-row items-center gap-2 text-white">
                                    <div>
                                        {
                                            !selectedItems?.find(k => k == e.id) ?
                                            <Image src="/icons/square.svg" alt="selected" width={20} height={20}  style={{ filter: "invert(78%) sepia(15%) saturate(224%) hue-rotate(179deg) brightness(82%) contrast(84%)" }}></Image>
                                            :
                                            <Image src="/icons/check-square.svg" alt="selected" width={20} height={20}  style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(168deg) brightness(105%) contrast(107%)" }}></Image>
                                        }
                                    </div>
                                    
                                    <p >{e.product.name}</p>
                                    <p>{e.variant_information.name}</p>
                                </div>
                            )
                        }))
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