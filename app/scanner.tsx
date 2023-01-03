import { KeyboardEvent, useState } from 'react'
import BarcodeReader from 'react-barcode-reader'

export const ReactBarcodeReader = ({ onScan, onError }: { onScan: Function, onError: Function }) => {
	const [str, setStr] = useState<string>('')

	function handleReceive(scanData: KeyboardEvent<HTMLInputElement>) {
		const key = scanData.key

		// if it's enter key then perform onScan
		if (key === 'Enter' && onScan && str.length > 0) {
			onScan(str)
			setStr('')
		} else {
			setStr(str + key)
		}
	}
  
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