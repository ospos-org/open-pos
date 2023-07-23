import { searchInputRefAtom } from '@/src/atoms/kiosk'
import { searchFocusedAtom, searchTypeAtom } from '@/src/atoms/search'
import { useAtomValue, useSetAtom } from 'jotai'
import { RefObject, useCallback, useState } from 'react'
import BarcodeReader from 'react-barcode-reader'

interface ReactBarcodeReaderProps { 
	onScan: (searchString: string) => void, 
}

export const ReactBarcodeReader = ({ onScan }: ReactBarcodeReaderProps) => {
	const [str, setStr] = useState<string>('')
	const inputRef = useAtomValue(searchInputRefAtom)

	const setSearchFocused = useSetAtom(searchFocusedAtom)
	const setSearchType = useSetAtom(searchTypeAtom)

	const handleReceive = useCallback((scanData: { key: string }) => {
		const key = scanData.key

		// if it's enter key then perform onScan
		if (key === 'Enter' && onScan && str.length > 0) {
			setSearchFocused(false);
			inputRef.current?.value ? inputRef.current.value = str : {};

			setSearchType("products");

			onScan(str)
			setStr('')
		} else {
			setStr(str + key)
		}
	}, [onScan, inputRef, setSearchFocused, setSearchType, str])
  
    return (
		<BarcodeReader
			onKeyDetect={(e: any) => {
				e.preventDefault();

				if(e.key == "Enter") {
					setStr('')
				}
			}}
			onScan={(e: any) => {
				handleReceive(e)
			}}
			minLength={0}
			preventDefault
			stopPropagation
			timeBeforeScanTest={50}
		/>
    )
}