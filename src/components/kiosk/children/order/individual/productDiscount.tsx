import Image from "next/image";

export function ProductDiscount() {
    return (
        <div className="flex flex-row items-center gap-2">
            <Image
                onClick={() => {
                    // setKioskPanel("discount");
                    // setDiscount({
                    //     ...stringValueToObj(findMaxDiscount(e.discount, e.product_cost, false)[0].value),
                    //     product: e.variant_information,
                    //     for: "product",
                    //     exclusive: false
                    // })
                }}
                style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }} height={20} width={20} alt="Discount" className="select-none rounded-sm hover:cursor-pointer" src="/icons/sale-03.svg" 
                onMouseOver={(e) => {
                    e.currentTarget.style.filter = "invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.filter = "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
                }}
            ></Image>
        </div>
    )
}