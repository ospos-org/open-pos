import Image from "next/image";
import {useAtom, useAtomValue} from "jotai/index";
import {probingPricePayableAtom} from "@atoms/payment";
import {createRef, useCallback, useMemo, useState} from "react";
import {defaultKioskAtom} from "@atoms/kiosk";

export function PayPrice() {
    const kioskState = useAtomValue(defaultKioskAtom)

    const [ probingPrice, setProbingPrice ] = useAtom(probingPricePayableAtom)
    const [ editPrice, setEditPrice ] = useState(false);

    const reference = createRef<HTMLInputElement>()

    const remainingDue = useMemo(() => {
        const totalPaid = kioskState.payment.reduce(function (prev, curr) {
            return prev + curr.amount.quantity
        }, 0);

        return (kioskState.order_total ?? 0) - totalPaid
    }, [kioskState.order_total, kioskState.payment])

    const submitPayment = useCallback(() => {
        const targetValue = reference.current?.value

        if (targetValue == "") {
            setEditPrice(false)
            setProbingPrice(kioskState.order_total)
        } else if (targetValue) {
            let p = parseFloat(targetValue);

            if (p < (kioskState.order_total ?? 0)) {
                setProbingPrice(p)
                setEditPrice(false)
            } else if (p == kioskState.order_total) {
                setEditPrice(false)
                setProbingPrice(kioskState.order_total)
            }
        }
    }, [kioskState.order_total, reference, setProbingPrice])

    const priceElement = useMemo(() => {
        if (editPrice)
            return (
                <input
                    autoFocus
                    ref={reference}
                    className="bg-transparent w-fit text-center outline-none font-semibold text-3xl text-white"
                    placeholder={remainingDue.toFixed(2)}
                    onBlur={submitPayment}
                    onKeyDown={(e) => {
                        if (e.key == "Enter") submitPayment()
                    }}
                />
            )

        return <p className="font-semibold text-3xl text-white">${probingPrice?.toFixed(2)}</p>
    }, [editPrice, probingPrice, reference, remainingDue, submitPayment])

    return (
        <div className="self-center flex flex-col items-center">
            <p className="text-gray-400 text-sm">TO PAY</p>

            {priceElement}

            {Boolean(remainingDue > 0) && <p className="text-gray-500">${remainingDue} remains</p>}

            <br/>

            <div
                onClick={() => setEditPrice(true)}
                className="self-center flex flex-row items-center gap-2 cursor-pointer p-2"
            >
                <Image
                    src="/icons/coins-stacked-03.svg" height={20} width={20}
                    alt="" className="text-white"
                    style={{
                        filter:
                            "invert(78%) sepia(15%) saturate(224%) hue-rotate(179deg) brightness(82%) contrast(84%)"
                    }}
                />

                <p className="text-gray-400">Split Payment</p>
            </div>
        </div>
    )
}