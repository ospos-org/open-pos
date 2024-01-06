import {
	ItemUnion,
	SearchUnion,
	hashSearch,
} from "@components/kiosk/children/search/grouping/search";
import { useMemo } from "react";

type SearchResultCategoryProps = {
	value: SearchUnion;
	nullComponent: JSX.Element;
	itemComponent: ({
		value,
		index,
		searchLength,
	}: { value: ItemUnion; index: number; searchLength: number }) => JSX.Element;
};

export function SearchResultCategory({
	value,
	nullComponent,
	itemComponent: ItemComponent,
}: SearchResultCategoryProps) {
	const hashedSearch = useMemo(() => {
		return hashSearch(value);
	}, [value]);

	console.log(value);

	if (value.results.length === 0) return nullComponent;
	return (
		<>
			{value.results.map((item: ItemUnion, index) => (
				<ItemComponent
					key={hashedSearch[index]}
					value={item}
					index={index}
					searchLength={value.results.length}
				/>
			))}
		</>
	);
}
