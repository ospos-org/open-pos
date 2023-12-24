import { activeDiscountAtom, kioskPanelLogAtom } from "@/src/atoms/kiosk";
import { findMaxDiscount, stringValueToObj } from "@/src/utils/discountHelpers";
import { useSetAtom } from "jotai";
import Image from "next/image";
import {ContextualProductPurchase} from "@utils/stockTypes";

interface ProductDiscountProps {
    product: ContextualProductPurchase
}

export function ProductDiscount({ product }: ProductDiscountProps) {
    const setKioskPanel = useSetAtom(kioskPanelLogAtom)
    const setDiscount = useSetAtom(activeDiscountAtom)

    return (
        <div className="flex flex-row items-center gap-2">
            <Image
                onClick={() => {
                    setKioskPanel("discount")
                    setDiscount({
                        ...stringValueToObj(findMaxDiscount(product.discount, product.product_cost, false)[0].value),
                        product: product.variant_information,
                        for: "product",
                        exclusive: false,
                        orderId: "",
                        source: "user"
                    })
                }}
                style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }} height={20} width={20} alt="Discount" className="select-none rounded-sm hover:cursor-pointer" src="/icons/sale-03.svg" 
                onMouseOver={(e) => {
                    e.currentTarget.style.filter = "invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.filter = "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
                }}
            ></Image>
        </div>
    )
}