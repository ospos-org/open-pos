import { activeEmployeeAtom, masterStateAtom, passwordInputAtom } from '@/src/atoms/openpos';
import { useWindowSize } from '@hooks/useWindowSize';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

export function POSBanner() {
    const masterState = useAtomValue(masterStateAtom)
    const setCodeInput = useSetAtom(passwordInputAtom)
    const [ user, setUser ] = useAtom(activeEmployeeAtom)

    const windowSize = useWindowSize();

    return (
        <div className={`${process.env.NEXT_PUBLIC_DEMO?.trim()== "True" ? "bg-[#f70]" : "bg-black"} h-[18px] flex flex-row justify-between items-center px-2 sm:gap-8 gap-0`}>
            <div className="flex flex-row gap-2 items-center" onClick={() => {
                setUser(null);
                setCodeInput(["","","","","","","",""])
            }}>
                {
                    (windowSize.width ?? 0) < 640 ?
                        <div className="flex w-fit flex-row gap-2 items-center">
                            <p className="text-xs text-white font-bold">{user?.name?.first?.toUpperCase()} {user?.name?.last?.toUpperCase()}</p>
                        </div>
                    :
                        <p className="text-xs text-white font-bold hidden sm:flex">OPENPOS</p>
                }
            </div>

            {
                process.env.NEXT_PUBLIC_DEMO?.trim() == "True" ? 
                    <p className="text-xs text-white font-bold hidden sm:flex">DEMO</p> 
                : 
                    <></>
            }

            <div className="flex flex-row sm:gap-8 gap-2 items-center">
                {
                    (windowSize.width ?? 0) < 640 ?
                        <></>
                    :
                        <div className="flex w-fit flex-row gap-2 items-center">
                            <p className="text-xs text-white font-bold">{user?.name?.first?.toUpperCase()} {user?.name?.last?.toUpperCase()}</p>
                        </div>
                }

                <div className="flex w-fit flex-row gap-2 items-center">
                    {
                        (windowSize.width ?? 0) < 640 ?
                        <>
                            <p className="text-xs text-green-500 font-bold">ONL</p>
                        </>
                        :
                        <>
                            <p className="text-xs text-white font-bold">ONLINE</p>
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        </>
                    }
                </div>
                
                <div className="flex w-fit flex-row gap-2 items-center">
                    {
                        (windowSize.width ?? 0) < 640 ?
                        <>
                        <p className="text-xs text-green-500 font-bold">PRIN</p>
                        </>
                        :
                        <>
                        <p className="text-xs text-white font-bold">PRINTER</p>
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        </>
                    }
                </div>

                <div className="flex w-fit flex-row gap-2 items-center">
                    {
                        (windowSize.width ?? 0) < 640 ?
                        <>
                            <p className="text-xs text-green-500 font-bold">TERM</p>
                        </>
                        :
                        <>
                            <p className="text-xs text-white font-bold">TERMINAL</p>
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        </>
                    }
                </div>

                <div className="flex w-fit flex-row gap-2 items-center">
                    {
                        (windowSize.width ?? 0) < 640 ?
                        <></>
                        :
                        <p className="text-xs text-white font-bold">KIOSK</p>
                    }
                    <div className="text-xs text-green-500 font-bold">{masterState.kiosk}</div>
                </div>

                <div className="flex w-fit flex-row gap-2 items-center">
                    {
                        (windowSize.width ?? 0) < 640 ?
                        <></>
                        :
                        <p className="text-xs text-white font-bold">STORE</p>
                    }
                    <div className="text-xs text-green-500 font-bold">{masterState.store_code}</div>
                </div>
            </div>
        </div>
    )
}