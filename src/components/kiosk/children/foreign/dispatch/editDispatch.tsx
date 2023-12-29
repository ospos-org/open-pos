import Image from "next/image";
import {openStockClient} from "~/query/client";
import {useAtom} from "jotai/index";
import {customerAtom} from "@atoms/customer";
import {createRef, useCallback, useEffect, useMemo, useState} from "react";
import {Address, Customer, HttpResponse} from "@/generated/stock/Api";
import {debounce, DebouncedFunc} from "lodash";

interface EditDispatchProps {
    callback: (data: HttpResponse<Customer, any>) => void,
}

export default function EditDispatch({ callback }: EditDispatchProps) {
    const [ customerState, setCustomerState ] = useAtom(customerAtom);

    const [ searching, setSearching ] = useState(false);
    const [ loading, setLoading ] = useState(false);
    const [ suggestions, setSuggestions ] = useState<Address[]>([]);

    const input_ref = createRef<HTMLInputElement>();

    const save = useCallback(() => {
        if (!loading) {
            setLoading(true);

            if (customerState?.id && customerState?.contact)
                openStockClient.customer.updateContactInfo(customerState.id, customerState.contact)
                    .then(callback)
        }
    }, [callback, customerState, loading])

    const debouncedResults = useMemo(() => {
        return debounce(async (address: string) => {
            setLoading(true);

            const suggestions = await openStockClient.helpers.suggestAddr(address)

            setSuggestions(suggestions.data ?? []);
            setLoading(false);
        }, 250);
    }, []);

    useEffect(() => {
        return () => {
            debouncedResults.cancel();
        };
    });

    return (
        <div className="flex flex-col gap-8 flex-1 overflow-auto">
            <div className="flex flex-col gap-2">
                <p className="text-white font-semibold">Contact Information</p>

                <div className="flex flex-col gap-1">
                    <p className="text-gray-400 pb-0 mb-0">Customer Name</p>
                    <div
                        className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                        <input
                            placeholder="Customer Name" defaultValue={customerState?.contact.name}
                            className="bg-transparent focus:outline-none text-white flex-1"
                            onChange={(e) => {
                                if (customerState)
                                    setCustomerState({
                                        ...customerState,
                                        contact: {
                                            ...customerState.contact,
                                            name: e.target.value
                                        }
                                    })
                            }}
                            tabIndex={0}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <p className="text-gray-400">Phone Number</p>
                    <div
                        className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                        <input
                            placeholder="Phone Number" defaultValue={customerState?.contact.mobile.number}
                            className="bg-transparent focus:outline-none text-white flex-1"
                            onChange={(e) => {
                                if (customerState)
                                    setCustomerState({
                                        ...customerState,
                                        contact: {
                                            ...customerState.contact,
                                            mobile: {
                                                valid: true,
                                                number: e.target.value
                                            }
                                        }
                                    })
                            }}
                            tabIndex={0}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <p className="text-gray-400">Email Address</p>
                    <div
                        className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                        <input
                            placeholder="Email Address" defaultValue={customerState?.contact.email.full}
                            className="bg-transparent focus:outline-none text-white flex-1"
                            onChange={(e) => {
                                if (customerState)
                                    setCustomerState({
                                        ...customerState,
                                        contact: {
                                            ...customerState.contact,
                                            email: {
                                                root: e.target.value.split("@")[0],
                                                domain: e.target.value.split("@")[1],
                                                full: e.target.value
                                            }
                                        }
                                    })
                            }}
                            tabIndex={0}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col flex-1 gap-2 rounded-md">
                <p className="text-white font-semibold">Shipping Details</p>

                <div className="flex-1 h-full">
                    <div className="flex flex-col gap-1">
                        <div
                            className="flex flex-row items-center p-4 rounded-sm
                            bg-gray-700 gap-4 border-2 border-gray-700"
                        >
                            <input
                                autoComplete="off"
                                ref={input_ref}
                                placeholder="Address" defaultValue={customerState?.contact.address.street}
                                className="bg-transparent focus:outline-none text-white flex-1"
                                onChange={(e) => debouncedResults(e.target.value)}
                                onFocus={() => setSearching(true)}
                                tabIndex={0}
                            />
                        </div>
                    </div>

                    <div className={`flex flex-col gap-2 flex-1 px-2 py-2 ${Boolean(searching) && "bg-gray-800"}`}>
                        {
                            searching ?
                                loading ?
                                    <div className="flex items-center justify-center w-full h-full">
                                        <p className="text-gray-400 self-center">Loading...</p>
                                    </div>
                                    :
                                    suggestions.map(k => {
                                        return (
                                            <div
                                                onClick={() => {
                                                    setSearching(false);

                                                    if (customerState) {
                                                        setCustomerState({
                                                            ...customerState,
                                                            contact: {
                                                                ...customerState.contact,
                                                                address: k,
                                                            }
                                                        })
                                                    }

                                                    input_ref.current ? input_ref.current.value = "" : {}
                                                }}
                                                className="px-4 py-2 cursor-pointer hover:bg-gray-700 rounded-md"
                                                key={`${k.city}-${k.country}-${k.po_code}-${k.street}-${k.street2}`}>
                                                <p className="text-white font-semibold">{k.street.trim() == "0" ? "" : k.street} {k.street2} {k.po_code}</p>
                                                <p className="text-gray-400">{k.city} - {k.country}</p>
                                            </div>
                                        )
                                    })
                                :
                                <div className="flex flex-row items-start gap-4 px-2 py-4">
                                    <Image src="/icons/check-verified-02.svg"
                                           style={{filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)"}}
                                           className="mt-1" height={20} width={20} alt="Verified Address"/>

                                    <div className="text-white">
                                        <p className="font-semibold">{customerState?.contact.address.street}</p>
                                        <p>{customerState?.contact.address.street2}</p>
                                        <p className="text-gray-400">{customerState?.contact.address.city} {customerState?.contact.address.po_code}</p>
                                        <p className="text-gray-400">{customerState?.contact.address.country}</p>
                                    </div>
                                </div>
                        }
                    </div>
                </div>
            </div>

            <div
                onClick={save}
                className={`${!loading 
                    ? "bg-blue-700 cursor-pointer" 
                    : "bg-blue-700 bg-opacity-10 opacity-20"
                } w-full rounded-md p-4 flex items-center justify-center`}
            >
                <p className="text-white font-semibold">{loading ? "Saving..." : "Save"}</p>
            </div>
        </div>
    )
}