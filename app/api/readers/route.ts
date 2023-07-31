import stripe from "@/src/utils/serveStripeInstance";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { data: readers } = await stripe.terminal.readers.list();
        return NextResponse.json({ readersList: readers });
    } catch (e: unknown) {
        return NextResponse.json({ error: { message: JSON.stringify(e) } }, { status: 500 });
    }
}