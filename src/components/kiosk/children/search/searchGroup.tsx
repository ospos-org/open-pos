import { useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";

import { searchResultsAtomic, searchTypeHandlerAtom } from "@/src/atoms/search";
import { kioskPanelLogAtom } from "@atoms/kiosk";

import { SearchUnion } from "@components/kiosk/children/search/grouping/search";
import { SearchResultCategory } from "@components/kiosk/children/search/grouping/searchResultCategory";

import { ItemCustomer } from "@components/kiosk/children/search/results/itemCustomer";
import { ItemProduct } from "@components/kiosk/children/search/results/itemProduct";
import { ItemTransaction } from "@components/kiosk/children/search/results/itemTransaction";

export function SearchGroup() {
	const searchType = useAtomValue(searchTypeHandlerAtom);
	const searchResult = useAtomValue(searchResultsAtomic);

	const setKioskPanel = useSetAtom(kioskPanelLogAtom);

	// @ts-expect-error Typescript Generic Operands Suck
	const searchValues: SearchUnion = useMemo(
		() => ({
			type: searchType,
			results: searchResult,
		}),
		[searchResult, searchType],
	);

	const nullComponent = useMemo(() => {
		switch (searchType) {
			case "customers":
				return (
					<div className="flex flex-col items-center justify-center">
						<p className="self-center text-gray-400 pt-6">
							No customers with this name
						</p>
						<p
							onClick={() => {
								setKioskPanel("customer-create");
							}}
							className="self-center text-white pb-6 cursor-pointer"
						>
							Create customer
						</p>
					</div>
				);
			case "products":
				return (
					<p className="self-center text-gray-400 py-6">
						No products with this name
					</p>
				);
			case "transactions":
				return (
					<p className="self-center text-gray-400 py-6">
						No transactions with this reference
					</p>
				);
		}
	}, [searchType, setKioskPanel]);

	const itemComponent = useMemo(() => {
		switch (searchType) {
			case "customers":
				return ItemCustomer;
			case "products":
				return ItemProduct;
			case "transactions":
				return ItemTransaction;
		}
	}, [searchType]);

	return (
		<div className="flex flex-1 flex-col flex-wrap bg-gray-700 rounded-sm text-white overflow-hidden mb-4">
			<SearchResultCategory
				value={searchValues}
				nullComponent={nullComponent}
				// @ts-ignore Component casting unnecessary
				itemComponent={itemComponent}
			/>
		</div>
	);
}
