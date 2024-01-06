import { useAtom } from "jotai";
import Image from "next/image";
import { RefObject } from "react";

import { passwordInputAtom } from "@atoms/openpos";

export function PasswordInput({
	inputRef,
}: { inputRef: RefObject<HTMLInputElement> }) {
	const [codeInput, setCodeInput] = useAtom(passwordInputAtom);

	return (
		<div className="fixed h-[100dvh] mt-[18px] min-h-[100dvh] max-h-[100dvh] w-screen min-w-full max-w-full bg-gray-800 z-50 flex flex-col items-center justify-center gap-8">
			<p className="font-mono text-gray-400 font-semibold">LOGIN</p>

			<div className="flex flex-row items-center gap-4 flex-wrap max-w-[240px] md:max-w-full">
				{codeInput.map((k, indx) => {
					return ((indx === codeInput.length - 1 && k === "") ||
						(k === "" && codeInput[indx + 1] === "")) &&
						(codeInput[indx - 1] !== "" ||
							indx === 0 ||
							indx === codeInput.length) ? (
						<div
							key={`${indx}-INPUT+VAL`}
							className="select-none p-4 py-6 h-12 bg-white rounded-xl flex items-center justify-center font-bold border-blue-500 border-[3px] text-white font-mono"
						>
							1
						</div>
					) : k ? (
						<div
							key={`${indx}-INPUT+VAL`}
							className="select-none p-4 py-6 h-12 bg-gray-700 rounded-xl flex items-center justify-center font-bold border-gray-500 border-[3px] text-gray-200 font-mono"
						>
							{k}
						</div>
					) : (
						<div
							key={`${indx}-INPUT+VAL`}
							className="select-none p-4 py-6 h-12 bg-gray-700 rounded-xl flex items-center justify-center font-bold border-gray-500 border-[3px] text-gray-700 font-mono"
						>
							1
						</div>
					);
				})}
			</div>

			<div className="flex flex-row flex-wrap max-w-[300px] items-center justify-center select-none gap-4 font-mono">
				{[1, 2, 3, 4, 5, 6, 7, 8, 9, "x", 0, "b"].map((k) => {
					return k === "x" ? (
						<div
							key={`${k}-INPUT`}
							className="bg-transparent p-8 rounded-full h-10 w-10 flex items-center justify-center text-white text-2xl"
						/>
					) : k === "b" ? (
						<div
							onClick={() => {
								const indx = codeInput.findIndex((b) => b === "");

								if (indx >= 0) {
									const new_input = codeInput;
									new_input[indx - 1] = "";
									setCodeInput([...new_input]);
								} else {
									const new_input = codeInput;
									new_input[new_input.length - 1] = "";
									setCodeInput([...new_input]);
								}
							}}
							key={`${k}-INPUT`}
							className="bg-transparent pl-6 pr-4 rounded-full flex items-center justify-center text-white text-2xl"
						>
							<Image
								src="/icons/delete.svg"
								alt=""
								height={25}
								width={25}
								style={{
									filter:
										"invert(74%) sepia(6%) saturate(486%) hue-rotate(179deg) brightness(87%) contrast(89%)",
								}}
							/>
						</div>
					) : (
						<div
							onClick={() => {
								const indx = codeInput.findIndex((b) => b === "");
								const new_input = codeInput;
								new_input[indx] = k.toString();

								setCodeInput([...new_input]);
							}}
							key={`${k}-INPUT`}
							className="bg-gray-700 cursor-pointer p-10 rounded-3xl h-10 w-10 flex items-center justify-center text-white text-3xl"
						>
							{k}
						</div>
					);
				})}
			</div>

			<input
				type="text"
				readOnly={true}
				autoFocus
				className="bg-transparent outline-none text-gray-800"
				ref={inputRef}
				onBlur={(e) => {
					e.currentTarget.focus();
				}}
				onKeyDown={(e) => {
					if (e.key === "Backspace") {
						const indx = codeInput.findIndex((b) => b === "");

						if (indx >= 0) {
							const new_input = codeInput;
							new_input[indx - 1] = "";
							setCodeInput([...new_input]);
						} else {
							const new_input = codeInput;
							new_input[new_input.length - 1] = "";
							setCodeInput([...new_input]);
						}
					} else if (!Number.isNaN(parseInt(e.key))) {
						const indx = codeInput.findIndex((b) => b === "");
						const new_input = codeInput;
						new_input[indx] = e.key.toString();

						setCodeInput([...new_input]);
					}
				}}
			/>
		</div>
	);
}
