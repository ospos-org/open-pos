import { SetStateAction } from "jotai";
import { debounce } from "lodash";
import Image from "next/image";
import {
	Dispatch,
	createRef,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";

import {
	Address,
	ContactInformation,
	Customer,
	CustomerInput,
} from "@/generated/stock/Api";
import { openStockClient } from "~/query/client";

interface CustomerLocationProps {
	workingCustomer: Customer | null;
	updateCustomer: Dispatch<SetStateAction<CustomerInput | null>>;
}

function CustomerLocation({
	workingCustomer,
	updateCustomer,
}: CustomerLocationProps) {
	const [suggestions, setSuggestions] = useState<Address[]>([]);
	const [searching, setSearching] = useState(false);
	const [loading, setLoading] = useState(false);

	const input_ref = createRef<HTMLInputElement>();

	const debouncedResults = useMemo(() => {
		return debounce(async (address: string) => {
			setLoading(true);

			const data = await openStockClient.helpers.suggestAddr(address);
			setSuggestions(data.data);

			setLoading(false);
		}, 250);
	}, [setLoading, setSuggestions]);

	useEffect(() => {
		return () => {
			debouncedResults.cancel();
		};
	}, [debouncedResults]);

	const verifiedAddress = useMemo(
		() => (
			<div className="flex flex-row items-start gap-4 px-2 py-4">
				<Image
					src="/icons/check-verified-02.svg"
					style={{
						filter:
							"invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)",
					}}
					className="mt-1"
					height={20}
					width={20}
					alt="Verified Address"
				/>

				<div className="text-white">
					<p className="font-semibold">
						{workingCustomer?.contact.address.street}
					</p>
					<p>{workingCustomer?.contact.address.street2}</p>
					<p className="text-gray-400">
						{workingCustomer?.contact.address.city}{" "}
						{workingCustomer?.contact.address.po_code}
					</p>
					<p className="text-gray-400">
						{workingCustomer?.contact.address.country}
					</p>
				</div>
			</div>
		),
		[workingCustomer],
	);

	const selectSuggestion = useCallback(
		(suggestion: Address) => {
			setSearching(false);

			updateCustomer({
				...(workingCustomer as Customer),
				contact: {
					...(workingCustomer?.contact as ContactInformation),
					address: suggestion,
				},
			});

			if (input_ref.current) input_ref.current.value = "";
		},
		[input_ref, updateCustomer, workingCustomer],
	);

	const suggestionsList = useMemo(
		() =>
			suggestions.map((k) => (
				<div
					onClick={() => selectSuggestion(k)}
					className="px-4 py-2 cursor-pointer hover:bg-gray-700 rounded-md"
					key={`${k.city}-${k.country}-${k.po_code}-${k.street}-${k.street2}`}
				>
					<p className="text-white font-semibold">
						{k.street.trim() === "0" ? "" : k.street} {k.street2} {k.po_code}
					</p>
					<p className="text-gray-400">
						{k.city} - {k.country}
					</p>
				</div>
			)),
		[selectSuggestion, suggestions],
	);

	const noAddress = useMemo(
		() => (
			<div className="flex items-center justify-center p-4 bg-gray-800 rounded-md">
				<p className="text-gray-400">No address loaded</p>
			</div>
		),
		[],
	);

	const noAddressFound = useMemo(
		() => (
			<div className="flex items-center justify-center p-4 bg-gray-800 rounded-md">
				<p className="text-gray-400">No valid addresses found</p>
			</div>
		),
		[],
	);

	const searchElement = useMemo(() => {
		if (searching && loading)
			return (
				<div className="flex items-center justify-center w-full h-full">
					<p className="text-gray-400 self-center">Loading...</p>
				</div>
			);
		if (searching)
			return suggestions.length > 0 ? suggestionsList : noAddressFound;

		return workingCustomer?.contact.address.street === ""
			? noAddress
			: verifiedAddress;
	}, [
		loading,
		noAddress,
		noAddressFound,
		searching,
		suggestions.length,
		suggestionsList,
		verifiedAddress,
		workingCustomer?.contact.address.street,
	]);

	return (
		<div className="flex-1 h-full gap-2">
			<div className="flex flex-col gap-1">
				<div className="flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 border-2 border-gray-700">
					<input
						autoComplete="off"
						ref={input_ref}
						placeholder="Address"
						defaultValue={workingCustomer?.contact.address.street}
						className="bg-transparent focus:outline-none text-white flex-1"
						onChange={(e) => debouncedResults(e.target.value)}
						onFocus={() => setSearching(true)}
						tabIndex={0}
					/>
				</div>
			</div>

			<div className={"flex flex-col gap-2 flex-1 py-2 bg-gray-800"}>
				{searchElement}
			</div>
		</div>
	);
}

export default CustomerLocation;
