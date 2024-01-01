import { Stock } from "@/generated/stock/Api";
import { ContextualOrder, ContextualProductPurchase } from "@utils/stockTypes";

function generateProductMap(orders: ContextualOrder[]) {
	const pdt_map: ContextualProductPurchase[] = [];

	for (let i = 0; i < orders.length; i++) {
		if (orders[i].order_type == "direct") {
			orders[i].products.map((e) => {
				pdt_map.push(e);
			});
		}
	}

	return pdt_map;
}

function generateOrders(
	product_map: ContextualProductPurchase[],
	distance_data: { store_id: string; store_code: string; distance: number }[],
	currentStore: string,
): {
	assignment_sheet: {
		item: ContextualProductPurchase | undefined;
		store: string;
		alt_stores: Stock[];
		ship: boolean;
		quantity: number;
	}[];
	product_map: ContextualProductPurchase[];
} {
	/// 1. Determine the best location for each product.
	/// 2. Ensure as many products are in the same location as possible.
	/// 3. Ensure it is close to the destination.

	/// Create a reverse map of all products to store relations...
	/// Generate a valid list of store options
	/// => Sort by closeness
	/// => Give to user

	let smallest_distance = 12756000.01;

	distance_data.map((k) => {
		if (k.distance < smallest_distance) {
			smallest_distance = k.distance;
		}
	});

	const map = new Map<
		string,
		{
			items: { item_id: string; quantity: number }[];
			weighting: number;
		}
	>();

	product_map.map((e) => {
		e.variant_information.stock.map((k) => {
			const has = k.quantity.quantity_sellable;
			const store = k.store.store_id;
			const curr = map.get(store);

			if (curr) {
				curr.items.push({
					item_id: e.id,
					quantity: has,
				});

				map.set(store, curr);
			} else {
				map.set(store, {
					items: [
						{
							item_id: e.id,
							quantity: has,
						},
					],
					weighting: 0,
				});
			}
		});
	});

	// map<map<double (weighting), vector(items)>, string (strore)>
	// let m: [number, Map<string, ProductPurchase[]>][] = [];

	const kvp: {
		weighting: number;
		store_id: string;
		items: { item_id: string; quantity: number }[];
	}[] = [];

	const total_items = product_map.reduce((p, c) => (p += c.quantity), 0);

	map.forEach((val, key) => {
		const item_weighting =
			(val.items.reduce((p, e) => {
				const n =
					e.quantity -
					(product_map.find((k) => k.id == e.item_id)?.quantity ?? 0);
				return (p += n);
			}, 0) +
				1) /
			total_items;

		const distance_weighting =
			smallest_distance /
			(distance_data.find((k) => k.store_code == key)?.distance ?? 12756000.01);

		val.weighting = 0.1 * item_weighting + 0.9 * distance_weighting;
		// console.log(`${key}:: ${val.weighting} 0.1x${item_weighting} and 0.9x${distance_weighting}`)
		kvp.push({
			weighting: val.weighting,
			store_id: key,
			items: val.items,
		});
	});

	// [weighting, store_id, { item_id, quantity - that are instore }[]]
	const weighted_vector = kvp.sort((a, b) => b.weighting - a.weighting);

	// [item_id, store_code, quantity][]
	const product_assignment: [string, string, number][] = [];

	weighted_vector.map((k) => {
		k.items.map((b) => {
			const required_quantity =
				product_map.find((n) => n.id == b.item_id)?.quantity ?? 0;
			const fulfilled = product_assignment.reduce(
				(p, c) => (c[0] == b.item_id ? p + c[2] : p + 0),
				0,
			);
			const net_required = required_quantity - fulfilled;

			if (b.quantity >= net_required && net_required > 0) {
				// console.log(`Store: ${k.store_id} has enough to fulfil ${b.quantity}x${b.item_id} RQ${required_quantity}-FUL:${fulfilled}==NR${net_required}`)
				// Assign store to fulfil this quantity.
				product_assignment.push([b.item_id, k.store_id, net_required]);

				// Reduce the quantity the store has...
				weighted_vector.map((z) =>
					z.store_id == k.store_id
						? {
								...z,
								items: z.items.map((n) =>
									n.item_id == b.item_id
										? { ...n, quantity: n.quantity - net_required }
										: n,
								),
						  }
						: z,
				);
				// product_map = product_map.map(n => n.id == b.item_id ? { ...n, variant_information: { ...n.variant_information, stock: n.variant_information.stock.map(g => g.store.code == k.store_id ? { ...g, quantity: { ...g.quantity, quantity_sellable: g.quantity.quantity_sellable - net_required }} : g) } } : n)
			} else if (
				net_required > 0 &&
				b.quantity < net_required &&
				b.quantity > 0
			) {
				// console.log(`Store: ${k.store_id} has enough to ONLY fulfil ${b.quantity}x${b.item_id} RQ${required_quantity}-FUL:${fulfilled}==NR${net_required}`)

				product_assignment.push([b.item_id, k.store_id, b.quantity]);
				weighted_vector.map((z) =>
					z.store_id == k.store_id
						? {
								...z,
								items: z.items.map((n) =>
									n.item_id == b.item_id ? { ...n, quantity: 0 } : n,
								),
						  }
						: z,
				);
				// product_map = product_map.map(n => n.id == b.item_id ? { ...n, variant_information: { ...n.variant_information, stock: n.variant_information.stock.map(g => g.store.code == k.store_id ? { ...g, quantity: { ...g.quantity, quantity_sellable: g.quantity.quantity_sellable - net_required }} : g) } } : n)
			} else {
				// Store cannot fulfil
				// console.log(`Store: ${k.store_id} cannot fulfil any of ${b.item_id} RQ${required_quantity}-FUL:${fulfilled}==NR${net_required}`)
			}
		});
	});

	return {
		assignment_sheet: product_assignment.map((e) => {
			return {
				item: product_map.find((k) => k.id == e[0]),
				store: e[1],
				alt_stores: [
					product_map
						.find((k) => k.id == e[0])
						?.variant_information.stock.find((b) => b.store.store_id == e[1])!,
					...(product_map
						.find((k) => k.id == e[0])
						?.variant_information.stock.filter(
							(n) =>
								n.store.store_id !== e[1] &&
								n.quantity.quantity_sellable -
									product_assignment.reduce(
										(p, c) => (c[1] == n.store.store_id ? p + c[2] : p),
										0,
									) >=
									e[2],
						) ?? []),
				],
				ship: !(e[1] == currentStore),
				quantity: e[2],
			};
		}),
		product_map: product_map,
	};
}

export { generateProductMap, generateOrders };
