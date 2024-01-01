import { CustomerWithTransactionsOut } from "@/generated/stock/Api";
import { customerAtom, inspectingCustomerAtom } from "@/src/atoms/customer";
import { inspectingProductAtom } from "@/src/atoms/product";
import {
	searchFocusedAtom,
	searchResultsAtom,
	searchResultsAtomic,
	searchTypeHandlerAtom,
} from "@/src/atoms/search";
import { useWindowSize } from "@/src/hooks/useWindowSize";
import { useAtomValue, useSetAtom } from "jotai";
import { useResetAtom } from "jotai/utils";

interface ItemCustomerProps {
	value: CustomerWithTransactionsOut;
	index: number;
}

export function ItemCustomer({ value, index }: ItemCustomerProps) {
	const clearSearchResults = useResetAtom(searchResultsAtom);

	const searchResults = useAtomValue(searchResultsAtomic);

	const setInspectingCustomer = useSetAtom(inspectingCustomerAtom);
	const setInspectingProduct = useSetAtom(inspectingProductAtom);

	const setSearchFocused = useSetAtom(searchFocusedAtom);
	const setCustomerState = useSetAtom(customerAtom);
	const setSearchType = useSetAtom(searchTypeHandlerAtom);

	const windowSize = useWindowSize();

	return (
		<div
			key={`CUSTOMER-${value.id}`}
			className="flex flex-col overflow-hidden h-fit"
			onClick={(v) => {
				if ((v.target as any).id !== "assign-to-cart") {
					setSearchFocused(false);

					setInspectingCustomer(value);
					setInspectingProduct((previousProduct) => ({
						...previousProduct,
						activeProduct: null,
					}));
				}
			}}
		>
			<div
				className="select-none grid items-center md:gap-4 gap-2 p-4 hover:bg-gray-400 hover:bg-opacity-10 cursor-pointer"
				style={{
					gridTemplateColumns:
						(windowSize.width ?? 0) >= 640 ? "150px 1fr 250px" : `1fr 100px`,
				}}
			>
				<div className="flex flex-col gap-0 max-w-[26rem] w-full flex-1">
					<p>{value.name}</p>
					<p className="text-sm text-gray-400">
						{(value?.transactions?.split(",")?.length ?? 0) > 0
							? value?.transactions?.split(",")?.length
							: "No"}{" "}
						Past Order{value?.transactions?.split(",")?.length != 1 ? "s" : ""}
					</p>
				</div>

				{(windowSize.width ?? 0) < 640 ? (
					<></>
				) : (
					<div className="flex 2xl:flex-row flex-col items-center 2xl:gap-4 flex-1">
						<p>
							{(() => {
								const k = value.contact.mobile.number.match(
									/^(\d{3})(\d{3})(\d{4})$/,
								);
								if (!k) return "";
								return `${k[1]} ${k[2]} ${k[3]}`;
							})()}
						</p>
						<p className="text-gray-400">{value.contact.email.full}</p>
					</div>
				)}

				<div className="flex flex-col md:flex-row items-center">
					<p className="text-gray-400 flex flex-1 self-center items-center justify-self-center justify-center text-center">
						${value.balance} Credit
					</p>

					<p
						onClick={(v) => {
							v.preventDefault();

							clearSearchResults();
							setSearchFocused(false);
							setSearchType("products");

							setCustomerState(value);
						}}
						id="assign-to-cart"
						className="whitespace-nowrap justify-self-end pr-4 py-3"
					>
						Assign to cart
					</p>
				</div>
			</div>

			{index == searchResults.length - 1 ? (
				<></>
			) : (
				<hr className="border-gray-500" />
			)}
		</div>
	);
}
