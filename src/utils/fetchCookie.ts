import { useAtomValue, useSetAtom } from "jotai";
import { activeEmployeeAtom, masterStateAtom, storeLookupTableAtom } from "../atoms/openpos";
import { OPEN_STOCK_URL } from "./environment";
import { Employee } from "./stockTypes";

const useFetchCookie = () => {
    const masterState = useAtomValue(masterStateAtom)

    const setStoreLut = useSetAtom(storeLookupTableAtom)
    const setUser = useSetAtom(activeEmployeeAtom)

    const query = (async function(rid: string, pass: string, callback: (password: string) => void) {
        fetch(`${OPEN_STOCK_URL}/employee/auth/rid/${rid}`, {
            method: "POST",
            body: JSON.stringify({
                pass: pass,
                kiosk_id: masterState.kiosk_id
            }),
            credentials: "include",
            redirect: "follow"
        }).then(async e => {
            if(e.ok) {
                fetch(`${OPEN_STOCK_URL}/employee/rid/${rid}`, {
                    method: "GET",
                    credentials: "include",
                    redirect: "follow"
                }).then(async k => {
                    if(k.ok) {
                        const employee: Employee[] = await k.json();
                        setUser(employee[0]);

                        fetch(`${OPEN_STOCK_URL}/store/`, {
                            method: "GET",
                            redirect: "follow",
                            credentials: "include"
                        }).then(async response => {
                            const data = await response.json();
                            setStoreLut(data);
                        })
        
                        callback(pass)
                    }
                })
            }
        })
    })
    
    return { query }
}

export default useFetchCookie