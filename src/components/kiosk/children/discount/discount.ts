import { aCustomerActiveAtom } from "@atoms/customer";
import { ActiveDiscountApplication } from "@atoms/kiosk";
import { ordersAtom } from "@atoms/transaction";
import { findMaxDiscount, isEquivalentDiscount } from "@utils/discountHelpers";
import {
	ContextualDiscountValue,
	ContextualProductPurchase,
} from "@utils/stockTypes";
import { useAtom, useAtomValue } from "jotai/index";
import { v4 } from "uuid";

const useDiscountHandler = () => {
	const customerActive = useAtomValue(aCustomerActiveAtom);
	const [orderState, setOrderState] = useAtom(ordersAtom);

	const calculateNonExclusiveProductDiscount = (
		dcnt: ActiveDiscountApplication,
	) => {
		return orderState.map((n) => {
			const clone = [...n.products] as ContextualProductPurchase[];

			for (let i = 0; i < clone.length; i++) {
				const e = clone[i];
				if (e == null) continue;

				const indx = clone.findIndex(
					(a, ind) =>
						a != null &&
						i !== ind &&
						a.variant_information.barcode === e?.variant_information.barcode &&
						isEquivalentDiscount(
							findMaxDiscount(
								[
									{
										source: "user",
										value: `${dcnt.type === "absolute" ? "a" : "p"}|${
											dcnt.value
										}`,
										applicable_quantity: -1,
									} as ContextualDiscountValue,
								],
								a.product_cost,
								customerActive,
							)[0],
							findMaxDiscount(e.discount, e.product_cost, customerActive)[0],
							e.product_cost,
						),
				);

				if (indx !== -1) {
					clone[indx].quantity += e.quantity;
					//@ts-ignore
					clone[i] = null;
					continue;
				}

				if (e.variant_information.barcode === dcnt.product?.barcode) {
					clone[i] = {
						...e,
						discount: [
							// Will replace any currently imposed discounts
							...e.discount.filter((e) => {
								return e.source !== "user";
							}),
							{
								source: "user",
								value: `${dcnt.type === "absolute" ? "a" : "p"}|${dcnt.value}`,
								applicable_quantity: -1,
							} as ContextualDiscountValue,
						],
					};
				}
			}

			return {
				...n,
				products: clone.filter((b) => b != null) as ContextualProductPurchase[],
			};
		});
	};

	const calculateExclusiveProductDiscount = (
		dcnt: ActiveDiscountApplication,
	) => {
		let overflow_quantity = 0;
		let overflow_product: ContextualProductPurchase | null = null;

		return orderState.map((n) => {
			//?? impl! Add option to only apply to a product in a SINGLE order, as opposed to the same item mirrored across multiple orders...?
			const new_products = n.products.map((e) => {
				if (e.variant_information.barcode === dcnt.product?.barcode) {
					if (e.quantity > 1) {
						overflow_quantity = e.quantity - 1;
						overflow_product = e;
					}

					return {
						...e,
						quantity: 1,
						discount: [
							// Will replace any currently imposed discounts
							...e.discount.filter((e) => {
								return e.source !== "user";
							}),
							{
								source: "user",
								value: `${dcnt.type === "absolute" ? "a" : "p"}|${dcnt.value}`,
								applicable_quantity: -1,
							} as ContextualDiscountValue,
						],
					};
				}
				return e;
			});

			// Merge any new duplicate products with the same discount.
			const merged = new_products.map((p, i) => {
				// console.log(`${p.product_name}: Product Match? `);

				const indx = new_products.findIndex(
					(a) =>
						a.variant_information.barcode === p.variant_information.barcode &&
						isEquivalentDiscount(
							findMaxDiscount(a.discount, a.product_cost, customerActive)[0],
							findMaxDiscount(p.discount, p.product_cost, customerActive)[0],
							p.product_cost,
						),
				);

				if (indx !== -1 && indx !== i) {
					//... Merge the values!
					return {
						...p,
						quantity: p.quantity + new_products[indx].quantity,
					};
				}
				return p;
			});

			if (overflow_product !== null) {
				// !impl check and compare discount values so quantity does not increase for non-similar product
				const indx = new_products.findIndex(
					(a) =>
						a.variant_information.barcode ===
							overflow_product?.variant_information.barcode &&
						isEquivalentDiscount(
							findMaxDiscount(a.discount, a.product_cost, customerActive)[0],
							findMaxDiscount(
								overflow_product.discount,
								overflow_product.product_cost,
								customerActive,
							)[0],
							overflow_product.product_cost,
						),
				);

				// console.log("Dealing with overflow value, ", indx);

				// If overflow product already exists (in exact kind), increase quantity - otherwise ...
				if (indx !== -1) {
					merged[indx].quantity += overflow_quantity;
				} else {
					merged.push({
						...(overflow_product as ContextualProductPurchase),
						quantity: overflow_quantity,
						id: v4(),
					});
				}
			}

			return {
				...n,
				products: merged.filter(
					(b) => b !== null,
				) as ContextualProductPurchase[],
			};
		});
	};

	const calculateCartDiscount = (dcnt: ActiveDiscountApplication) => {
		return orderState.map((n) => {
			return {
				...n,
				discount: `${dcnt.type === "absolute" ? "a" : "p"}|${dcnt.value}`,
			};
		});
	};

	const applyOrderUpdate = (dcnt: ActiveDiscountApplication) => {
		if (dcnt.for === "product") {
			if (dcnt.exclusive) {
				setOrderState(calculateExclusiveProductDiscount(dcnt));
			} else {
				setOrderState(calculateNonExclusiveProductDiscount(dcnt));
			}
		} else {
			setOrderState(calculateCartDiscount(dcnt));
		}
	};

	return {
		applyOrderUpdate,
	};
};

export { useDiscountHandler };
