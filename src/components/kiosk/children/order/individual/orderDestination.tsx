import {ContextualOrder} from "@utils/stockTypes";

interface OrderDestinationProps {
    currentOrder: ContextualOrder
}

export default function OrderDestination({ currentOrder }: OrderDestinationProps) {
    if (currentOrder.order_type == "pickup")
        return (
            <p className="text-gray-400">
                {currentOrder.destination?.contact.address.street}
                , {currentOrder.destination?.contact.address.street2}
                , {currentOrder.destination?.contact.address.po_code}
            </p>
        )

    else return (
        <p className="text-gray-400">
            {currentOrder.origin?.contact.address.street}
            , {currentOrder.origin?.contact.address.street2}
            , {currentOrder.origin?.contact.address.po_code}
        </p>
    )
}