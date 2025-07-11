// src/lib/quoting-profiles.ts

export interface QuotingProfile {
    name: string;
    description: string;
    standards: string;
}

export const quotingProfiles: QuotingProfile[] = [
    {
        name: 'Electrical & General Contracting',
        description: 'Standard rates for residential and commercial electrical work, including common materials and labor.',
        standards: `Standard Labor Rate: $95/hour
Apprentice Labor Rate: $55/hour
Call-out Fee: $120 (includes first 30 minutes of labor)
Standard GPO (Supply & Install): $85 per unit
Standard Downlight (Supply & Install): $75 per unit
Switchboard Upgrade (Standard): $1200
Wire per meter (2.5mm Twin & Earth): $2.50
`
    },
    {
        name: 'IT & Managed Services',
        description: 'Rates for IT support, hardware/software sales, and managed service contracts.',
        standards: `On-site Support (Business Hours): $150/hour
Remote Support (Business Hours): $120/hour
After-Hours Emergency Support: $250/hour (2-hour minimum)
Standard Workstation Setup: $180
Server Setup (Basic): $1500
Managed Services (Per User/Month): $65
Microsoft 365 Business Premium License (Per User/Month): $35
Standard Network Switch (8-port, unmanaged): $100
`
    },
    {
        name: 'Mechanical Engineering & Fabrication',
        description: 'Costs related to engineering consultation, design, and fabrication with various materials.',
        standards: `Engineering Consultation Rate: $200/hour
CAD Design & Drafting Rate: $125/hour
Welder/Fabricator Labor Rate: $110/hour
Mild Steel Cost (per kg): $5.50
Stainless Steel 316 Cost (per kg): $15.00
Aluminum Cost (per kg): $12.00
Workshop Consumables (per hour of labor): $10
CNC Machining (per hour): $180
`
    }
];
