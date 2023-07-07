"use client";

import Kiosk from './kiosk'
import { createRef, useEffect, useState } from 'react'
import Image from "next/image"
import Inventory from './inventory';
import Job from './job';
import Deliverables from './deliverables';
import Incomings from './incomings';
import { Employee, MasterState } from './stock-types';
import {OPEN_STOCK_URL, useWindowSize} from "./helpers";

const ICON_SIZE = 30

export default function App() {
	const [ page, setPage ] = useState(0);
	const [ user, setUser ] = useState<Employee | null>(null);
	const [ codeInput, setCodeInput ] = useState<string[]>(["","","","", "", "", "", ""]);
	
	const [ masterState, setMasterState ] = useState<MasterState>({
		store_lut: [],
		store_id:  "628f74d7-de00-4956-a5b6-2031e0c72128", // "c4a1d88b-e8a0-4dcd-ade2-1eea82254816", //
		store_code: "001",
		store_contact: {
			name: "Torpedo7",
			mobile: {
				number: "+6421212120",
				valid: true
			},
			email: {
				root: "order",
				domain: "torpedo7.com",
				full: "order@torpedo7.com"
			},
			landline: "",
			address: {
				street: "9 Carbine Road",
				street2: "",
				city: "Auckland",
				country: "New Zealand",
				po_code: "100",
				lat: 100,
				lon: 100
			},
		},
		employee: user,
		kiosk: "A"
	});

	useEffect(() => {
		fetch(`${OPEN_STOCK_URL}/store/`, {
			method: "GET",
			redirect: "follow",
			credentials: "include"
		}).then(async b => {
			const data = await b.json();
			setMasterState(m => {
				return {
					...m,
					store_lut: data
				}
			})
		})
	}, []);

	useEffect(() => {
		setMasterState(m => {
			return {
				...m,
				employee: user
			}
		})
	}, [user])

	const [ authCookie, setAuthCookie ] = useState("");
	const [ lowModeCartOn, setLowModeCartOn ] = useState(false);
	const [ menuOpen, setMenuOpen ] = useState(false);

	useEffect(() => {
		setTimeout(function () {
			window.scrollTo(0, 1);
		  }, 1000);
	}, [])

	const fetch_cookie = async (rid: string, pass: string, callback: Function) => {
		fetch(`${OPEN_STOCK_URL}/employee/auth/rid/${rid}`, {
			method: "POST",
			body: JSON.stringify({
				pass: pass
			}),
			credentials: "include",
			redirect: "follow"
		}).then(async e => {
			if(e.ok) {
				const cookie = await e.text();
				setAuthCookie(cookie);
	
				fetch(`${OPEN_STOCK_URL}/employee/rid/${rid}`, {
					method: "GET",
					credentials: "include",
					redirect: "follow"
				}).then(async k => {
					if(k.ok) {
						const employee: Employee[] = await k.json();
						setUser(employee[0]);
		
						callback(pass)
					}
				})
			}
		})
	}

	const [ demoOverride, setDemoOverride ] = useState(false);

	// Handle user authentication and pass it to child elements.
	useEffect(() => {
		if(process.env.NEXT_PUBLIC_DEMO?.trim() == "True" && demoOverride == false) {
			setCodeInput(["1","2","3","2","1","2","3","2"])
			setDemoOverride(true)
		}

		// console.log("DEMO STATUS", process.env.NEXT_PUBLIC_DEMO?.trim() == "True", process.env.NEXT_PUBLIC_DEMO)

		if(codeInput[codeInput.length-1] != "" || process.env.NEXT_PUBLIC_DEMO?.trim() == "True") {
			const copy = [ ...codeInput ];
			const code_string = copy.join("");

            const rid = code_string.substring(0, 4);
            const pass = code_string.substring(4, 9);

            fetch_cookie(rid, pass, (pass: string) => {
				setInterval(() => fetch_cookie(rid, pass, () => {}), 9 * 60 * 1000)
			});
		}
	}, [codeInput, demoOverride])

	const input_ref = createRef<HTMLInputElement>();
    const windowSize = useWindowSize();

    return (
		<div className="flex flex-col max-h-screen overflow-hidden">
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

			{
				!user ? 
					<div className="fixed h-[100dvh] mt-[18px] min-h-[100dvh] max-h-[100dvh] w-screen min-w-full max-w-full bg-gray-800 z-50 flex flex-col items-center justify-center gap-8">
						<p className="font-mono text-gray-400 font-semibold">LOGIN</p>
						
						<div className="flex flex-row items-center gap-4 flex-wrap max-w-[240px] md:max-w-full">
							{
								codeInput.map((k,indx) => {
									return (((indx == codeInput.length-1 && k == "") || (k == "" && codeInput[indx+1] == "")) && (codeInput[indx-1] !== "" || indx == 0 || indx == codeInput.length)) ? 
									(
										<div key={`${indx}-INPUT+VAL`} className="select-none p-4 py-6 h-12 bg-white rounded-xl flex items-center justify-center font-bold border-blue-500 border-[3px] text-white font-mono">
											1
										</div>
									)
									:
									k ?
									(
										<div key={`${indx}-INPUT+VAL`} className="select-none p-4 py-6 h-12 bg-gray-700 rounded-xl flex items-center justify-center font-bold border-gray-500 border-[3px] text-gray-200 font-mono">
											{k}
										</div>
									)
									:
									(
										<div key={`${indx}-INPUT+VAL`} className="select-none p-4 py-6 h-12 bg-gray-700 rounded-xl flex items-center justify-center font-bold border-gray-500 border-[3px] text-gray-700 font-mono">
											1
										</div>
									)
								})
							}
						</div>

						<div className="flex flex-row flex-wrap max-w-[300px] items-center justify-center select-none gap-4 font-mono">
							{
								[1,2,3,4,5,6,7,8,9,"x",0,"b"].map(k => {
									return k == "x" ? 
									(
										<div key={`${k}-INPUT`} className="bg-transparent p-8 rounded-full h-10 w-10 flex items-center justify-center text-white text-2xl">
										</div>
									)
									: k == "b" ?
									(
										<div
											onClick={() => {
												const indx = codeInput.findIndex(b => b == "");

												console.log(indx, codeInput[indx]);

												if(indx >= 0) {
													let new_input = codeInput;
													new_input[indx-1] = "";
													setCodeInput([ ...new_input ]);
												}else {
													let new_input = codeInput;
													new_input[new_input.length-1] = "";
													setCodeInput([ ...new_input ]);
												}
											}} 
											key={`${k}-INPUT`} className="bg-transparent pl-6 pr-4 rounded-full flex items-center justify-center text-white text-2xl">
											<Image src="/icons/delete.svg" alt="" height={25} width={25} style={{ filter: "invert(74%) sepia(6%) saturate(486%) hue-rotate(179deg) brightness(87%) contrast(89%)" }} />
										</div>
									)
									:
									(
										<div
											onClick={() => {
												const indx = codeInput.findIndex(b => b == "");
												let new_input = codeInput;
												new_input[indx] = k.toString();

												setCodeInput([ ...new_input ]);
											}} 
											key={`${k}-INPUT`} 
											className="bg-gray-700 cursor-pointer p-10 rounded-3xl h-10 w-10 flex items-center justify-center text-white text-3xl">
											{k}
										</div>
									)
								})
							}
						</div>

						<input type="text" readOnly={true} className="bg-transparent outline-none text-gray-800" autoFocus ref={input_ref} onBlur={(e) => {e.currentTarget.focus()}} onKeyDown={(e) => {
							if(e.key == "Backspace") {
								const indx = codeInput.findIndex(b => b == "");

								console.log(indx, codeInput[indx]);

								if(indx >= 0) {
									let new_input = codeInput;
									new_input[indx-1] = "";
									setCodeInput([ ...new_input ]);
								}else {
									let new_input = codeInput;
									new_input[new_input.length-1] = "";
									setCodeInput([ ...new_input ]);
								}
							}else if(!isNaN(parseInt(e.key))) {
								const indx = codeInput.findIndex(b => b == "");
								let new_input = codeInput;
								new_input[indx] = (e.key).toString();
	
								setCodeInput([ ...new_input ]);
							}
						}} />
					</div>
				:
				<></>
			}

			<div className="flex flex-row sm:h-[calc(100dvh-18px)] h-[calc(100dvh-58px)] flex-shrink-0">
				{/* Menu Selector */}
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
				{/* Content for Menu */}
				<div className="bg-gray-800 flex flex-1 overflow-hidden">
					
					{
						(() => {
							switch(page) {
								case 0:
									return <Kiosk master_state={masterState} lowModeCartOn={lowModeCartOn} setLowModeCartOn={setLowModeCartOn} />
								case 1:
									return <Inventory />
								case 2:
									return <Job />
								case 3:
									return <Deliverables master_state={masterState} setLowModeCartOn={setLowModeCartOn} lowModeCartOn={lowModeCartOn} />
								case 4:
									return <Incomings master_state={masterState} setLowModeCartOn={setLowModeCartOn} lowModeCartOn={lowModeCartOn} />
								case 5:
									return <></>
								default:
									return <Kiosk master_state={masterState} lowModeCartOn={lowModeCartOn} setLowModeCartOn={setLowModeCartOn} />
							}
						})()
					}
					{/* Kiosk is one of the menus and acts as a filler until the method of navigation is determined. */}
				</div>
			</div>

			<div className="sm:hidden h-[40px] flex flex-row bg-black p-2 w-screen text-white justify-between z-10">
				<p className="flex-1 font-bold">OPENPOS</p>

				<Image onClick={() => {
					setMenuOpen(!menuOpen)
				}} width="20" height="20" src="/icons/menu-01.svg" className="select-none cursor-pointer flex-1" alt={''} draggable={false} />

				<Image onClick={() => {
					setLowModeCartOn(!lowModeCartOn)
				}} width="20" height="20" src={ !lowModeCartOn ? "/icons/corner-down-left.svg" : "/icons/corner-down-right.svg"} className="select-none cursor-pointer flex-1" alt={''} draggable={false} />
				
                {/* <p onClick={() => (true)}>OC</p> */}
            </div>
			
			{
				menuOpen && (windowSize.height ?? 0 <= 640) ? 
				<div 
					onClick={() => {
						setMenuOpen(false)
					}}
					className="bg-black h-[100vh] w-[100dw] min-h-[100vh] min-w-[100vw] top-0 fixed z-5 opacity-40"></div>
				:
				<></>
			}

			{
				menuOpen && (windowSize.height ?? 0 <= 640) ? 
				<div className="absolute z-50 bottom-0 mb-[40px] h-[440px] w-screen bg-black text-white h-80px rounded-t-md">
					<div className="flex flex-col p-8 h-full flex-shrink-0 gap-6">
						{/* Kiosk */}
						
						<div className="flex flex-row gap-4 items-center" onClick={() => { setPage(0); setMenuOpen(false); setLowModeCartOn(false) }}>
							{
								page == 0 ?
								<Image className="select-none svg cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/shopping-bag-01-filled.svg" alt="" style={{ filter: "invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)" }}></Image>
								:	
								<Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/shopping-bag-01.svg" style={{ filter: "invert(61%) sepia(16%) saturate(286%) hue-rotate(175deg) brightness(90%) contrast(90%)" }} alt={''}></Image>
							}

							<p className={`font-bold ${page == 0 ? "" : "text-gray-300"}`}>Cart</p>
						</div>

						{/* Inventory / Order Search */}
						<div className="flex flex-row gap-4 items-center" onClick={() => { setPage(1); setMenuOpen(false); setLowModeCartOn(false) }}>
							{
								page == 1 ?
								<Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/cube-01-filled.svg" style={{ filter: "invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)" }}  alt={''}></Image>
								:	
								<Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/cube-outline.svg" style={{ filter: "invert(61%) sepia(16%) saturate(286%) hue-rotate(175deg) brightness(90%) contrast(90%)" }} alt={''}></Image>
							}

							<p className={`font-bold ${page == 1 ? "" : "text-gray-300"}`}>Inventory</p>
						</div>
						
						{/* Job Calendar - Place to-do-jobs */}
						<div className="flex flex-row gap-4 items-center" onClick={() => { setPage(2); setMenuOpen(false); setLowModeCartOn(false) }}>
							{
								page == 2 ?
								<Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/calendar-filled.svg" style={{ filter: "invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)" }} alt={''}></Image>
								:	
								<Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/calendar.svg" style={{ filter: "invert(61%) sepia(16%) saturate(286%) hue-rotate(175deg) brightness(90%) contrast(90%)" }} alt={''}></Image>
							}

							<p className={`font-bold ${page == 2 ? "" : "text-gray-300"}`}>Calendar</p>
						</div>
						

						{/* Deliverables - Deliveries and Outgoing Orders */}
						<div className="flex flex-row gap-4 items-center" onClick={() => { setPage(3); setMenuOpen(false); setLowModeCartOn(false) }}>
							{
								page == 3 ?
								<Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/arrow-square-up-right-filled.svg" alt={''}></Image>
								:	
								<Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/arrow-square-up-right.svg" alt={''}></Image>
							}

							<p className={`font-bold ${page == 3 ? "" : "text-gray-300"}`}>Deliverables</p>
						</div>

						
						{/* Incomings - Incoming Orders */}
						<div className="flex flex-row gap-4 items-center" onClick={() => { setPage(4); setMenuOpen(false); setLowModeCartOn(false) }}>
							{
								page == 4 ?
								<Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/arrow-square-down-right-filled.svg" alt={''}></Image>
								:	
								<Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/arrow-square-down-right.svg" alt={''}></Image>
							}

							<p className={`font-bold ${page == 4 ? "" : "text-gray-300"}`}>Incomings</p>
						</div>
						
						<div className="flex flex-row gap-4 items-center" onClick={() => { setPage(5); setMenuOpen(false); setLowModeCartOn(false) }}>
							{
								page == 5 ?
								<Image className="select-none" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/settings-04-filled.svg" alt={''}></Image>
								:	
								<Image className="select-none" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/settings-04.svg" alt={''}></Image>
							}

							<p className={`font-bold ${page == 5 ? "" : "text-gray-300"}`}>Settings</p>
						</div>
					</div>	
				</div>
				:
				<></>
			}
			
		</div>
	)
}