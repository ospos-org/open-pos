import Image from "next/image";

export default function Kiosk() {
    return (
        <>
            <div className="flex flex-col justify-between h-screen min-h-screen flex-1">
                <div className="flex flex-col p-4 gap-4">
                    <div className="flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4">
                        <Image width="20" height="20" src="/icons/search-sm.svg" alt={''}></Image>
                        <input placeholder="Search" className="bg-transparent focus:outline-none text-white flex-1"/>
                        <Image width="20" height="20" src="/icons/scan.svg" alt={''}></Image>
                    </div>
                    <div className="flex flex-1 flex-row flex-wrap gap-4 ">
                        {/* Tiles */}
                        <div className="flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 min-w-[300px] rounded-md text-white max-w-fit">
                            <Image width="25" height="25" src="/icons/user-check-01.svg" style={{ filter: "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)" }} alt={''}></Image>
                            <p className="font-medium">Select Customer</p>
                        </div>

                        <div className="flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 min-w-[300px] rounded-md text-white max-w-fit">
                            <Image width="25" height="25" src="/icons/truck-01.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                            <p className="font-medium">Custom Shipping</p>
                        </div>

                        <div className="flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 min-w-[300px] rounded-md text-white max-w-fit">
                            <Image width="25" height="25" src="/icons/sticker-square.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                            <p className="font-medium">Edit Note</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-row items-center border-t-2 border-gray-600">
                    {/* Active Orders */}
                    <div className="flex flex-row items-center gap-4 p-4 text-white border-r-2 border-gray-600">
                        <div className="bg-fuchsia-100 text-black p-2 px-[0.7rem] rounded-md font-bold">LK</div>
                        <div className="flex flex-col">
                            <h3>Leslie K.</h3>
                            <div className="flex flex-row items-center gap-[0.2rem]">
                                <p className="text-sm">6 items</p>
                                <p className="text-gray-400 text-sm">&#8226; Kiosk 5</p>
                            </div>
                        </div>
                        <br />
                        <Image width="25" height="25" src="/icons/expand-04.svg" alt={''}></Image>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 min-w-[500px] max-w-[500px] p-6">
                <div className="flex flex-col gap-4">
                    {/* Order Information */}
                    <div className="text-white">
                        <h2 className="font-semibold text-lg">Carl Sagan</h2>
                        <p className="text-sm text-gray-400">3 items</p>
                    </div>

                    <hr className="border-gray-400 opacity-25"/>

                    <div className="text-white">
                        <div className="flex flex-row items-center gap-4">
                            <div className="relative">
                                <Image height={60} width={60} quality={100} alt="Torq Surfboard" className="rounded-sm" src="https://www.torpedo7.co.nz/images/products/F1S8DN512XX_zoom---2017-surfboard-6ft-6in-fish---white.jpg?v=81b1f5068df74b648797"></Image>

                                <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[30px] min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">2</div>
                            </div>
                            
                            <div className="flex-1">
                                <p className="font-semibold">Torq Surfboard</p>
                                <p className="text-sm text-gray-400">White, 6{'\"'}6{'\''}</p>
                            </div>

                            <div>
                                <p className="">$1539.98</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}