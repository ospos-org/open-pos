"use client";

import Kiosk from './kiosk'
import { useState } from 'react'
import { Home } from 'react-feather';
import Image from "next/image"

export default function App() {
	const [ page, setPage ] = useState(0);

	return (
		<div className="flex flex-row h-screen">
			{/* Menu Selector */}
			<div className="bg-gray-900 flex flex-col p-4 h-full gap-4">
				<Image width="25" height="25" src="/icons/home.svg" alt={''}></Image>
				<br />
				<Image width="25" height="25" src="/icons/search.svg" alt={''}></Image>
				<Image width="25" height="25" src="/icons/list.svg" alt={''}></Image>
				<br />
				<Image width="25" height="25" src="/icons/deliverables.svg" alt={''}></Image>
				<Image width="25" height="25" src="/icons/incomings.svg" alt={''}></Image>
			</div>
			{/* Content for Menu */}
			<div>
				{
					(() => {
						switch(page) {
							case 0:
								return <Kiosk></Kiosk>
							default:
								return <Kiosk></Kiosk>
						}
					})()
				}
				{/* Kiosk is one of the menus and acts as a filler until the method of navigation is determined. */}
			</div>
		</div>
	)
}