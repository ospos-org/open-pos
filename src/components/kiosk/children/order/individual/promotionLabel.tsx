import { parseDiscount } from "@/src/utils/discountHelpers";
import { Order } from "@/src/utils/stockTypes";

interface PromotionLabelProps {
    currentOrder: Order
}

export function PromotionLabel({ currentOrder }: PromotionLabelProps) {
    if (currentOrder.discount === "a|0") return <></>;

    return (
        <div className="flex flex-row items-center gap-1">
            <div className="bg-blue-600 h-5 w-5 rounded-full flex items-center justify-center text-xs text-white">$</div>
            <div></div>
            <p className="text-white font-bold">{parseDiscount(currentOrder.discount)}</p>
            <p className="text-white">off this cart</p>
        </div>
    )
}