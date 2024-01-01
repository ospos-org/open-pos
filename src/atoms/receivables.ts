import { Order, Product, ProductInstance } from "@/generated/stock/Api";
import { atom } from "jotai";

const receivablesAtom = atom<Order[]>([]);

const receivablesMenuStateAtom = atom<{
	product: string;
	barcode: string;
	instances: {
		product_purchase_id: string;
		transaction_id: string;
		state: ProductInstance;
	}[];
} | null>(null);

const receivablesStateChangeAtom = atom<{
	product_purchase_id: string;
	transaction_id: string;
	state: ProductInstance;
} | null>(null);

const receivablesActiveOrderAtom = atom<Order | null>(null);

const receivablesProductInformationAtom = atom<Product | null>(null);

export {
	receivablesAtom,
	receivablesMenuStateAtom,
	receivablesStateChangeAtom,
	receivablesActiveOrderAtom,
	receivablesProductInformationAtom,
};
