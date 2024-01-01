import { useEffect, useState } from "react";

import { Employee, Note } from "@/generated/stock/Api";
import { openStockClient } from "~/query/client";

export function NoteElement({ note }: { note: Note }) {
	const [author, setAuthor] = useState<Employee | null>(null);

	useEffect(() => {
		openStockClient.employee
			.get(note.author)
			.then((data) => setAuthor(data.data));
	}, [setAuthor, note.author]);

	return (
		<div
			className="flex flex-row items-center w-full justify-between gap-6"
			key={`${note.timestamp}-${note.message}`}
		>
			<div className="flex flex-col">
				<p className="text-gray-400 font-bold">
					{author?.name?.first} {author?.name?.last}
				</p>
				<p className="text-gray-600 text-sm">
					{new Date(note.timestamp)
						.toLocaleDateString("en-US", {
							weekday: "short",
							year: "numeric",
							month: "numeric",
							day: "numeric",
						})
						.split(",")
						.join(" ")}
				</p>
			</div>
			<p className="text-white w-full flex-1 font-semibold">{note.message}</p>
		</div>
	);
}
