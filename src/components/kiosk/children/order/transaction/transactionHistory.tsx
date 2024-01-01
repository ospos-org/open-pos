import { Order } from "@/generated/stock/Api";
import { transactionViewState } from "@atoms/transaction";
import OrderStatusIcon from "@components/kiosk/children/order/orderStatusIcon";
import { useAtomValue } from "jotai/index";
import moment from "moment/moment";
import Image from "next/image";
import Link from "next/link";

const FILTER =
	"invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)";

export default function TransactionHistory() {
	const activeTransaction = useAtomValue(
		transactionViewState.activeTransaction,
	);

	return (
		<div className="flex flex-col">
			{activeTransaction?.status_history.map((k, indx) => {
				const type = k.item.status.type;

				return (
					<div key={`${k.timestamp} ${k.item} ${k.reason}`}>
						{indx === 0 ? (
							<div className="h-4 w-[3px] rounded-sm rounded-b-none bg-gray-400 ml-5" />
						) : (
							<div className="h-4 w-[3px] bg-gray-400 ml-5" />
						)}

						<div className="flex flex-row items-center gap-4">
							<OrderStatusIcon type={type} />

							<div className="flex flex-row items-center justify-between flex-1">
								<div className="flex flex-col">
									<div className="flex flex-row items-center gap-2">
										<p className="text-white font-semibold">
											{type[0].toUpperCase()}
											{type.substring(1)}
										</p>
										<p className="text-gray-400 text-sm">
											{moment(k.timestamp).format("DD/MM/YY LT")}
										</p>
									</div>
									<p className="text-gray-400 font-semibold text-sm">
										{k.reason}
									</p>
								</div>

								{Boolean(type == "transit") && (
									<Link
										target="_blank"
										rel="noopener noreferrer"
										className={
											"bg-gray-800 rounded-md px-2 py-[0.125rem] " +
											"flex flex-row items-center gap-2 cursor-pointer"
										}
										href={
											k.item.status.type === "transit"
												? k.item.status.value.query_url +
												  k.item.status.value.tracking_code
												: "_blank"
										}
									>
										<p className="text-white">Track</p>

										<Image
											src="/icons/arrow-narrow-right.svg"
											alt="Redirect arrow"
											width={15}
											height={15}
											style={{ filter: FILTER }}
										/>
									</Link>
								)}
							</div>
						</div>

						{Boolean(indx != activeTransaction?.status_history.length - 1) && (
							<div className="h-4 w-[3px] bg-gray-400 ml-5"></div>
						)}
					</div>
				);
			})}
		</div>
	);
}
