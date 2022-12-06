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

	// Handle user authentication and pass it to child elements.
	useEffect(() => {})

	return (
		<div className="flex flex-row h-screen flex-shrink-0">
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
							<Image width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/cube-01-filled.svg" alt={''} onClick={() => setPage(1)}></Image>
							:	
							<Image width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/cube-outline.svg" alt={''} onClick={() => setPage(1)}></Image>
						}
						
						{/* Job Calender - Place to-do-jobs */}
						{
							page == 2 ?
							<Image width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/calendar-filled.svg" alt={''} onClick={() => setPage(2)}></Image>
							:	
							<Image width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/calendar.svg" alt={''} onClick={() => setPage(2)}></Image>
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
								return <Kiosk />
							case 1:
								return <Inventory />
							case 2:
								return <Job />
							case 3:
								return <Deliverables />
							case 4:
								return <Incomings />
							case 5:
								return <Kiosk />
							default:
								return <Kiosk />
						}
					})()
				}
				{/* Kiosk is one of the menus and acts as a filler until the method of navigation is determined. */}
			</div>
		</div>
	)
}