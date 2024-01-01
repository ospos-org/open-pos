import { mobileLowModeAtom, mobileMenuOpenAtom } from "@/src/atoms/openpos";
import { useAtom } from "jotai";
import Image from "next/image";

export function MobileMenu() {
	const [lowModeCartOn, setLowModeCartOn] = useAtom(mobileLowModeAtom);
	const [menuOpen, setMenuOpen] = useAtom(mobileMenuOpenAtom);

	return (
		<div className="sm:hidden h-[40px] flex flex-row bg-black p-2 w-screen text-white justify-between z-10">
			<p className="flex-1 font-bold">OPENPOS</p>

			<Image
				onClick={() => {
					setMenuOpen(!menuOpen);
				}}
				width="20"
				height="20"
				src="/icons/menu-01.svg"
				className="select-none cursor-pointer flex-1"
				alt={""}
				draggable={false}
			/>

			<Image
				onClick={() => {
					setLowModeCartOn(!lowModeCartOn);
				}}
				width="20"
				height="20"
				src={
					!lowModeCartOn
						? "/icons/corner-down-left.svg"
						: "/icons/corner-down-right.svg"
				}
				className="select-none cursor-pointer flex-1"
				alt={""}
				draggable={false}
			/>
		</div>
	);
}
