import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";

import { activeEmployeeAtom, masterStateAtom, storeLookupTableAtom } from "@atoms/openpos";
import { Employee } from "./stockTypes";
import queryOs from "./query-os";

const useFetchCookie = () => {
    const masterState = useAtomValue(masterStateAtom)

    const setStoreLut = useSetAtom(storeLookupTableAtom)
    const setUser = useSetAtom(activeEmployeeAtom)

    const query = useCallback(async function(rid: string, pass: string, callback: (password: string) => void) {
        queryOs(`employee/auth/rid/${rid}`, {
            method: "POST",
            body: JSON.stringify({
                pass: pass,
                kiosk_id: masterState.kiosk_id
            }),
            credentials: "include",
            redirect: "follow"
        }).then(async e => {
            if(e.ok) {
                queryOs(`employee/rid/${rid}`, {
                    method: "GET",
                    credentials: "include",
                    redirect: "follow"
                }).then(async k => {
                    if(k.ok) {
                        const employee: Employee[] = await k.json();
                        setUser(employee[0]);

                        queryOs(`store/`, {
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
    }, [masterState.kiosk_id, setStoreLut, setUser])
    
    return { query }
}

export default useFetchCookie