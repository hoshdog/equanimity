
// src/app/api/xero/tenants/route.ts
import { NextResponse } from 'next/server';
import { getConnectedTenants } from '@/lib/xero';

export async function GET() {
    try {
        const tenants = await getConnectedTenants();
        return NextResponse.json(tenants);
    } catch (error) {
        // If not connected, getConnectedTenants will throw an error.
        // We can return an empty array or an error status.
        return NextResponse.json([], { status: 200 });
    }
}
