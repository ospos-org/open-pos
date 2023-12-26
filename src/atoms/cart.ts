import {atom} from "jotai";
import {ordersAtom} from "@atoms/transaction";

const totalProductQuantityAtom = atom(get => {
    return get(ordersAtom).reduce((p, c) =>
        p + c.products.reduce((prev, curr) => prev + curr.quantity, 0),
        0
    )
})

export { totalProductQuantityAtom }