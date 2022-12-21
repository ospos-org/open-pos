"use client";

import Kiosk from './kiosk'
import { useEffect, useState } from 'react'
import { Home } from 'react-feather';
import Image from "next/image"
import Inventory from './inventory';
import Job from './job';
import Deliverables from './deliverables';
import Incomings from './incomings';

const ICON_SIZE = 30

export default function App() {
	const [ page, setPage ] = useState(0);
	const [ masterState, setMasterState ] = useState({
		store_id: "001"
	});

	const [ authCookie, setAuthCookie ] = useState("");

	const fetch_cookie = async () => {
		fetch('http://127.0.0.1:8000/employee/auth/228333fa-29fb-43f4-8322-36ecf6960702', {
			method: "POST",
			body: JSON.stringify({
				pass: "1232"
			}),
			credentials: "include",
			redirect: "follow"
		}).then(async e => {
			const cookie = await e.text();
			console.log(cookie);
			setAuthCookie(cookie);

			// document.cookie = `key=${cookie.replace("\"", "")};Path=/;SameSite=\"None\";Secure=True`;
		})
	}

	// Handle user authentication and pass it to child elements.
	useEffect(() => {
		fetch_cookie().then(() => {
			setInterval(fetch_cookie, 9 * 60 * 1000)
		})
	}, []);

	return (
		<div className="flex flex-col">
			<div className="bg-black h-[18px] flex flex-row justify-between items-center px-2 gap-8">
				<div className="flex flex-row gap-2 items-center">
					<p className="text-xs text-white font-bold">OPENPOS</p>
				</div>

				<div className="flex flex-row gap-8 items-center">
					<div className="flex w-fit flex-row gap-2 items-center"> 
						<p className="text-xs text-white font-bold">ONLINE</p>
						<div className="h-2 w-2 bg-green-500 rounded-full"></div>
					</div>
					
					<div className="flex w-fit flex-row gap-2 items-center"> 
						<p className="text-xs text-white font-bold">PRINTER</p>
						<div className="h-2 w-2 bg-green-500 rounded-full"></div>
					</div>

					<div className="flex w-fit flex-row gap-2 items-center"> 
						<p className="text-xs text-white font-bold">TERMINAL</p>
						<div className="h-2 w-2 bg-green-500 rounded-full"></div>
					</div>

					<div className="flex w-fit flex-row gap-2 items-center"> 
						<p className="text-xs text-white font-bold">KIOSK</p>
						<div className="text-xs text-green-500 font-bold">A</div>
					</div>

					<div className="flex w-fit flex-row gap-2 items-center"> 
						<p className="text-xs text-white font-bold">STORE</p>
						<div className="text-xs text-green-500 font-bold">001</div>
					</div>
				</div>				
			</div>

			<div className="flex flex-row h-[calc(100vh-18px)] flex-shrink-0">
				{/* Menu Selector */}
				<div className="bg-gray-900 flex flex-col p-4 h-full justify-between items-center">
					<div className="flex flex-col h-full gap-12 items-center">
						{/* Kiosk */}
						{
							page == 0 ?
							<Image className="svg" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/shopping-bag-01-filled.svg" alt="" onClick={() => setPage(0)}></Image>
							:	
							<Image width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/shopping-bag-01.svg" alt={''} onClick={() => setPage(0)}></Image>
						}

						<div className="flex flex-col gap-4">	
							{/* Inventory / Order Search */}
							{
								page == 1 ?
								<Image width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/cube-01-filled.svg" style={{ filter: "invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)" }}  alt={''} onClick={() => setPage(1)}></Image>
								:	
								<Image width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/cube-outline.svg" style={{ filter: "invert(61%) sepia(16%) saturate(286%) hue-rotate(175deg) brightness(90%) contrast(90%)" }} alt={''} onClick={() => setPage(1)}></Image>
							}
							
							{/* Job Calender - Place to-do-jobs */}
							{
								page == 2 ?
								<Image width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/calendar-filled.svg" style={{ filter: "invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)" }} alt={''} onClick={() => setPage(2)}></Image>
								:	
								<Image width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/calendar.svg" style={{ filter: "invert(61%) sepia(16%) saturate(286%) hue-rotate(175deg) brightness(90%) contrast(90%)" }} alt={''} onClick={() => setPage(2)}></Image>
							}
						</div>

						<div className="flex flex-col gap-4">	
							{/* Deliverables - Deliveries and Outgoing Orders */}
							{
								page == 3 ?
								<Image width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/arrow-square-up-right-filled.svg" alt={''} onClick={() => setPage(3)}></Image>
								:	
								<Image width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/arrow-square-up-right.svg" alt={''} onClick={() => setPage(3)}></Image>
							}
							
							{/* Incomings - Incoming Orders */}
							{
								page == 4 ?
								<Image width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/arrow-square-down-right-filled.svg" alt={''} onClick={() => setPage(4)}></Image>
								:	
								<Image width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/arrow-square-down-right.svg" alt={''} onClick={() => setPage(4)}></Image>
							}
						</div>
					</div>
					
					<div>
						{
							page == 5 ?
							<Image width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/settings-04-filled.svg" alt={''} onClick={() => setPage(5)}></Image>
							:	
							<Image width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/settings-04.svg" alt={''} onClick={() => setPage(5)}></Image>
						}
					</div>
				</div>
				{/* Content for Menu */}
				<div className="bg-gray-800 flex flex-1">
					{
						(() => {
							switch(page) {
								case 0:
									return <Kiosk master_state={masterState} />
								case 1:
									return <Inventory />
								case 2:
									return <Job />
								case 3:
									return <Deliverables />
								case 4:
									return <Incomings />
								case 5:
									return <Kiosk master_state={masterState} />
								default:
									return <Kiosk master_state={masterState} />
							}
						})()
					}
					{/* Kiosk is one of the menus and acts as a filler until the method of navigation is determined. */}
				</div>
			</div>

		</div>
		
	)
}