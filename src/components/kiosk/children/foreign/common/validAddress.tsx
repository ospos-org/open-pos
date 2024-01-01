import { Customer, Store } from "@/generated/stock/Api";
import Image from "next/image";

interface ValidAddressProps {
	customerOrStore: Customer | Store | null;
}

export function ValidAddress({ customerOrStore }: ValidAddressProps) {
	return (
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
					{customerOrStore?.contact.address.street}
				</p>
				<p>{customerOrStore?.contact.address.street2}</p>
				<p className="text-gray-400">
					{customerOrStore?.contact.address.city}{" "}
					{customerOrStore?.contact.address.po_code}
				</p>
				<p className="text-gray-400">
					{customerOrStore?.contact.address.country}
				</p>
			</div>
		</div>
	);
}
