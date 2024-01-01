import { OrderStatus } from "@/generated/stock/Api";
import Image from "next/image";

interface OrderStatusIconProps {
	type: OrderStatus["type"];
}

export default function OrderStatusIcon({ type }: OrderStatusIconProps) {
	return (
		<div
			className={`${
				type == "queued"
					? "bg-gray-600"
					: type == "processing"
					  ? "bg-yellow-600"
					  : type == "transit" || type == "instore"
						  ? "bg-blue-600"
						  : type == "failed"
							  ? "bg-red-600"
							  : "bg-green-600"
			} h-11 w-11 flex items-center justify-center rounded-full`}
		>
			{(() => {
				switch (type) {
					case "queued":
						return (
							<div>
								<Image
									src="/icons/clock.svg"
									alt=""
									height={22}
									width={22}
									style={{
										filter:
											"invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)",
									}}
								/>
							</div>
						);
					case "transit":
						return (
							<div>
								<Image
									src="/icons/truck-01.svg"
									alt=""
									height={22}
									width={22}
									style={{
										filter:
											"invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)",
									}}
								/>
							</div>
						);
					case "processing":
						return (
							<div>
								<Image
									src="/icons/loading-01.svg"
									alt=""
									height={22}
									width={22}
									style={{
										filter:
											"invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)",
									}}
								/>
							</div>
						);
					case "fulfilled":
						return (
							<div>
								<Image
									src="/icons/check-verified-02.svg"
									alt=""
									height={22}
									width={22}
									style={{
										filter:
											"invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)",
									}}
								/>
							</div>
						);
					case "instore":
						return (
							<div>
								<Image
									src="/icons/building-02.svg"
									alt=""
									height={22}
									width={22}
									style={{
										filter:
											"invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)",
									}}
								/>
							</div>
						);
					case "failed":
						return (
							<div>
								<Image
									src="/icons/x-circle.svg"
									alt=""
									height={22}
									width={22}
									style={{
										filter:
											"invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)",
									}}
								/>
							</div>
						);
					default:
						return <div></div>;
				}
			})()}
		</div>
	);
}
