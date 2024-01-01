import { useAtomValue } from "jotai";

import {
	inspectingTransactionAtom,
	transactionViewState,
} from "@atoms/transaction";

import { NoteElement } from "@components/common/noteElement";
import TransactionHistory from "@components/kiosk/children/order/transaction/transactionHistory";
import TransactionProductList from "@components/kiosk/children/order/transaction/transactionProductList";
import TransactionRefundItems from "@components/kiosk/children/order/transaction/transactionRefundItems";
import TransactionTitle from "@components/kiosk/children/order/transaction/transactionTitle";

export default function TransactionMenu() {
	const transaction = useAtomValue(inspectingTransactionAtom);
	const activeTransaction = useAtomValue(
		transactionViewState.activeTransaction,
	);

	if (!transaction) return <></>;

	return (
		<div className="flex flex-col gap-8">
			{/* Transaction Title (Customer Name, Order Number, ...) */}
			<TransactionTitle />

			{/* Transaction History */}
			<TransactionHistory />

			{/* Product List */}
			<TransactionProductList />

			{/* Refund Selected */}
			<TransactionRefundItems />

			<div className="flex flex-col gap-2">
				<p className="text-gray-400">NOTES</p>

				{(activeTransaction?.order_notes?.length ?? 0) < 1 ? (
					<div className="flex flex-1 items-center justify-center">
						<p className="text-gray-400">No notes attached to order.</p>
					</div>
				) : (
					activeTransaction?.order_notes.map((e) => (
						<NoteElement
							note={e}
							key={`${e.author} ${e.message} - ${e.timestamp}`}
						/>
					))
				)}
			</div>
		</div>
	);
}
