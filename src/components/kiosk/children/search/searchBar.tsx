import { useAtom, useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";

import { inspectingCustomerAtom } from "@atoms/customer";
import { inspectingProductAtom } from "@atoms/product";
import {
	querySearchTerm,
	searchFocusedAtom,
	searchInputRefAtom,
	searchTermAtom,
	searchTypeHandlerAtom,
} from "@atoms/search";
import { debounce } from "lodash";
import { useRef } from "react";

export function SearchBar() {
	const inputRef = useAtomValue(searchInputRefAtom);

	const querySearchResults = useSetAtom(querySearchTerm);
	const setSearchTermState = useSetAtom(searchTermAtom);

	const [inspectingCustomer, setInspectingCustomer] = useAtom(
		inspectingCustomerAtom,
	);
	const [inspectingProduct, setInspectingProduct] = useAtom(
		inspectingProductAtom,
	);

	const [searchFocused, setSearchFocused] = useAtom(searchFocusedAtom);
	const [searchType, setSearchType] = useAtom(searchTypeHandlerAtom);

	const debouncedSearch = useRef(
		debounce(async () => {
			await querySearchResults();
		}, 300),
	).current;

	return (
		<div className="p-4 pb-0">
			<div
				className={`flex flex-1 flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 ${
					searchFocused
						? "border-2 border-blue-500"
						: "border-2 border-gray-700"
				}`}
			>
				{inspectingProduct.activeProduct ||
				inspectingCustomer ||
				searchFocused ? (
					<Image
						onClick={() => {
							setInspectingProduct((previousProduct) => ({
								...previousProduct,
								activeProduct: null,
							}));
							setInspectingCustomer(null);
							setSearchFocused(false);
						}}
						width="20"
						height="20"
						src="/icons/arrow-narrow-left.svg"
						className="select-none cursor-pointer"
						alt={""}
						draggable={false}
					/>
				) : (
					<Image
						width="20"
						height="20"
						src="/icons/search-sm.svg"
						className="select-none"
						alt={""}
						draggable={false}
					/>
				)}

				<input
					ref={inputRef}
					placeholder={`Search for ${searchType}`}
					className="bg-transparent focus:outline-none text-white max-w-[100%] min-w-[0px]"
					style={{ flex: "1 0" }}
					onChange={(e) => {
						setSearchTermState(e.target.value);
						debouncedSearch();
					}}
					onFocus={(e) => {
						setSearchFocused(true);
						setSearchTermState(e.target.value);
						debouncedSearch();
					}}
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							e.preventDefault();
							setSearchFocused(false);
							e.currentTarget.blur();
						}
					}}
				/>

				<div className="flex flex-row items-center gap-2 bg-gray-600 px-1 py-1 rounded-md flex-shrink-0 select-none">
					<Image
						draggable={false}
						onClick={() => {
							setSearchType("products");
						}}
						className="cursor-pointer"
						width="20"
						height="20"
						src="/icons/cube-01-filled.svg"
						alt={""}
						style={{
							filter:
								searchType === "products"
									? "invert(100%) sepia(0%) saturate(7441%) hue-rotate(38deg) brightness(112%) contrast(111%)"
									: "invert(58%) sepia(32%) saturate(152%) hue-rotate(176deg) brightness(91%) contrast(87%)",
						}}
					/>
					<Image
						draggable={false}
						onClick={() => {
							setSearchType("customers");
						}}
						className="cursor-pointer"
						width="20"
						height="20"
						src="/icons/user-01.svg"
						alt={""}
						style={{
							filter:
								searchType === "customers"
									? "invert(100%) sepia(0%) saturate(7441%) hue-rotate(38deg) brightness(112%) contrast(111%)"
									: "invert(58%) sepia(32%) saturate(152%) hue-rotate(176deg) brightness(91%) contrast(87%)",
						}}
					/>
					<Image
						draggable={false}
						onClick={() => {
							setSearchType("transactions");
						}}
						className="cursor-pointer"
						width="20"
						height="20"
						src="/icons/receipt-check-filled.svg"
						alt={""}
						style={{
							filter:
								searchType === "transactions"
									? "invert(100%) sepia(0%) saturate(7441%) hue-rotate(38deg) brightness(112%) contrast(111%)"
									: "invert(58%) sepia(32%) saturate(152%) hue-rotate(176deg) brightness(91%) contrast(87%)",
						}}
					/>
				</div>

				{searchFocused ? (
					<Image
						className="select-none"
						width="20"
						height="20"
						src="/icons/x.svg"
						alt={""}
						draggable={false}
						onClick={() => setSearchFocused(false)}
					/>
				) : (
					<Image
						className="select-none"
						width="20"
						height="20"
						src="/icons/scan.svg"
						draggable={false}
						alt={""}
					/>
				)}
			</div>
		</div>
	);
}
