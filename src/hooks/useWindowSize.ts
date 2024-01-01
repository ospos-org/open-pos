import { useEffect, useState } from "react";

export function useWindowSize() {
	const [windowSize, setWindowSize] = useState<{
		width: number | undefined;
		height: number | undefined;
	}>({
		width: undefined,
		height: undefined,
	});

	useEffect(() => {
		function handleResize() {
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		}

		window.addEventListener("resize", handleResize);
		handleResize();

		// Remove event listener on cleanup
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return windowSize;
}
