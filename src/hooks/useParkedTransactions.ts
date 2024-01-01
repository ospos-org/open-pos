import { Transaction } from "@/generated/stock/Api";
import { useCallback, useEffect, useState } from "react";
import { openStockClient } from "~/query/client";

const MINUTE_MS = 5_000;

const useParkedTransactions = () => {
	const [activeTransactions, setActiveTransactions] = useState<
		Transaction[] | null
	>(null);

	const repopulateTransactions = useCallback(() => {
		openStockClient.transaction
			.getAllSaved()
			.then((data) => setActiveTransactions(data.data));
	}, []);

	useEffect(() => {
		repopulateTransactions();
		const interval = setInterval(repopulateTransactions, MINUTE_MS);
		return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
	}, [repopulateTransactions]);

	return { activeTransactions };
};

export default useParkedTransactions;
