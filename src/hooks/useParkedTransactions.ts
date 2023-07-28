import { useEffect, useState } from "react";
import { OPEN_STOCK_URL } from "../utils/environment";
import { Transaction } from "../utils/stockTypes";

const MINUTE_MS = 5_000;

const useParkedTransactions = () => {
    const [ activeTransactions, setActiveTransactions ] = useState<Transaction[] | null>(null);

    useEffect(() => {
        fetch(`${OPEN_STOCK_URL}/transaction/saved`, {
            method: "GET",
            credentials: "include",
            redirect: "follow"
        }).then(async k => {
            if(k.ok) {
                const data: Transaction[] = await k.json();

                setActiveTransactions(data)
            }
        })
        
        const interval = setInterval(() => {
            fetch(`${OPEN_STOCK_URL}/transaction/saved`, {
                method: "GET",
                credentials: "include",
                redirect: "follow"
            }).then(async k => {
                if(k.ok) {
                    const data: Transaction[] = await k.json();

                    setActiveTransactions(data)
                }
            })
        }, MINUTE_MS);

        return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
    }, [])

    return { activeTransactions }
}

export default useParkedTransactions