"use client";

import { createRef, useEffect, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'

import {activeEmployeeAtom, availableTerminalsAtom, loginAuthAtom, passwordInputAtom} from '@atoms/openpos';
import { POSBanner } from '@/src/components/common/posBanner';
import { PasswordInput } from '@/src/components/common/passwordInput';
import {cookieAtom} from '@/src/utils/fetchCookie';
import { Toaster } from 'sonner';
import config from '@/src/payment/config';
import {ContentPage} from "@components/ContentPage";

export default function App() {
	const user = useAtomValue(activeEmployeeAtom);

	const setActiveTerminals = useSetAtom(availableTerminalsAtom)
	const setAuthInfo = useSetAtom(loginAuthAtom)
	const activateCookie = useSetAtom(cookieAtom)

	const [ demoOverride, setDemoOverride ] = useState(false);
	const [ codeInput, setCodeInput ] = useAtom(passwordInputAtom);

	const input_ref = createRef<HTMLInputElement>();

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
		if(process.env.NEXT_PUBLIC_DEMO?.trim() == "True" && !demoOverride) {
			setCodeInput(["1","2","3","2","1","2","3","2"])
			setDemoOverride(true)
		}

		if(codeInput[codeInput.length-1] != "" || process.env.NEXT_PUBLIC_DEMO?.trim() == "True") {
			const copy = [ ...codeInput ];
			const code_string = copy.join("");

            const rid = code_string.substring(0, 4);
            const pass = code_string.substring(4, 9);

			setAuthInfo([rid, pass])
			void activateCookie()
		}
	}, [activateCookie, codeInput, demoOverride, setAuthInfo, setCodeInput])

    return (
		<div className="flex flex-col max-h-screen overflow-hidden">
			<POSBanner />

			<Toaster position="top-center" />

			{!user ? (
				<PasswordInput inputRef={input_ref} />	
			) : (
				<ContentPage />
			)}
		</div>
	)
}
