import { Product, Promotion } from "@/generated/stock/Api";
import {
	ContextualDiscountValue,
	ContextualProductPurchase,
	StrictVariantCategory,
} from "./stockTypes";

export function isValidVariant(
	activeProduct: Product,
	activeVariant: StrictVariantCategory[],
) {
	return activeProduct.variants.find((e) => {
		const comparative_map = e.variant_code.map((b) => {
			return activeVariant?.find((c) => c.variant.variant_code === b);
		});

		const filtered = comparative_map.filter((s) => !s);
		return filtered.length <= 0;
	});
}

export function applyDiscountsConsiderateOfQuantity(
	currentQuantity: number,
	discounts: ContextualDiscountValue[],
	price: number,
	customerActive: boolean,
) {
	let quantityCurrent = currentQuantity;

	// Here we have the following:
	// ---
	// Each discount has its own "applicable quantity". When this is 0,
	// the discount can **no longer be applied**, as its usable quantity
	// has been exhausted.
	//
	// We can then iterate over each discount given to the product, reducing
	// and removing each discount when it has been "exhausted".

	let savings = 0;
	let exhaustiblePromotions: ContextualDiscountValue[] = JSON.parse(
		JSON.stringify(
			discounts.filter((b) => b.source === "promotion" || b.source === "user"),
		),
	);

	// While we have quantity to serve, and promotions to apply...
	while (quantityCurrent > 0 && exhaustiblePromotions.length > 0) {
		const maximumDiscountFound = findMaxDiscount(
			exhaustiblePromotions,
			price,
			customerActive,
		);

		// While we can apply the promotion
		while (
			(quantityCurrent > 0 &&
				maximumDiscountFound[0].applicable_quantity > 0) ||
			maximumDiscountFound[0].applicable_quantity === -1
		) {
			// Reduce both applicable and current quantities
			maximumDiscountFound[0].applicable_quantity -= 1;
			quantityCurrent -= 1;

			const discount = maximumDiscountFound[0].value;
			savings += price - applyDiscount(price, discount);
		}

		// Remove the promotion, it has been exhausted.
		exhaustiblePromotions = exhaustiblePromotions.filter(
			(b, i) => i !== maximumDiscountFound[1],
		);
	}

	if (savings === 0) {
		// We have no savings, lets try default to non-"promotion" sources.
		const otherPromotions = discounts.filter((b) => b.source === "loyalty");

		// Only applies ONE, loop this if needed.
		const maximumDiscountFound = findMaxDiscount(
			otherPromotions,
			price,
			customerActive,
		);
		savings += price - applyDiscount(price, maximumDiscountFound[0].value);
	}

	return savings;
}

export function applyDiscount(price: number, discount: string) {
	const discountAsString = discount === "" ? "a|0" : discount;

	const d = discountAsString.split("|");

	if (d[0] === "a" || d[0] === "A") {
		// Absolute value
		const discount_absolute = parseInt(d[1]);
		return price - discount_absolute;
	}
	if (d[0] === "p" || d[0] === "P") {
		// Percentage value
		const discount_percentage = parseInt(d[1]);
		return price - price * (discount_percentage / 100);
	}

	return 1;
}

export function isGreaterDiscount(
	predicate: string,
	discount: string,
	price: number,
) {
	const predicatedDiscount = applyDiscount(price, predicate);
	const discountedDiscount = applyDiscount(price, discount);

	return discountedDiscount < predicatedDiscount;
}

export function parseDiscount(discount: string) {
	const d = discount.split("|");

	if (d[0] === "a" || d[0] === "A") {
		// Absolute value
		const discount_absolute = parseFloat(d[1]);
		return `$${discount_absolute.toFixed(2)}`;
	}
	if (d[0] === "p" || d[0] === "P") {
		// Percentage value
		const discount_percentage = parseFloat(d[1]);
		return `${discount_percentage.toFixed(2)}%`;
	}
}

export function fromDbDiscount(dbDiscount: {
	Absolute?: number;
	Percentage?: number;
}) {
	if (dbDiscount.Absolute) {
		return `a|${dbDiscount.Absolute ?? 0}`;
	}
	return `p|${dbDiscount.Percentage ?? 0}`;
}

export function toDbDiscount(discount: string): {
	Absolute?: number;
	Percentage?: number;
} {
	const d = discount.split("|");

	if (d[0] === "a" || d[0] === "A") {
		return {
			Absolute: parseFloat(d[1] ?? "0"),
		};
	}
	if (d[0] === "p" || d[0] === "P") {
		return {
			Percentage: parseFloat(d[1] ?? "0"),
		};
	}

	return {
		Absolute: parseFloat(d[1] ?? "0"),
	};
}

export function findMaxDiscount(
	discountValues: ContextualDiscountValue[],
	productValue: number,
	loyalty: boolean,
): [ContextualDiscountValue, number] {
	let max_discount = {
		value: "a|0",
		source: "user",
		applicable_quantity: -1,
	} as ContextualDiscountValue;

	let index = 0;

	for (let i = 0; i < discountValues.length; i++) {
		if (discountValues[i].source === "loyalty" && !loyalty) {
			continue;
		}

		if (
			isGreaterDiscount(
				max_discount.value,
				discountValues[i].value,
				productValue,
			)
		) {
			max_discount = discountValues[i];
			index = i;
		}
	}

	return [max_discount, index];
}

export function findMaxDiscountDb(
	discountValues: { Absolute?: number; Percentage?: number }[],
	productValue: number,
	loyalty: boolean,
) {
	let max_discount = {
		Absolute: 0,
	} as { Absolute?: number; Percentage?: number };

	for (let i = 0; i < discountValues.length; i++) {
		// if(discountValues[i].source == "loyalty" && !loyalty) { continue; }

		if (
			isGreaterDiscount(
				fromDbDiscount(max_discount),
				fromDbDiscount(discountValues[i]),
				productValue,
			)
		) {
			max_discount = discountValues[i];
		}
	}

	return max_discount;
}

export function stringValueToObj(discount: string): {
	value: number;
	type: "absolute" | "percentage";
} {
	const d = discount.split("|");

	if (d[0] === "a" || d[0] === "A") {
		return {
			value: parseFloat(d[1]),
			type: "absolute",
		};
	}
	return {
		value: parseFloat(d[1]),
		type: "percentage",
	};
}

export function toAbsoluteDiscount(discount: string, price: number) {
	const d = discount.split("|");

	if (d[0] === "a" || d[0] === "A") {
		return `a|${parseFloat(d[1])}`;
	}
	return `a|${(parseFloat(d[1]) / 100) * price}`;
}

export function applyPromotion(
	promo: Promotion,
	pdt: ContextualProductPurchase,
	pdt_map: Map<string, ContextualProductPurchase>,
): number {
	let total_quantity = 0;
	pdt_map.forEach((b) => {
		total_quantity += b.quantity;
	});

	// If the product does not match the BUY criterion
	if (promo.get.type === "specific" && !pdt_map.get(promo.get.value[0]))
		return 0;
	if (
		promo.get.type === "category" &&
		!pdt.product.tags.includes(promo.get.value?.[0])
	)
		return 0;
	if (
		(promo.get.type === "solothis" || promo.get.type === "this") &&
		promo.buy.type === "specific" &&
		pdt.id !== promo.buy.value[0]
	)
		return 0;

	// Product is the one in the GET condition...
	// Note: Any will only match the current product, and will not incur a search for another matching product as the function is called in a search-pattern.

	// Determine if product in the BUY condition is in the cart, if instead fits <promo.buy.Any>, no condition is necessary as the product is within categoric bounds.
	if (promo.buy.type === "specific" && !pdt_map.get(promo.buy.value[0]))
		return 0;

	// Check matches quantity condition for buy
	if (
		promo.buy.type === "any" &&
		promo.buy.value > pdt.quantity &&
		promo.buy.value > total_quantity
	)
		return 0;
	if (
		promo.buy.type === "specific" &&
		promo.buy.value[1] > (pdt_map.get(promo.buy.value[0])?.quantity ?? 0)
	)
		return 0;

	const discount = discountFromPromotion(promo);

	// Is promotion for THIS or for ANOTHER?
	if (
		promo.get.type === "specific" &&
		pdt.product.sku === promo.get.value?.[0]
	) {
		// is for THIS
		const normal_price = pdt.variant_information.retail_price * 1.15;
		const discounted_price = applyDiscount(
			normal_price,
			fromDbDiscount(discount),
		);
		return normal_price - discounted_price;
	}
	if (promo.get.type === "specific" && pdt_map.get(promo.get.value[0])) {
		// is for ANOTHER
		const prd_pur = pdt_map.get(promo.get.value[0]);
		const normal_price =
			(prd_pur?.variant_information.retail_price ?? 0) * 1.15;
		const discounted_price = applyDiscount(
			normal_price,
			fromDbDiscount(discount),
		);
		return normal_price - discounted_price;
	}
	// impl! Handle category case?
	const normal_price = pdt.variant_information.retail_price * 1.15;
	const discounted_price = applyDiscount(
		normal_price,
		fromDbDiscount(discount),
	);
	return normal_price - discounted_price;
}

export function discountFromPromotion(promo: Promotion): {
	Absolute?: number | undefined;
	Percentage?: number | undefined;
} {
	return promo.get.type === "any"
		? promo.get.value[1]
		: promo.get.type === "solothis"
		  ? promo.get.value
		  : promo.get.type === "specific"
			  ? promo.get.value[1][1]
			  : promo.get.type === "this"
				  ? promo.get.value[1]
				  : promo.get.type === "category"
					  ? promo.get.value[1][1]
					  : { Absolute: 0 };
}

export const isEquivalentDiscount = (
	a: ContextualDiscountValue,
	b: ContextualDiscountValue,
	product_cost: number,
) =>
	a.value === b.value &&
	applyDiscount(product_cost, a.value) === applyDiscount(product_cost, b.value);

export function generateProductInfo(
	product: ContextualProductPurchase,
	customerActive: boolean,
) {
	const maxDiscount = findMaxDiscount(
		product.discount,
		product.variant_information.retail_price,
		customerActive,
	)[0];

	const discountedPrice = applyDiscount(
		product.variant_information.retail_price,
		maxDiscount.value,
	);

	const priceAlreadyDiscounted =
		discountedPrice === product.variant_information.retail_price;

	const parsedDiscount = parseDiscount(maxDiscount.value);

	const quantityConsiderateTotal =
		product.variant_information.retail_price * product.quantity;
	const quantityConsiderateTotalWithTax = quantityConsiderateTotal * 1.15;

	const quantityConsiderateDiscountedTotal =
		applyDiscountsConsiderateOfQuantity(
			product.quantity,
			product.discount,
			product.variant_information.retail_price,
			customerActive,
		);

	const quantityConsiderateDiscountedTotalWTax =
		applyDiscountsConsiderateOfQuantity(
			product.quantity,
			product.discount,
			product.variant_information.retail_price * 1.15,
			customerActive,
		);

	return {
		maxDiscount,
		parsedDiscount,

		discountedPrice,
		priceAlreadyDiscounted,

		quantityConsiderateTotal,
		quantityConsiderateTotalWithTax,

		quantityConsiderateDiscountedTotal,
		quantityConsiderateDiscountedTotalWTax,
	};
}
