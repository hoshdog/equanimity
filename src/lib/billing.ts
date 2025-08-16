// src/lib/billing.ts
import { getEmployeesWithWageData } from './employees';
import type { Employee, LaborRate } from './types';

export interface GeneratedLaborRate {
    id: string;
    name: string;
    isDefault: boolean;
    costRate: number;
    standardRate: number;
    overtimeRate: number;
    doubleTimeRate: number;
    saturdayFirstRate: number;
    saturdayFirstHours: number;
    saturdayAfterRate: number;
    sundayRate: number;
    publicHolidayRate: number;
    afterHoursCalloutRate: number;
}

const calculateCostRate = (roleName: string, employees: Employee[]): number => {
    if (!roleName || !employees.length) return 0;
    
    const relevantEmployees = employees.filter(e => e.role === roleName && e.payType === 'Hourly');
    const maxWage = relevantEmployees.length > 0 ? Math.max(...relevantEmployees.map(e => e.wage || 0)) : 0;
    
    if (maxWage === 0) return 0;

    const FULL_TIME_ANNUAL_HOURS = 1976; // 38 hours * 52 weeks
    const nonProductiveHours = (10 + 20) * 7.6; // 10 sick, 20 annual leave
    const productiveHours = FULL_TIME_ANNUAL_HOURS - nonProductiveHours;

    if (productiveHours <= 0) return 0;
    
    const annualCost = FULL_TIME_ANNUAL_HOURS * maxWage; 
    const actualCostRate = annualCost / productiveHours;
    
    return parseFloat(actualCostRate.toFixed(2));
};

export async function getLaborRates(orgId: string): Promise<GeneratedLaborRate[]> {
    const employees = await getEmployeesWithWageData(orgId);
    const uniqueRoles = [...new Set(employees.map(e => e.role))];
    
    const generatedRates: GeneratedLaborRate[] = uniqueRoles.map(role => {
        const costRate = calculateCostRate(role, employees);
        const standardRate = costRate > 0 ? costRate / (1 - 0.40) : 0; // Target 40% margin

        return {
            id: `role-${role.replace(/\s+/g, '-').toLowerCase()}`,
            name: role,
            isDefault: role === 'Technician', // Example default logic
            costRate: costRate,
            standardRate: parseFloat(standardRate.toFixed(2)),
            overtimeRate: parseFloat((standardRate * 1.5).toFixed(2)),
            overtimeAfterHours: 8,
            doubleTimeRate: parseFloat((standardRate * 2).toFixed(2)),
            doubleTimeAfterHours: 10,
            saturdayFirstRate: parseFloat((standardRate * 1.5).toFixed(2)),
            saturdayFirstHours: 2,
            saturdayAfterRate: parseFloat((standardRate * 2).toFixed(2)),
            sundayRate: parseFloat((standardRate * 2).toFixed(2)),
            publicHolidayRate: parseFloat((standardRate * 2.5).toFixed(2)),
            afterHoursCalloutRate: parseFloat((standardRate * 2).toFixed(2)),
        };
    });

    return generatedRates;
}
