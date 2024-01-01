import {
	CustomerWithTransactionsOut,
	ProductWPromotion,
	Transaction,
} from "@/generated/stock/Api";

export type CustomerSearch = {
	type: "customers";
	results: CustomerWithTransactionsOut[];
};

export type ProductSearch = {
	type: "products";
	results: ProductWPromotion[];
};

export type TransactionSearch = {
	type: "transactions";
	results: Transaction[];
};

export type ItemUnion =
	| CustomerWithTransactionsOut
	| ProductWPromotion
	| Transaction;
export type SearchUnion = CustomerSearch | ProductSearch | TransactionSearch;

export function hashSearch(value: SearchUnion) {
	if (value.type === "products")
		return value.results.map((value) => value.product.sku);
	return value.results.map((value) => value.id);
}
