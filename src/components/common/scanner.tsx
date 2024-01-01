import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useState } from "react";
import BarcodeReader from "react-barcode-reader";

import { searchFocusedAtom, searchTypeHandlerAtom } from "@atoms/search";

interface ReactBarcodeReaderProps {
	onScan: (searchString: string) => void;
}

export const ReactBarcodeReader = ({ onScan }: ReactBarcodeReaderProps) => {
	const [str, setStr] = useState<string>("");

	const setSearchFocused = useSetAtom(searchFocusedAtom);
	const setSearchType = useSetAtom(searchTypeHandlerAtom);

	const handleReceive = useCallback(
		(scanData: { key: string }) => {
			const key = scanData.key;

			// if it's enter key then perform onScan
			if (key === "Enter" && onScan && str.length > 0) {
				setSearchFocused(false);
				setSearchType("products");

				onScan(str);
				setStr("");
			} else {
				setStr(str + key);
			}
		},
		[onScan, setSearchFocused, setSearchType, str],
	);

	return (
		<BarcodeReader
			onKeyDetect={(e: any) => {
				e.preventDefault();

				if (e.key == "Enter") {
					setStr("");
				}
			}}
			onScan={(e: any) => {
				handleReceive(e);
			}}
			minLength={0}
			preventDefault
			stopPropagation
			timeBeforeScanTest={50}
		/>
	);
};
