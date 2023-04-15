import { debounce } from "lodash";
import { customAlphabet } from "nanoid";
import Image from "next/image";
import { createRef, FC, useEffect, useMemo, useState } from "react";
import { json } from "stream/consumers";
import { v4 } from "uuid";
import { getDate } from "./kiosk";
import { Address, ContactInformation, Customer, DbOrder, DbProductPurchase, Employee, Order, ProductPurchase, StockInfo, Store, VariantInformation } from "./stock-types";
import {OPEN_STOCK_URL} from "./helpers";

const CustomerMenu: FC<{ defaultValue: Customer | null, create: boolean, setCustomerState: Function, setPadState: Function, setActiveCustomer: Function, activeCustomer: Customer | null }> = ({ defaultValue, setCustomerState, setPadState, create, setActiveCustomer, activeCustomer }) => {
    const [ pageState, setPageState ] = useState("origin");
    const [ loading, setLoading ] = useState(false);
    const [ searching, setSearching ] = useState(false);
    const [ suggestions, setSuggestions ] = useState<Address[]>([]);
    const [ error, setError ] = useState<string | null>(null);

    const [ customerState, setCustomerStateInternal ] = useState<Customer | null>(defaultValue != null ? defaultValue : {
        id: "",
        name: "",
        contact: {
            name: "",
            mobile: {
                region_code: "",
                root: ""
            },
            email: {
                root: "",
                domain: "",
                full: ""
            },
            landline: "",
            address: {
                street: "",
                street2: "",
                city: "",
                country: "",
                po_code: "",
                lat: 0,
                lon: 0
            }
        },
        transactions: "",
        order_history: [],
        customer_notes: [],
        special_pricing: "",
        accepts_marketing: false,
        balance: 0,
    })

    const input_ref = createRef<HTMLInputElement>();

    const debouncedResults = useMemo(() => {
        return debounce(async (address: string) => {
            setLoading(true);

            const data = await fetch(`${OPEN_STOCK_URL}/helpers/suggest/`, {
                method: "POST",
                credentials: "include",
                redirect: "follow",
                body: address
            })?.then(async e => {
                const data: Address[] = await e.json();
    
                return data;
            });

            setSuggestions(data);
            setLoading(false);
        }, 250);
    }, []);

    useEffect(() => {
        return () => {
            debouncedResults.cancel();
        };
    });

    return (
        <div className="bg-gray-900 max-h-[calc(100vh - 18px)] overflow-auto min-w-[550px] max-w-[550px] p-6 flex flex-col h-full justify-between flex-1 gap-8">
            <div className="flex flex-row justify-between cursor-pointer">
                <div 
                    onClick={() => {
                        setPadState("cart")
                    }}
                    className="flex flex-row items-center gap-2"
                >
                    <Image src="/icons/arrow-narrow-left.svg" height={20} width={20} alt="" />
                    <p className="text-gray-400">Back</p>
                </div>
                <p className="text-gray-400">{create ? "Create" : "Edit"} Customer</p>
            </div>

            <div className="flex flex-col flex-1 gap-8 h-full max-h-fit overflow-hidden" onClick={(e) => {
                // let sel = selectedItems.find(k => k.selected);
                // if(sel) {
                //     setSelectedItems(selectedItems.map(k => {
                //         return {
                //             ...k,
                //             selected: false
                //         }
                //     }))
                // }
            }}>
                <div className="flex flex-col gap-8 flex-1 overflow-auto">
                    <div className="flex flex-col gap-2">
                        <p className="text-white font-semibold">Contact Information</p>
                        
                        <div className="flex flex-col gap-1">
                            <p className="text-gray-400 pb-0 mb-0">Customer Name</p>
                            <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                <input 
                                    placeholder="Customer Name" defaultValue={customerState?.contact.name} className="bg-transparent focus:outline-none text-white flex-1" 
                                    onChange={(e) => {
                                        if(customerState)
                                            setCustomerStateInternal({
                                                ...customerState,
                                                contact: {
                                                    ...customerState.contact,
                                                    name: e.target.value
                                                }
                                            }) 
                                    }}
                                    onFocus={(e) => {
                                    }}
                                    tabIndex={0}
                                    // onBlur={() => setSearchFocused(false)}
                                    onKeyDown={(e) => {
                                    }}
                                    />
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                            <p className="text-gray-400">Phone Number</p>
                            <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                <input 
                                    placeholder="Phone Number" defaultValue={customerState?.contact.mobile.root} className="bg-transparent focus:outline-none text-white flex-1" 
                                    onChange={(e) => {
                                        if(customerState)
                                            setCustomerStateInternal({
                                                ...customerState,
                                                contact: {
                                                    ...customerState.contact,
                                                    mobile: {
                                                        region_code: "+64",
                                                        root: e.target.value
                                                    }
                                                }
                                            }) 
                                    }}
                                    onFocus={(e) => {
                                    }}
                                    tabIndex={0}
                                    // onBlur={() => setSearchFocused(false)}
                                    onKeyDown={(e) => {
                                    }}
                                    />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <p className="text-gray-400">Email Address</p>
                            <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                <input 
                                    placeholder="Email Address" defaultValue={customerState?.contact.email.full} className="bg-transparent focus:outline-none text-white flex-1" 
                                    onChange={(e) => {
                                        if(customerState)
                                            setCustomerStateInternal({
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
                                    onFocus={(e) => {
                                    }}
                                    tabIndex={0}
                                    // onBlur={() => setSearchFocused(false)}
                                    onKeyDown={(e) => {
                                    }}
                                    />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col flex-1 gap-2 rounded-md">
                        <p className="text-white font-semibold">Shipping Details</p>
                        
                        <div className="flex-1 h-full">
                            <div className="flex flex-col gap-1">
                                <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 "border-2 border-gray-700`}>
                                    <input 
                                        autoComplete="off"
                                        ref={input_ref}
                                        placeholder="Address" defaultValue={customerState?.contact.address.street} className="bg-transparent focus:outline-none text-white flex-1" 
                                        onChange={(e) => {
                                            debouncedResults(e.target.value);
                                        }}
                                        onFocus={() => setSearching(true)}
                                        tabIndex={0}
                                        />
                                </div>
                            </div>

                            <div className={`flex flex-col gap-2 flex-1 px-2 py-2 ${searching ? "bg-gray-800" : ""}`}>
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

                                                        setCustomerStateInternal({
                                                            ...customerState as Customer,
                                                            contact: {
                                                                ...customerState?.contact as ContactInformation,
                                                                address: k
                                                            }
                                                        })

                                                        input_ref.current ? input_ref.current.value = "" : {}
                                                    }} 
                                                    className="px-4 py-2 cursor-pointer hover:bg-gray-700 rounded-md" key={`${k.city}-${k.country}-${k.po_code}-${k.street}-${k.street2}`}>
                                                    <p className="text-white font-semibold">{k.street.trim() == "0" ? "" : k.street} {k.street2} {k.po_code}</p>
                                                    <p className="text-gray-400">{k.city} - {k.country}</p>
                                                </div>
                                            )
                                        })
                                :
                                <div className="flex flex-row items-start gap-4 px-2 py-4">
                                    <Image src="/icons/check-verified-02.svg" style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} className="mt-1" height={20} width={20} alt="Verified Address" />

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
                        onClick={() => {
                            if(!loading) {
                                setLoading(true);

                                fetch(create ? `${OPEN_STOCK_URL}/customer` : `${OPEN_STOCK_URL}/customer/${customerState?.id}`, {
                                    method: "POST",
                                    body: JSON.stringify({ ...customerState, contact: customerState?.contact, name: customerState?.contact.name }),
                                    credentials: "include",
                                    redirect: "follow"
                                })?.then(async e => {
                                    const data: Customer = await e.json();
                                    console.log(data);
                                    setCustomerState({ ...data });
                                    setActiveCustomer({ ...data });

                                    if(e.ok) {
                                        setLoading(false);
                                        setError(null);
                                        setPageState("origin");
                                        setPadState("cart")
                                    }else {
                                        setLoading(false);
                                        setError("Malformed Street Address")
                                    }
                                })
                            }
                        }}
                        className={`${!loading ? "bg-blue-700 cursor-pointer" : "bg-blue-700 bg-opacity-10 opacity-20"} w-full rounded-md p-4 flex items-center justify-center`}>
                        
                        <p className={`text-white font-semibold ${""}`}>{loading ? "Saving..." : "Save"}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CustomerMenu;