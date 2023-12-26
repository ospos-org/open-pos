import Image from "next/image";

export default function NegativeStockWarning() {
    return (
        <div className="flex mt-4 relative flex-row items-center p-1 bg-orange-900 rounded-md gap-2">
            <div
                className={
                    "absolute top-[-14px] left-[-7px] bg-orange-600 px-2 py-1 " +
                    "flex-1 h-fit rounded-md flex flex-row items-center gap-1"
                }
            >
                <Image
                    src="/icons/alert-triangle.svg"
                    style={{
                        filter:
                            "invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)"
                    }}
                   height={15} width={15} alt=""
                />

                <p className="text-white font-bold text-xs">WARNING</p>
            </div>

            <p className="text-red-200 p-2 text-xs">
                This cart contains products with negative stock levels, proceed with caution.
            </p>
        </div>
    )
}