import { useAtom, useSetAtom } from "jotai";
import Image from "next/image";

import { mobileLowModeAtom, mobileMenuOpenAtom, pageAtom } from "@atoms/openpos";
import { ICON_SIZE } from "@/app/page";

export function DesktopNavigationElement() {
    const setLowModeCartOn = useSetAtom(mobileLowModeAtom)
    const setMenuOpen = useSetAtom(mobileMenuOpenAtom)

    const [ page, setPage ] = useAtom(pageAtom)

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
                    {
                        page == 1 ?
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/cube-01-filled.svg" style={{ filter: "invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)" }}  alt={''} onClick={() => setPage(1)}></Image>
                        :	
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/cube-outline.svg" style={{ filter: "invert(61%) sepia(16%) saturate(286%) hue-rotate(175deg) brightness(90%) contrast(90%)" }} alt={''} onClick={() => setPage(1)}></Image>
                    }
                    
                    {/* Job Calendar - Place to-do-jobs */}
                    {
                        page == 2 ?
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/calendar-filled.svg" style={{ filter: "invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)" }} alt={''} onClick={() => setPage(2)}></Image>
                        :	
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/calendar.svg" style={{ filter: "invert(61%) sepia(16%) saturate(286%) hue-rotate(175deg) brightness(90%) contrast(90%)" }} alt={''} onClick={() => setPage(2)}></Image>
                    }
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
            
            <div>
                {
                    page == 5 ?
                    <Image className="select-none" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/settings-04-filled.svg" alt={''} onClick={() => setPage(5)}></Image>
                    :	
                    <Image className="select-none" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/settings-04.svg" alt={''} onClick={() => setPage(5)}></Image>
                }
            </div>
        </div>
    )
}