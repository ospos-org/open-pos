import { Address, Store } from "@/generated/stock/Api";
import { useMemo } from "react";

interface StoreSuggestions {
	type: "store";
	suggestions: Store[];
	callback: (value: Store) => void;
}

interface AddressSuggestions {
	type: "raw";
	suggestions: Address[];
	callback: (value: Address) => void;
}

interface AddressSuggestionProps {
	value: StoreSuggestions | AddressSuggestions;
}

interface IndividualAddressProps {
	callback: () => void;
	value: Address;
	name?: string;
}

function formatKeyFromAddr(addr: Address) {
	return `${addr.city}-${addr.country}-${addr.po_code}-${addr.street}-${addr.street2}`;
}

function IndividualAddress({ callback, value, name }: IndividualAddressProps) {
	return (
		<div
			onClick={callback}
			className="px-4 py-2 cursor-pointer hover:bg-gray-700 rounded-md"
		>
			{Boolean(name) && (
				<div className="text-white font-semibold inline-flex">{name}</div>
			)}
			<p className="font-normal text-gray-400">
				{value.street.trim() === "0" ? "" : value.street} {value.street2}{" "}
				{value.po_code}
			</p>
			<p className="text-gray-400">
				{value.city} - {value.country}
			</p>
		</div>
	);
}

export function AddressSuggestions({ value }: AddressSuggestionProps) {
	if (value.suggestions.length === 0) {
		return (
			<div className="flex h-full items-center justify-center rounded-md">
				<p className="text-gray-200">No suggestions</p>
			</div>
		);
	}

	if (value.type === "raw") {
		return (
			<>
				{value.suggestions.map((addr) => (
					<IndividualAddress
						key={formatKeyFromAddr(addr)}
						value={addr}
						callback={() => value.callback(addr)}
					/>
				))}
			</>
		);
	}

	return (
		<>
			{value.suggestions.map((store) => (
				<IndividualAddress
					key={formatKeyFromAddr(store.contact.address)}
					value={store.contact.address}
					callback={() => value.callback(store)}
					name={store?.name}
				/>
			))}
		</>
	);
}
