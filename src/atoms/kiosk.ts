import { atom } from "jotai";
import { RESET, atomWithReset, useResetAtom } from "jotai/utils";
import { customAlphabet } from "nanoid";
import { v4 } from "uuid";

import { PAD_MODES } from "@utils/kioskTypes";

import {
	Customer,
	OrderType,
	Product,
	Transaction,
	TransactionInput,
	TransactionType,
	VariantInformation,
} from "@/generated/stock/Api";
import { computeDatabaseOrderFormat } from "@atoms/conversion";
import { customerAtom } from "@atoms/customer";
import { masterStateAtom } from "@atoms/openpos";
import { paymentIntentsAtom, priceAtom } from "@atoms/payment";
import { ordersAtom } from "@atoms/transaction";
import { fromDbDiscount } from "@utils/discountHelpers";
import {
	ContextualOrder,
	ContextualProductPurchase,
	KioskState,
} from "@utils/stockTypes";
import { getDate } from "@utils/utils";
import { toast } from "sonner";
import { openStockClient } from "~/query/client";
import { inspectingProductAtom } from "./product";

type KioskActionContinuative = {
	type: "continuative";
	transaction_id: string;
};

type KioskActionCreative = {
	type: "creative";
};

type KioskAction =
	// A continuative type, like a refund, refers to
	// when a kiosk is continuing a previously inserted
	// transaction as opposed to creating a new one
	KioskActionContinuative | KioskActionCreative;

const perfAtom = atom<KioskAction>({
	type: "creative",
});

const defaultKioskAtom = atom(
	(get) => {
		return {
			customer: get(customerAtom),
			transaction_type: get(transactionTypeAtom),
			products: get(ordersAtom),
			order_total: get(priceAtom).total,
			payment: get(paymentIntentsAtom),
			order_date: getDate(),
			order_notes: [],
			salesperson: get(masterStateAtom).employee?.id,
			kiosk: get(masterStateAtom).kiosk_id,
			perf: get(perfAtom),
		} as KioskState;
	},
	(_, set, resetKey: typeof RESET) => {
		if (resetKey === RESET) {
			// Clear all payment intents (no spillover)
			set(paymentIntentsAtom, []);

			// Unset the active (selected) customer
			set(customerAtom, null);

			// Clear all orders, new kiosk session
			set(ordersAtom, []);

			// Set back to the primary panel
			set(kioskPanelLogAtom, "cart");

			// Reset transaction type to default.
			set(transactionTypeAtom, TransactionType.Out);

			// If the system is not in a creative
			// state, make it in one.
			set(perfAtom, {
				type: "creative",
			});
		}
	},
);

const transactionTypeAtom = atom<TransactionType>(TransactionType.Out);

const currentOrderAtom = atomWithReset<ContextualOrder>({
	id: v4(),
	destination: null,
	origin: null,
	products: [],
	status: {
		status: {
			type: "queued",
			value: getDate(),
		},
		assigned_products: [],
		timestamp: getDate(),
	},
	status_history: [],
	order_history: [],
	order_notes: [],
	reference: `RF${customAlphabet("1234567890abcdef", 10)(8)}`,
	creation_date: getDate(),
	discount: "a|0",
	order_type: OrderType.Direct,
	previous_failed_fulfillment_attempts: [],
});

const kioskPanelAtom = atomWithReset<PAD_MODES>("cart");
const kioskPanelHistory = atomWithReset<PAD_MODES[]>([]);

const kioskPanelLogAtom = atom(
	(get) => get(kioskPanelAtom),
	(get, set, value: PAD_MODES) => {
		set(kioskPanelHistory, [...get(kioskPanelHistory), value]);
		set(kioskPanelAtom, value);
	},
);

interface KioskSelections {
	product: Product | null;
	customer: Customer | null;
	transaction: Transaction | null;
}

const selectionAtom = atom<KioskSelections>({
	product: null,
	customer: null,
	transaction: null,
});

interface CartInformation {
	barcode: "CART";
	retail_price: number;
	marginal_price: number;
}

export interface ActiveDiscountApplication {
	type: "absolute" | "percentage";
	product: VariantInformation | CartInformation | null;
	value: number;
	for: "cart" | "product";
	exclusive: boolean;
	orderId: string;
	source: "user";
}

const activeDiscountAtom = atom<ActiveDiscountApplication | null>(null);

const generateTransactionAtom = atom((get) => {
	const customer = get(customerAtom);
	const products = get(computeDatabaseOrderFormat);

	return {
		...get(defaultKioskAtom),
		customer: customer
			? {
					customer_id: customer.id,
					customer_type: "Individual",
			  }
			: {
					customer_id: get(masterStateAtom).store_id,
					customer_type: "Store",
			  },

		products,

		// As we are saving the order, we aren't charging the customer anything.
		order_total: Math.round(get(priceAtom).total * 100),
	} as TransactionInput;
});

const parkSaleAtom = atom(undefined, (get, set) => {
	if ((get(ordersAtom)?.reduce((p, c) => p + c.products.length, 0) ?? 0) >= 1) {
		const transaction = get(generateTransactionAtom);

		openStockClient.transaction
			.create({
				...transaction,
				transaction_type: TransactionType.Saved,
			})
			.then((data) => {
				set(defaultKioskAtom, RESET);
			})
			.catch((error) => {
				toast.message("Failed to save transaction", {
					description: `Server gave: ${error.error.message}`,
				});
			});
	}
});

const addToCartAtom = atom(
	undefined,
	(get, set, orderProducts: ContextualProductPurchase[]) => {
		const {
			activeProduct: product,
			activeProductPromotions: promotions,
			activeProductVariant: variant,
		} = get(inspectingProductAtom);

		const existing_product = orderProducts.find(
			(k) => k.product_code === variant?.barcode,
		); // && isEqual(k.variant, variant?.variant_code)
		let new_order_products_state: ContextualProductPurchase[] = [];

		if (existing_product && variant && product) {
			const matching_product = orderProducts.find(
				(e) => e.product_code === variant?.barcode,
			);
			// && (applyDiscount(1, findMaxDiscount(e.discount, e.variant_information.retail_price, false).value) == 1)

			if (matching_product) {
				const total_stock = matching_product.variant_information.stock.reduce(
					(p, c) => p + c.quantity.quantity_sellable,
					0,
				);
				// If a matching product exists; apply emendation
				new_order_products_state = orderProducts.map((e) => {
					if (total_stock <= e.quantity) return e;

					return e.product_code === variant.barcode
						? { ...e, quantity: e.quantity + 1 }
						: e;
					//  && (applyDiscount(1, findMaxDiscount(e.discount, e.variant_information.retail_price, false).value) == 1)
				});
			} else {
				const po: ContextualProductPurchase = {
					id: v4(),
					product_code: variant.barcode ?? product.sku ?? "",
					discount: [
						{
							source: "loyalty",
							value: fromDbDiscount(variant.loyalty_discount),
							applicable_quantity: -1,
						},
					],
					product_cost: variant?.retail_price ?? 0,
					product_name: `${product.company} ${product.name}`,
					product_variant_name: variant.name,
					product_sku: product.sku,
					quantity: 1,
					transaction_type: TransactionType.Out,
					instances: [],

					product: product,
					variant_information: variant ?? product.variants[0],
					active_promotions: promotions,

					tags: product.tags,
				};

				new_order_products_state = [...orderProducts, po];
			}
		} else if (product && variant) {
			// Creating a new product in the order.
			const po: ContextualProductPurchase = {
				id: v4(),
				product_code: variant.barcode ?? product.sku ?? "",
				discount: [
					{
						source: "loyalty",
						value: fromDbDiscount(variant.loyalty_discount),
						applicable_quantity: -1,
					},
				],
				instances: [],
				product_cost: variant?.retail_price ?? 0,
				product_name: `${product.company} ${product.name}`,
				product_variant_name: variant.name,
				product_sku: product.sku,
				quantity: 1,
				transaction_type: TransactionType.Out,

				product: product,
				variant_information: variant ?? product.variants[0],
				active_promotions: promotions,

				tags: product.tags,
			};

			new_order_products_state = [...orderProducts, po];
		}

		return new_order_products_state;
	},
);

const resetAllAtom = atom(undefined, (get, set) => {
	set(defaultKioskAtom, RESET);
	set(currentOrderAtom, RESET);
	set(customerAtom, RESET);

	set(kioskPanelAtom, RESET);
	set(kioskPanelHistory, RESET);
});

export {
	currentOrderAtom,
	addToCartAtom,
	parkSaleAtom,
	generateTransactionAtom,
	transactionTypeAtom,
	defaultKioskAtom,
	kioskPanelLogAtom,
	kioskPanelAtom,
	kioskPanelHistory,
	selectionAtom,
	perfAtom,
	resetAllAtom,
	activeDiscountAtom,
};

export type { KioskAction };
