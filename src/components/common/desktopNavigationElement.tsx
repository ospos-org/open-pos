import { useAtom, useAtomValue } from "jotai";
import Image from "next/image";

import { ICON_SIZE } from "@utils/utils";
import { activeEmployeeAtom, masterStateAtom, pageAtom } from "@atoms/openpos";
import { useCallback, useEffect, useState } from "react";
import queryOs from "@/src/utils/query-os";
import { Attendant, History } from "@/src/utils/stockTypes";
import { Skeleton } from "./skeleton";
import { toast } from "sonner";

export function DesktopNavigationElement() {
    // 0: Not set, 1: Out, 2: In, 3: Pending
    const [ clockedOut, setClockedOut ] = useState<0 | 1 | 2 | 3>(0)

    const employee = useAtomValue(activeEmployeeAtom)
    const kiosk = useAtomValue(masterStateAtom)
    const [ page, setPage ] = useAtom(pageAtom)

    useEffect(() => {
        queryOs(`employee/log/${employee?.id}`, {
            method: "GET",
            credentials: "include",
            redirect: "follow"
        }).then(async data => {
            if (!data.ok) return;

            const value: History<Attendant> = await data.json()

            if(value.item.track_type === "in") {
                setClockedOut(2)
            }else {
                setClockedOut(1)
            }
        })
    }, [employee?.id])

    const toggleClockStatus = useCallback(() => {
        toast.promise(queryOs(`employee/log/${employee?.id}`, {
            method: "POST",
            credentials: "include",
            redirect: "follow",
            body: JSON.stringify({
                kiosk: kiosk.kiosk_id,
                reason: "User-Requested Change",
                in_or_out: clockedOut === 1 ? "in" : "out"
            })
        }).then(async data => {
            if (!data.ok) {
                throw data.status
            }

            setClockedOut(clockedOut === 1 ? 2 : 1)
        }), {
            loading: `Clocking ${clockedOut === 1 ? "in" : "out"}...`,
            error: `Failed to clock ${clockedOut === 1 ? "in" : "out"}.`,
            success: `Clocked ${clockedOut === 1 ? "in" : "out"} successfully.`
        })
    }, [clockedOut, employee?.id, kiosk.kiosk_id])

    return (
        <div className="hidden md:flex bg-gray-900 flex-col p-4 h-full justify-between items-center flex-shrink-0">
            <div className="flex flex-col h-full gap-12 items-center">
                {/* Kiosk */}
                {
                    page == 0 ?
                    <Image className="select-none svg cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/shopping-bag-01-filled.svg" alt="" style={{ filter: "invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)" }} onClick={() => setPage(0)}></Image>
                    :	
                    <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/shopping-bag-01.svg" style={{ filter: "invert(61%) sepia(16%) saturate(286%) hue-rotate(175deg) brightness(90%) contrast(90%)" }} alt={''} onClick={() => setPage(0)}></Image>
                }

                <div className="flex flex-col gap-4">	
                    {/* Inventory / Order Search */}
                    {/* {
                        page == 1 ?
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/cube-01-filled.svg" style={{ filter: "invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)" }}  alt={''} onClick={() => setPage(1)}></Image>
                        :	
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/cube-outline.svg" style={{ filter: "invert(61%) sepia(16%) saturate(286%) hue-rotate(175deg) brightness(90%) contrast(90%)" }} alt={''} onClick={() => setPage(1)}></Image>
                    } */}
                    
                    {/* Job Calendar - Place to-do-jobs */}
                    {/* {
                        page == 2 ?
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/calendar-filled.svg" style={{ filter: "invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)" }} alt={''} onClick={() => setPage(2)}></Image>
                        :	
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/calendar.svg" style={{ filter: "invert(61%) sepia(16%) saturate(286%) hue-rotate(175deg) brightness(90%) contrast(90%)" }} alt={''} onClick={() => setPage(2)}></Image>
                    } */}
                </div>

                <div className="flex flex-col gap-4">	
                    {/* Deliverables - Deliveries and Outgoing Orders */}
                    {
                        page == 3 ?
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/arrow-square-up-right-filled.svg" alt={''} onClick={() => setPage(3)}></Image>
                        :	
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/arrow-square-up-right.svg" alt={''} onClick={() => setPage(3)}></Image>
                    }
                    
                    {/* Incomings - Incoming Orders */}
                    {
                        page == 4 ?
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/arrow-square-down-right-filled.svg" alt={''} onClick={() => setPage(4)}></Image>
                        :	
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/arrow-square-down-right.svg" alt={''} onClick={() => setPage(4)}></Image>
                    }
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div>
                    {
                        clockedOut > 0 ?
                            clockedOut === 1 ? 
                            <Image className="select-none cursor-pointer text-black" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/alarm-clock-minus.svg" alt={''} onClick={toggleClockStatus}></Image>
                            :	
                            <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/alarm-clock-plus.svg" alt={''} onClick={toggleClockStatus}></Image>
                        :
                            <Skeleton className="h-6 w-6 opacity-20"></Skeleton>
                    }
                </div>

                <div>
                    {
                        page == 5 ?
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/settings-04-filled.svg" alt={''} onClick={() => setPage(5)}></Image>
                        :	
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/settings-04.svg" alt={''} onClick={() => setPage(5)}></Image>
                    }
                </div>
            </div> 
        </div>
    )
}