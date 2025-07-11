
// src/app/api/xero/connect/route.ts
import { NextResponse } from 'next/server';
import { initializeXeroClient } from '@/lib/xero';

export async function GET() {
    try {
        const xero = initializeXeroClient();
        const consentUrl = await xero.buildConsentUrl();
        return NextResponse.json({ consentUrl });
    } catch (error) {
        console.error("Error building Xero consent URL:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
