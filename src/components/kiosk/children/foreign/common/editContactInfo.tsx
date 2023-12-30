import {Customer} from "@/generated/stock/Api";

interface EditContactInfoProps {
    customerState: Customer | null,
    setCustomerState: (value: Customer | null) => void
}

export function EditContactInfo({ customerState, setCustomerState }: EditContactInfoProps) {
    return (
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
    )
}