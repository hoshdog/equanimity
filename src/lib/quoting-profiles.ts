// src/lib/quoting-profiles.ts

export interface ScheduleOfRate {
    description: string;
    cost: number;
    unit: string;
}

export interface QuotingProfile {
    id: string;
    name: string;
    description: string;
    defaults: {
        desiredMargin: number;
        overheadRate: number;
        callOutFee?: number;
    };
    persona: string;
    instructions: string;
    scheduleOfRates: ScheduleOfRate[];
}

export const initialQuotingProfiles: QuotingProfile[] = [
    {
        id: 'profile-1',
        name: 'Electrical & General Contracting',
        description: 'Standard rates for residential and commercial electrical work, including common materials and labor.',
        defaults: {
            desiredMargin: 25,
            overheadRate: 15,
            callOutFee: 120,
        },
        persona: 'You are an expert electrical estimator with 20 years of experience in residential and commercial projects. Be thorough and accurate.',
        instructions: `Always break down labor and materials separately. Apply the call-out fee if the job appears to be a small service call. For any new installations, add a line item for a final safety check and compliance certificate. Add a 5% contingency for unforeseen issues on jobs estimated over $2000.`,
        scheduleOfRates: [
            { description: 'Standard Labor Rate', cost: 95, unit: 'per hour' },
            { description: 'Apprentice Labor Rate', cost: 55, unit: 'per hour' },
            { description: 'Call-out Fee (includes first 30 mins)', cost: 120, unit: 'each' },
            { description: 'Standard GPO (Supply & Install)', cost: 85, unit: 'each' },
            { description: 'Standard Downlight (Supply & Install)', cost: 75, unit: 'each' },
            { description: 'Switchboard Upgrade (Standard)', cost: 1200, unit: 'each' },
            { description: 'Wire per meter (2.5mm Twin & Earth)', cost: 2.50, unit: 'per meter' },
        ]
    },
    {
        id: 'profile-2',
        name: 'IT & Managed Services',
        description: 'Rates for IT support, hardware/software sales, and managed service contracts.',
        defaults: {
            desiredMargin: 30,
            overheadRate: 10,
        },
        persona: 'You are an IT solutions consultant for a Managed Service Provider (MSP). Focus on providing value and clear, itemized costs for both hardware and services.',
        instructions: `Clearly distinguish between one-off project costs and recurring monthly fees. When quoting hardware, add a 15% margin on top of the estimated cost. Always include a line item for 'Project Management & Documentation' at 10% of the total labor cost.`,
        scheduleOfRates: [
            { description: 'On-site Support (Business Hours)', cost: 150, unit: 'per hour' },
            { description: 'Remote Support (Business Hours)', cost: 120, unit: 'per hour' },
            { description: 'After-Hours Emergency Support', cost: 250, unit: 'per hour' },
            { description: 'Standard Workstation Setup', cost: 180, unit: 'each' },
            { description: 'Server Setup (Basic)', cost: 1500, unit: 'each' },
            { description: 'Managed Services (Per User)', cost: 65, unit: 'per month' },
            { description: 'Microsoft 365 Business Premium License', cost: 35, unit: 'per user/month' },
            { description: 'Standard Network Switch (8-port, unmanaged)', cost: 100, unit: 'each' },
        ]
    },
    {
        id: 'profile-3',
        name: 'Mechanical Engineering & Fabrication',
        description: 'Costs related to engineering consultation, design, and fabrication with various materials.',
        defaults: {
            desiredMargin: 35,
            overheadRate: 20,
        },
        persona: 'You are a senior mechanical engineer and fabricator. Your quotes must be precise, accounting for material waste and workshop consumables.',
        instructions: `Material costs should include a 10% waste allowance. For every hour of fabrication labor, add a 'Workshop Consumables' charge. If design work is required, bill it separately from fabrication labor. All quotes should include an estimated lead time.`,
        scheduleOfRates: [
            { description: 'Engineering Consultation Rate', cost: 200, unit: 'per hour' },
            { description: 'CAD Design & Drafting Rate', cost: 125, unit: 'per hour' },
            { description: 'Welder/Fabricator Labor Rate', cost: 110, unit: 'per hour' },
            { description: 'Workshop Consumables (per hour of labor)', cost: 10, unit: 'per hour' },
            { description: 'Mild Steel Cost', cost: 5.50, unit: 'per kg' },
            { description: 'Stainless Steel 316 Cost', cost: 15.00, unit: 'per kg' },
            { description: 'Aluminum Cost', cost: 12.00, unit: 'per kg' },
            { description: 'CNC Machining', cost: 180, unit: 'per hour' },
        ]
    }
];
