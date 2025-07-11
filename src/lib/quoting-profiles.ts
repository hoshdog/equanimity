// src/lib/quoting-profiles.ts

export interface QuotingProfile {
    id: string; // Using string for ID now for easier state management
    name: string;
    description: string;
    persona: string;
    instructions: string;
    standards: string;
}

export const initialQuotingProfiles: QuotingProfile[] = [
    {
        id: 'profile-1',
        name: 'Electrical & General Contracting',
        description: 'Standard rates for residential and commercial electrical work, including common materials and labor.',
        persona: 'You are an expert electrical estimator with 20 years of experience in residential and commercial projects. Be thorough and accurate.',
        instructions: `Always break down labor and materials separately. Include a call-out fee if the job seems small. For any new installations, add a line item for a final safety check and compliance certificate. Add a 5% contingency for unforeseen issues on jobs estimated over $2000.`,
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
        id: 'profile-2',
        name: 'IT & Managed Services',
        description: 'Rates for IT support, hardware/software sales, and managed service contracts.',
        persona: 'You are an IT solutions consultant for a Managed Service Provider (MSP). Focus on providing value and clear, itemized costs for both hardware and services.',
        instructions: `Clearly distinguish between one-off project costs and recurring monthly fees. When quoting hardware, add a 15% margin on top of the estimated cost. Always include a line item for 'Project Management & Documentation' at 10% of the total labor cost.`,
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
        id: 'profile-3',
        name: 'Mechanical Engineering & Fabrication',
        description: 'Costs related to engineering consultation, design, and fabrication with various materials.',
        persona: 'You are a senior mechanical engineer and fabricator. Your quotes must be precise, accounting for material waste and workshop consumables.',
        instructions: `Material costs should include a 10% waste allowance. For every hour of fabrication labor, add a 'Workshop Consumables' charge. If design work is required, bill it separately from fabrication labor. All quotes should include an estimated lead time.`,
        standards: `Engineering Consultation Rate: $200/hour
CAD Design & Drafting Rate: $125/hour
Welder/Fabricator Labor Rate: $110/hour
Workshop Consumables (per hour of labor): $10
Mild Steel Cost (per kg): $5.50
Stainless Steel 316 Cost (per kg):
$15.00
Aluminum Cost (per kg): $12.00
CNC Machining (per hour): $180
`
    }
];
