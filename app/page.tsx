import Image from 'next/image'
import Kiosk from './kiosk'
import styles from './page.module.css'

export default function Home() {
	return (
		<div>
			{/* Menu Selector */}
			<div></div>
			{/* Content for Menu */}
			<div>
				{/* Kiosk is one of the menus and acts as a filler until the method of navigation is determined. */}
				<Kiosk></Kiosk>
			</div>
		</div>
	)
}