"use client";

import { createRef, useEffect, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'

import { activeEmployeeAtom, availableTerminalsAtom, mobileMenuOpenAtom, passwordInputAtom } from '@atoms/openpos';
import { useWindowSize } from '@hooks/useWindowSize';
import { MobileNavigationElement } from '@/src/components/common/mobileNavigationElement';
import { DesktopNavigationElement } from '@/src/components/common/desktopNavigationElement';
import { ContentSwitcher } from '@/src/components/common/contentSwitcher';
import { MobileMenu } from '@/src/components/common/mobileMenu';
import { POSBanner } from '@/src/components/common/posBanner';
import { PasswordInput } from '@/src/components/common/passwordInput';
import useFetchCookie from '@/src/utils/fetchCookie';
import { Toaster } from 'sonner';
import config from '@/src/payment/config';

export default function App() {
	const user = useAtomValue(activeEmployeeAtom);

	const setActiveTerminals = useSetAtom(availableTerminalsAtom)	

	const [ demoOverride, setDemoOverride ] = useState(false);
	const [ codeInput, setCodeInput ] = useAtom(passwordInputAtom);
	const [ menuOpen, setMenuOpen ] = useAtom(mobileMenuOpenAtom);

	const input_ref = createRef<HTMLInputElement>();
    const windowSize = useWindowSize();
	const { query } = useFetchCookie()

	useEffect(() => {
		// OnMount
		config.get_terminals().then(terminals => {
			if (!terminals.error) {
				setActiveTerminals(terminals.value)
				console.log("set: ", terminals.value)
			}
		})
	}, [setActiveTerminals])

	// Handle user authentication and pass it to child elements.
	useEffect(() => {
		if(process.env.NEXT_PUBLIC_DEMO?.trim() == "True" && demoOverride == false) {
			setCodeInput(["1","2","3","2","1","2","3","2"])
			setDemoOverride(true)
		}

		if(codeInput[codeInput.length-1] != "" || process.env.NEXT_PUBLIC_DEMO?.trim() == "True") {
			const copy = [ ...codeInput ];
			const code_string = copy.join("");

            const rid = code_string.substring(0, 4);
            const pass = code_string.substring(4, 9);

			query(rid, pass, (password: string) => {
				// Refetch every 9 minutes. Expires every 10
				// setInterval(() => query(rid, password, () => {}), 9 * 60 * 1000)
			})
		}
	}, [codeInput])

    return (
		<div className="flex flex-col max-h-screen overflow-hidden">
			<POSBanner />

			<Toaster position="top-center" />

			{ !user && <PasswordInput inputRef={input_ref} />	}

			<div className="flex flex-row sm:h-[calc(100dvh-18px)] h-[calc(100dvh-58px)] flex-shrink-0">
				{/* Menu Selector */}
				<DesktopNavigationElement />

				{/* Content for Menu */}
				<ContentSwitcher />	
			</div>

			<MobileMenu />	
			
			{
				menuOpen && (windowSize.height ?? 0 <= 640) && (
					<>
						<div 
							onClick={() => { setMenuOpen(false) }} 
							className="bg-black h-[100vh] w-[100dw] min-h-[100vh] min-w-[100vw] top-0 fixed z-5 opacity-40"
							>
						</div>

						<MobileNavigationElement />
					</>
				)
			}
		</div>
	)
}