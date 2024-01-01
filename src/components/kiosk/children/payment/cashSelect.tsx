import { useEffect, useState } from "react";

export default function CashSelect({
	totalCost,
	changeCallback,
}: { totalCost: number; changeCallback: Function }) {
	const [degreeOption, setDegreeOption] = useState(-1);
	const [selectedValue, setSelectedValue] = useState(totalCost);

	useEffect(() => {
		changeCallback(selectedValue, degreeOption);
	}, [selectedValue, degreeOption, changeCallback]);

	return (
		<div className="flex flex-col gap-12 items-center justify-center flex-1">
			<div className="flex flex-col items-center justify-center">
				<p className="text-gray-200">Total Cost</p>
				<p className="text-white text-4xl font-bold">
					${totalCost?.toFixed(2)}
				</p>
			</div>

			<hr className="border-blue-300 bg-blue-300 w-5/6" />

			<div className="flex flex-col gap-2 items-center">
				<p className="text-gray-200">Cash Options</p>
				{/* Rounding to the nearest currency give-ables */}

				<div className="flex flex-row gap-6 flex-wrap items-center justify-center">
					{/* For countries with 1c accuracy */}
					<p
						onClick={() => {
							setDegreeOption(0);
							setSelectedValue(totalCost);
						}}
						className={`select-none text-2xl font-bold ${
							degreeOption == 0 ? "bg-blue-400 text-white" : "text-blue-100"
						} px-2 py-1 rounded-sm cursor-pointer`}
					>
						${totalCost?.toFixed(2)}
					</p>

					{/* For countries with 10c accuracy */}
					<p
						onClick={() => {
							setDegreeOption(1);
							setSelectedValue(
								parseFloat((Math.ceil(totalCost * 10) / 10).toFixed(1) + "0"),
							);
						}}
						className={`select-none text-2xl font-bold ${
							degreeOption == 1 ? "bg-blue-400 text-white" : "text-blue-100"
						} px-2 py-1 rounded-sm cursor-pointer`}
					>
						${(Math.ceil(totalCost * 10) / 10).toFixed(1) + "0"}
					</p>

					{/* For countries with $1 accuracy */}
					<p
						onClick={() => {
							setDegreeOption(2);
							setSelectedValue(parseFloat(totalCost?.toFixed(0) + ".00"));
						}}
						className={`select-none text-2xl font-bold ${
							degreeOption == 2 ? "bg-blue-400 text-white" : "text-blue-100"
						} px-2 py-1 rounded-sm cursor-pointer`}
					>
						${totalCost?.toFixed(0)}.00
					</p>

					{/* Payments with $5 accuracy */}
					<p
						onClick={() => {
							setDegreeOption(3);
							setSelectedValue(Math.ceil(totalCost / 5) * 5);
						}}
						className={`select-none text-2xl font-bold ${
							degreeOption == 3 ? "bg-blue-400 text-white" : "text-blue-100"
						} px-2 py-1 rounded-sm cursor-pointer`}
					>
						${(Math.ceil(totalCost / 5) * 5)?.toFixed(0)}.00
					</p>

					{/* Payments with $10 accuracy */}
					<p
						onClick={() => {
							setDegreeOption(4);
							setSelectedValue(Math.ceil(totalCost / 10) * 10);
						}}
						className={`select-none text-2xl font-bold ${
							degreeOption == 4 ? "bg-blue-400 text-white" : "text-blue-100"
						} px-2 py-1 rounded-sm cursor-pointer`}
					>
						${(Math.ceil(totalCost / 10) * 10)?.toFixed(0)}.00
					</p>

					{/* Payments with $100 accuracy */}
					<p
						onClick={() => {
							setDegreeOption(5);
							setSelectedValue(Math.ceil(totalCost / 100) * 100);
						}}
						className={`select-none text-2xl font-bold ${
							degreeOption == 5 ? "bg-blue-400 text-white" : "text-blue-100"
						} px-2 py-1 rounded-sm cursor-pointer`}
					>
						${(Math.ceil(totalCost / 100) * 100)?.toFixed(0)}.00
					</p>
				</div>
			</div>

			<br />

			<div className="flex flex-col gap-2 items-center">
				<p className="text-gray-200">Tendered Change</p>
				{/* Rounding to the nearest currency give-ables */}

				<p className="text-white text-4xl font-bold">
					${Math.abs(totalCost - selectedValue)?.toFixed(2)}
				</p>
			</div>
		</div>
	);
}
