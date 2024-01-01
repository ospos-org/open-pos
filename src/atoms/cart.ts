import { TransactionType } from "@/generated/stock/Api";
import { ordersAtom } from "@atoms/transaction";
import { ContextualProductPurchase } from "@utils/stockTypes";
import { atom } from "jotai";

function determineProductDirectionality(
	transactionType: TransactionType,
): number {
	if (transactionType === "Out") return 1;
	if (transactionType === "In") return -1;
	if (transactionType === "PendingOut") return 1;
	if (transactionType === "PendingIn") return -1;
	return 0;
}

// Describes the quantity of total products in the cart (i.e. 7 total items)
const totalProductQuantityAtom = atom((get) => {
	return get(ordersAtom).reduce(
		(p, c) => p + c.products.reduce((prev, curr) => prev + curr.quantity, 0),
		0,
	);
});

// Describes the NET quantity of a specific product in the cart (i.e. 3 of X in cart)
// Considers IN/OUT variance, such that if there is 0 in stock, with 1 being returned - 1 can be taken out again,
// as there will be 1 in stock. Although this might not be expected behaviour. As such, in cases for only wanting to know
// the OUT-variant products, see `totalQuantityOfProductTransactedOutFromCartAtom`.
const totalNetQuantityOfProductTransactedOutFromCartAtom = atom(
	undefined,
	(get, set, value: ContextualProductPurchase) => {
		return get(ordersAtom).reduce(
			(prior, current) =>
				prior +
				current.products.reduce(
					(priorProduct, currentProduct) =>
						priorProduct +
						(currentProduct.variant_information.barcode ===
						value.variant_information.barcode
							? // We need the net value transfer.
							  determineProductDirectionality(
									currentProduct.transaction_type,
							  ) * currentProduct.quantity
							: 0),
					0,
				),
			0,
		);
	},
);

const totalQuantityOfProductTransactedOutFromCartAtom = atom(
	undefined,
	(get, set, value: ContextualProductPurchase) => {
		return get(ordersAtom).reduce(
			(prior, current) =>
				prior +
				current.products.reduce(
					(priorProduct, currentProduct) =>
						priorProduct +
						(currentProduct.variant_information.barcode ===
						value.variant_information.barcode
							? // We need the net value transfer.
							  currentProduct.transaction_type === "Out"
								? currentProduct.quantity
								: 0
							: 0),
					0,
				),
			0,
		);
	},
);

export {
	totalProductQuantityAtom,
	totalQuantityOfProductTransactedOutFromCartAtom,
	totalNetQuantityOfProductTransactedOutFromCartAtom,
};
