// src/lib/quoting-profiles.ts

export interface LineItemRate {
    description: string;
    cost: number;
    unit: string;
}

export interface LaborRate {
    employeeType: string;
    standardRate: number; // This is the SELL rate
    calculatedCostRate: number; // This is the calculated COST rate
    overtimeRate: number;
}

export interface QuotingProfile {
    id: string;
    name: string;
    description: string;
    defaults: {
        desiredMargin: number;
        callOutFee?: number;
    };
    persona: string;
    instructions: string;
    laborRates: LaborRate[];
    materialAndServiceRates: LineItemRate[];
}

export const initialQuotingProfiles: QuotingProfile[] = [
    {
        id: 'profile-1',
        name: 'Electrical & General Contracting',
        description: 'Standard rates for residential and commercial electrical work, including common materials and labor.',
        defaults: {
            desiredMargin: 25,
            callOutFee: 120,
        },
        persona: 'You are an expert electrical estimator with 20 years of experience in residential and commercial projects. Be thorough and accurate.',
        instructions: `Always break down labor and materials separately. Apply the call-out fee if the job appears to be a small service call. For any new installations, add a line item for a final safety check and compliance certificate. Add a 5% contingency for unforeseen issues on jobs estimated over $2000.`,
        laborRates: [
            { employeeType: 'Lead Technician', standardRate: 110, overtimeRate: 165, calculatedCostRate: 0 },
            { employeeType: 'Technician', standardRate: 95, overtimeRate: 142.5, calculatedCostRate: 0 },
            { employeeType: 'Apprentice', standardRate: 55, overtimeRate: 82.5, calculatedCostRate: 0 },
        ],
        materialAndServiceRates: [
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
        },
        persona: 'You are an IT solutions consultant for a Managed Service Provider (MSP). Focus on providing value and clear, itemized costs for both hardware and services.',
        instructions: `Clearly distinguish between one-off project costs and recurring monthly fees. When quoting hardware, add a 15% margin on top of the estimated cost. Always include a line item for 'Project Management & Documentation' at 10% of the total labor cost.`,
        laborRates: [
            { employeeType: 'Senior Engineer', standardRate: 200, overtimeRate: 300, calculatedCostRate: 0 },
            { employeeType: 'Support Technician', standardRate: 120, overtimeRate: 180, calculatedCostRate: 0 },
            { employeeType: 'Junior Technician', standardRate: 90, overtimeRate: 135, calculatedCostRate: 0 },
        ],
        materialAndServiceRates: [
            { description: 'On-site Support (Business Hours)', cost: 150, unit: 'per hour' },
            { description: 'Remote Support (Business Hours)', cost: 120, unit: 'per hour' },
            { description: 'Standard Workstation Setup', cost: 180, unit: 'each' },
            { description: 'Server Setup (Basic)', cost: 1500, unit: 'each' },
            { description: 'Managed Services (Per User)', cost: 65, unit: 'per month' },
            { description: 'Microsoft 365 Business Premium License', cost: 35, unit: 'per user/month' },
        ]
    },
];
