
// src/app/api/xero/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initializeXeroClient, setXeroTokenSet } from '@/lib/xero';

export async function GET(req: NextRequest) {
    const xero = initializeXeroClient();
    const url = req.url;

    try {
        const tokenSet = await xero.apiCallback(url);
        await setXeroTokenSet(tokenSet);
        
        // Redirect to the settings page after successful connection
        const redirectUrl = new URL('/settings', req.nextUrl.origin);
        return NextResponse.redirect(redirectUrl);
    } catch (error) {
        console.error("Error in Xero callback:", error);
        const errorUrl = new URL('/settings', req.nextUrl.origin);
        errorUrl.searchParams.set('error', 'xero_connection_failed');
        return NextResponse.redirect(errorUrl);
    }
}
