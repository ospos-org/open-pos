import Image from "next/image";
import { useState, FC } from "react";
import { applyDiscount, findMaxDiscount } from "./kiosk";
import { VariantInformation } from "./stock-types";

const DiscountMenu: FC<{ discountGroup: [{
        type: "absolute" | "percentage";
        product: VariantInformation | null;
        value: number;
        for: "cart" | "product";
        exclusive: boolean
    }, Function], callback: Function, multiple: boolean }> = ({ discountGroup, callback, multiple }) => {
    
    const [ discount, setDiscount ] = discountGroup;
    
    return (
        <>
            <div className="flex flex-col h-full gap-12 justify-center">
                <div className="self-center flex flex-col items-center justify-center">
                    <p className="text-gray-400 text-sm">DISCOUNT VALUE</p>

                    <div className={`flex flex-row items-center ${(applyDiscount((discount.product?.retail_price ?? 1), `${discount.type == "absolute" ? "a" : "p"}|${discount.value}`) * 1.15) < 0 ? "text-red-400" : "text-white"}  text-white`}>
                        <p className="text-2xl font-semibold">-{discount.type == "absolute" ? "$" : ""}</p>
                        <input style={{ width: ((discountGroup[0].value.toFixed(2).length ?? 1) + 'ch') }} autoFocus className="bg-transparent text-center outline-none font-semibold text-3xl" defaultValue={(discountGroup[0].value !== 0) ? (discountGroup[0].value).toFixed(2) : ""} placeholder={discountGroup[0].value.toFixed(2)}
                        onChange={(e) => {
                            e.target.style.width = ((e.target.value.length ?? 1) + 'ch');

                            let new_price = parseFloat(e.currentTarget.value);

                            // (new_price - GST) = new_pricing
                            // delta<marginal_price, new_pricing> = discount

                            setDiscount({
                                ...discount,
                                value: parseFloat(e.currentTarget.value) ?? 0
                            })
                        }}
                        onBlur={(e) => {
                            let possible = parseFloat(e.currentTarget.value);

                            if(isNaN(possible)) {
                                e.currentTarget.value = (0).toFixed(2)
                                e.target.style.width = ((4 - 0.5 ?? 1) + 'ch');
                            }else {
                                e.currentTarget.value = possible.toFixed(2)
                                e.target.style.width = (((possible.toFixed(2).length) - 0.5 ?? 1) + 'ch');
                            }
                        }}
                        ></input>
                        <p className="text-2xl font-semibold">{discount.type == "percentage" ? "%" : ""}</p>
                    </div> 
                </div>
                
                <div className="flex flex-row items-center gap-4 self-center">
                    <div
                        onClick={() => {
                            setDiscount({
                                ...discount,
                                type: "absolute"
                            })
                        }} 
                        className="self-center flex flex-row items-center gap-2 cursor-pointer p-2"
                    >
                        <Image src="/icons/minus-circle.svg" height={20} width={20} alt="" className="text-white" style={{ filter: discount.type == "absolute" ? "invert(100%) sepia(0%) saturate(0%) hue-rotate(107deg) brightness(109%) contrast(101%)" : "invert(78%) sepia(15%) saturate(224%) hue-rotate(179deg) brightness(82%) contrast(84%)" }} />
                        <p className={`${discount.type == "absolute" ? "text-white" : "text-gray-400"}`}>Absolute</p>
                    </div>

                    <div
                        onClick={() => {
                            setDiscount({
                                ...discount,
                                type: "percentage"
                            })
                        }} 
                        className="self-center flex flex-row items-center gap-2 cursor-pointer p-2"
                    >
                        <Image src="/icons/percent-03.svg" height={20} width={20} alt="" className="text-white" style={{ filter: discount.type == "percentage" ? "invert(100%) sepia(0%) saturate(0%) hue-rotate(107deg) brightness(109%) contrast(101%)" : "invert(78%) sepia(15%) saturate(224%) hue-rotate(179deg) brightness(82%) contrast(84%)" }} />
                        <p className={`${discount.type == "percentage" ? "text-white" : "text-gray-400"}`}>Percentage</p>
                    </div>
                </div>

                <div className="self-center flex-col items-center justify-center">
                    <div className="flex flex-row items-center gap-4">
                        <div className="flex flex-col items-center justify-center">
                            <p className="text-gray-400 text-sm">Original Price</p>
                            <p className="text-white">${((discount.product?.retail_price ?? 1) * 1.15).toFixed(2)}</p>
                        </div>

                        <Image src="/icons/arrow-narrow-right.svg" alt="right arrow" width={20} height={20} style={{ filter: "invert(78%) sepia(15%) saturate(224%) hue-rotate(179deg) brightness(82%) contrast(84%)" }}></Image>

                        <div className="flex flex-col items-center justify-center">
                            <p className="text-gray-400 text-sm">New Price</p>
                            <p className={`${(applyDiscount((discount.product?.retail_price ?? 1) * 1.15, `${discount.type == "absolute" ? "a" : "p"}|${discount.value}`) ) < 0 ? "text-red-400" : "text-white"} font-bold`}>${(applyDiscount((discount.product?.retail_price ?? 1) * 1.15, `${discount.type == "absolute" ? "a" : "p"}|${discount.value}`))?.toFixed(2)}</p>
                        </div>

                        <Image src="/icons/arrow-narrow-right.svg" alt="right arrow" width={20} height={20} style={{ filter: "invert(78%) sepia(15%) saturate(224%) hue-rotate(179deg) brightness(82%) contrast(84%)" }}></Image>

                        <div>
                            <p className="text-gray-400 text-sm">Discount</p>
                            <p className={`${(applyDiscount((discount.product?.retail_price ?? 1) * 1.15, `${discount.type == "absolute" ? "a" : "p"}|${discount.value}`) ) < 0 ? "text-red-400" : "text-white"}`}>${(applyDiscount((discount.product?.retail_price ?? 1) * 1.15, `${discount.type == "absolute" ? "a" : "p"}|${discount.value}`))?.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <br />
                    <hr className="bg-gray-600 border-gray-600" />
                    <br />

                    <div className="flex flex-row items-center gap-6 justify-center">
                        <div className="flex flex-col items-center justify-center">
                            <p className="text-gray-400 text-sm">GP</p>
                            <p className={`${((((applyDiscount((discount.product?.retail_price ?? 1) * 1.15, `${discount.type == "absolute" ? "a" : "p"}|${discount.value}`) ?? 1) - (discount.product?.marginal_price ?? 1)))) < 10 ? ((((applyDiscount((discount.product?.retail_price ?? 1) * 1.15, `${discount.type == "absolute" ? "a" : "p"}|${discount.value}`) ?? 1) - (discount.product?.marginal_price ?? 1))) * 100) < 0 ? "text-red-400" : "text-red-200" : "text-white"}`}>${((applyDiscount((discount.product?.retail_price ?? 1) * 1.15, `${discount.type == "absolute" ? "a" : "p"}|${discount.value}`) ?? 1) - (discount.product?.marginal_price ?? 1))?.toFixed(2)}</p>
                        </div>

                        <div className="flex flex-col items-center justify-center">
                            <p className="text-gray-400 text-sm">GP%</p>
                            <p className={`${((((applyDiscount((discount.product?.retail_price ?? 1) * 1.15, `${discount.type == "absolute" ? "a" : "p"}|${discount.value}`) ?? 1) - (discount.product?.marginal_price ?? 1)) / ((discount.product?.retail_price ?? 1) * 1.15)) * 100) < 10 ? ((((applyDiscount((discount.product?.retail_price ?? 1) * 1.15, `${discount.type == "absolute" ? "a" : "p"}|${discount.value}`) ?? 1) - (discount.product?.marginal_price ?? 1)) / ((discount.product?.retail_price ?? 1) * 1.15)) * 100) < 0 ? "text-red-400" : "text-red-200" : "text-white"}`}>{((((applyDiscount((discount.product?.retail_price ?? 1) * 1.15, `${discount.type == "absolute" ? "a" : "p"}|${discount.value}`) ?? 1) - (discount.product?.marginal_price ?? 1)) / ((discount.product?.retail_price ?? 1) * 1.15)) * 100).toFixed(2)}%</p>
                        </div>

                        <div className="flex flex-col items-center justify-center">
                            <p className="text-gray-400 text-sm">MP</p>
                            <p className="text-white">${((discount.product?.marginal_price ?? 1)).toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => {
                        setDiscount({
                            ...discount,
                            exclusive: !discount.exclusive
                        })
                    }} 
                    className="flex cursor-pointer select-none w-full items-center justify-center gap-2">
                    <p className="text-gray-400">Apply to only one</p>

                    {
                        !discount.exclusive ?
                        <Image src="/icons/square.svg" alt="selected" width={20} height={20}  style={{ filter: "invert(78%) sepia(15%) saturate(224%) hue-rotate(179deg) brightness(82%) contrast(84%)" }}></Image>
                        :
                        <Image src="/icons/check-square.svg" alt="selected" width={20} height={20}  style={{ filter: "invert(78%) sepia(15%) saturate(224%) hue-rotate(179deg) brightness(82%) contrast(84%)" }}></Image>
                    }
                </div>
            </div>

            <div className="flex flex-row items-center gap-4">
                <div 
                    onClick={() => {
                        setDiscount({
                            ...discount,
                            source: "user",
                            value: 0.00
                        })

                        callback({
                            ...discount,
                            source: "user",
                            value: 0.00
                        })
                    }}
                    className={`bg-gray-300 w-full rounded-md p-4 flex items-center justify-center cursor-pointer ${discount.value > 0 ? "" : "bg-opacity-10 opacity-20"}`}>
                    <p className="text-blue-500 font-semibold">Remove Discount</p>
                </div>

                <div
                    onClick={() => {
                        callback(discount)
                    }} 
                    className={`${multiple ? "bg-blue-700 cursor-pointer" : "bg-blue-700 bg-opacity-10 opacity-20"} w-full rounded-md p-4 flex items-center justify-center`}>
                    <p className={`text-white font-semibold ${""}`}>Apply Discount</p>
                </div>
            </div>
        </>
    )
}

export default DiscountMenu;