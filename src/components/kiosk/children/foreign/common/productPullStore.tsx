import { PrimitiveAtom, useAtom } from "jotai";
import { useAtomValue } from "jotai/index";
import { useCallback, useMemo } from "react";

import { Stock, Store } from "@/generated/stock/Api";

import { masterStateAtom } from "@atoms/openpos";
import {
	GeneratedOrder,
	SelectedItem,
} from "@components/kiosk/children/foreign/common/generated";

interface ProductPullStoreProps {
	selectedItemsAtom: PrimitiveAtom<SelectedItem[]>;
	generatedOrderAtom: PrimitiveAtom<GeneratedOrder[]>;

	order: GeneratedOrder;
}

export function ProductPullStore({
	selectedItemsAtom,
	generatedOrderAtom,
	order,
}: ProductPullStoreProps) {
	const [selectedItems, setSelectedItems] = useAtom(selectedItemsAtom);
	const [generatedOrder, setGeneratedOrder] = useAtom(generatedOrderAtom);

	const currentStore = useAtomValue(masterStateAtom);

	const alternateStoreSelectorOpen = useMemo(
		() =>
			selectedItems.find(
				(b) => b.item_id == order.item?.id && b.store_id == order.store,
			)?.selected,
		[order.item?.id, order.store, selectedItems],
	);

	const setSelected = useCallback(() => {
		setSelectedItems(
			selectedItems.map((b) =>
				b.item_id == order.item?.id && b.store_id == order.store
					? {
							...b,
							selected: true,
					  }
					: b,
			),
		);
	}, [order.item?.id, order.store, selectedItems, setSelectedItems]);

	const chooseAlternateStore = useCallback(
		(store: Stock) => {
			setGeneratedOrder(
				generatedOrder.map((b) =>
					b.item?.id == order?.item?.id && b.store == order.store
						? {
								...b,
								store: store.store.store_id,
						  }
						: b,
				),
			);

			setSelectedItems(
				selectedItems.map((b) =>
					b.item_id == order.item?.id && b.store_id == order.store
						? {
								...b,
								store_id: store.store.store_id,
								selected: false,
						  }
						: b,
				),
			);
		},
		[
			generatedOrder,
			order.item?.id,
			order.store,
			selectedItems,
			setGeneratedOrder,
			setSelectedItems,
		],
	);

	return (
		<div
			className={`relative inline-block ${
				Boolean(
					selectedItems.find(
						(b) => b.item_id == order.item?.id && b.store_id == order.store,
					)?.selected,
				) && "z-50"
			}`}
		>
			<p
				onClick={setSelected}
				className="self-center cursor-pointer content-center items-center justify-center font-semibold flex"
			>
				{currentStore.store_lut?.length > 0
					? currentStore.store_lut?.find((b: Store) => order.store == b.id)
							?.code
					: "-"}
			</p>

			<div
				className={`${Boolean(!alternateStoreSelectorOpen) && "hidden"} absolute flex flex-col items-center 
                    justify-center w-full rounded-md overflow-hidden z-50`}
			>
				{order.alt_stores.map((n) => (
					<div
						onClick={() => chooseAlternateStore(n)}
						key={`${order.item?.id}is-also-available-@${n.store.store_id}`}
						className={`${
							order.store == n.store.store_id
								? "bg-white text-gray-700"
								: "bg-gray-800 hover:bg-gray-700"
						} cursor-pointer font-semibold w-full flex-1 h-full text-center`}
					>
						{n.store.store_code}
					</div>
				))}
			</div>
		</div>
	);
}
