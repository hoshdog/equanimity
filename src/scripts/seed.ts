// scripts/seed.ts
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// --- Direct Initialization Fix ---
// This version directly loads the service account key from a known path
// to bypass all environment variable loading issues.

const serviceAccountFileName = 'equanimity-m1b2n-firebase-adminsdk-fbsvc-c673af7b32.json';
const serviceAccountPath = path.resolve(process.cwd(), serviceAccountFileName);

if (!fs.existsSync(serviceAccountPath)) {
    console.error(`\n\n--- SETUP ERROR ---`);
    console.error(`The service account key file was not found at: ${serviceAccountPath}`);
    console.error(`Please ensure the file named "${serviceAccountFileName}" is in the root directory of your project.`);
    console.error(`--- END SETUP ERROR ---\n`);
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // The projectId is read directly from the service account file
        projectId: serviceAccount.project_id,
    });
}
// --- End of Fix ---

const db = getFirestore();

const mockEmployees = [
    { 
        id: 'EMP001', name: 'Alice Johnson', email: 'alice.j@example.com', role: 'Project Manager', status: 'Active', 
        payType: 'Salary', annualSalary: 110000, wage: undefined, calculatedCostRate: 74.17,
        employmentType: 'Full-time', isOverhead: true, tfn: '111-222-333', award: 'Clerks - Private Sector Award 2020',
        leaveBalances: { annual: 120, sick: 76, banked: 10 },
        superannuation: { fundName: 'AustralianSuper', memberNumber: 'S1234567T' },
        estimatedNonBillableHours: 2,
    },
    { 
        id: 'EMP002', name: 'Bob Smith', email: 'bob.s@example.com', role: 'Lead Technician', status: 'Active', 
        payType: 'Hourly', wage: 50, annualSalary: undefined, calculatedCostRate: 59.01,
        employmentType: 'Full-time', isOverhead: false, tfn: '222-333-444', award: 'Electrical, Electronic and Communications Contracting Award 2020',
        leaveBalances: { annual: 80.5, sick: 40, banked: 15.5 },
        superannuation: { fundName: 'Hostplus', memberNumber: 'H7654321S' },
        estimatedNonBillableHours: 1.5,
    },
    { 
        id: 'EMP003', name: 'Charlie Brown', email: 'charlie.b@example.com', role: 'Technician', status: 'Active', 
        payType: 'Hourly', wage: 42, annualSalary: undefined, calculatedCostRate: 49.57,
        employmentType: 'Full-time', isOverhead: false, tfn: '333-444-555', award: 'Electrical, Electronic and Communications Contracting Award 2020',
        leaveBalances: { annual: 95, sick: 60, banked: 0 },
        superannuation: { fundName: 'REST Super', memberNumber: 'R9876543B' },
        estimatedNonBillableHours: 1,
    },
    { 
        id: 'EMP004', name: 'Diana Prince', email: 'diana.p@example.com', role: 'HR Specialist', status: 'On Leave', 
        payType: 'Salary', annualSalary: 85000, wage: undefined, calculatedCostRate: 57.31,
        employmentType: 'Full-time', isOverhead: true, tfn: '444-555-666', award: 'Clerks - Private Sector Award 2020',
        leaveBalances: { annual: 10, sick: 5, banked: 0 },
        superannuation: { fundName: 'AustralianSuper', memberNumber: 'S1122334P' },
        estimatedNonBillableHours: 4,
    },
    { 
        id: 'EMP005', name: 'Ethan Hunt', email: 'ethan.h@example.com', role: 'Technician', status: 'Inactive', 
        payType: 'Casual', wage: 40, annualSalary: undefined, calculatedCostRate: 44.80,
        employmentType: 'Casual', isOverhead: false, tfn: '555-666-777', award: 'Electrical, Electronic and Communications Contracting Award 2020',
        leaveBalances: { annual: 0, sick: 0, banked: 0 },
        superannuation: { fundName: 'Sunsuper', memberNumber: 'U5566778H' },
        estimatedNonBillableHours: 0,
    },
    { 
        id: 'EMP006', name: 'Fiona Glenanne', email: 'fiona.g@example.com', role: 'Lead Technician', status: 'Active', 
        payType: 'Hourly', wage: 52, annualSalary: undefined, calculatedCostRate: 61.37,
        employmentType: 'Full-time', isOverhead: false, tfn: '666-777-888', award: 'Electrical, Electronic and Communications Contracting Award 2020',
        leaveBalances: { annual: 152, sick: 76, banked: 40 },
        superannuation: { fundName: 'HESTA', memberNumber: 'E8899001G' },
        estimatedNonBillableHours: 1.5,
    },
    { 
        id: 'EMP007', name: 'George Costanza', email: 'george.c@example.com', role: 'Sales Manager', status: 'Active', 
        payType: 'Salary', annualSalary: 95000, wage: undefined, calculatedCostRate: 64.06,
        employmentType: 'Full-time', isOverhead: true, tfn: '777-888-999', award: 'Clerks - Private Sector Award 2020',
        leaveBalances: { annual: 40, sick: 40, banked: 0 },
        superannuation: { fundName: 'Cbus', memberNumber: 'B1231231C' },
        estimatedNonBillableHours: 5,
    },
    { 
        id: 'EMP008', name: 'Hannah Montana', email: 'hannah.m@example.com', role: 'Apprentice', status: 'Active', 
        payType: 'Hourly', wage: 25, annualSalary: undefined, calculatedCostRate: 29.51,
        employmentType: 'Full-time', isOverhead: false, tfn: '888-999-000', award: 'Electrical, Electronic and Communications Contracting Award 2020',
        leaveBalances: { annual: 76, sick: 38, banked: 5 },
        superannuation: { fundName: 'AustralianSuper', memberNumber: 'S0099887M' },
        estimatedNonBillableHours: 8,
    },
    { 
        id: 'EMP009', name: 'Ian Malcolm', email: 'ian.m@example.com', role: 'Compliance Officer', status: 'Active', 
        payType: 'Salary', annualSalary: 125000, wage: undefined, calculatedCostRate: 84.28,
        employmentType: 'Full-time', isOverhead: true, tfn: '999-000-111', award: 'Professional Employees Award 2020',
        leaveBalances: { annual: 152, sick: 76, banked: 100 },
        superannuation: { fundName: 'UniSuper', memberNumber: 'U4567890M' },
        estimatedNonBillableHours: 3,
    },
    { 
        id: 'EMP010', name: 'Jane Doe', email: 'jane.d@example.com', role: 'CEO', status: 'Active', 
        payType: 'Salary', annualSalary: 250000, wage: undefined, calculatedCostRate: 168.56,
        employmentType: 'Full-time', isOverhead: true, tfn: '000-111-222', award: 'N/A',
        leaveBalances: { annual: 200, sick: 100, banked: 0 },
        superannuation: { fundName: 'Aware Super', memberNumber: 'A1112223D' },
        estimatedNonBillableHours: 8,
    }
];

const mockCustomers = [
    {
        id: '1', name: 'Innovate Corp', address: '123 Tech Park, Sydney NSW 2000', type: 'Corporate Client',
        primaryContactName: 'John Doe', email: 'john.doe@innovate.com', phone: '02 9999 8888',
    },
    {
        id: '2', name: 'Builders Pty Ltd', address: '456 Construction Ave, Melbourne VIC 3000', type: 'Construction Partner',
        primaryContactName: 'Jane Smith', email: 'jane.smith@builders.com', phone: '03 8888 7777',
    },
    {
        id: '3', name: 'Greenleaf Cafe', address: '789 Garden Lane, Brisbane QLD 4000', type: 'Small Business',
        primaryContactName: 'Sam Green', email: 'sam.g@greenleaf.com', phone: '07 1111 2222',
    },
    {
        id: '4', name: 'State Education Dept.', address: '1 Education Plaza, Canberra ACT 2601', type: 'Government',
        primaryContactName: 'Karen Wheeler', email: 'k.wheeler@education.gov.au', phone: '02 6200 0000',
    },
    {
        id: '5', name: 'Oceanic Airlines', address: '815 Skyway, Perth WA 6000', type: 'Corporate Client',
        primaryContactName: 'Jack Shephard', email: 'j.shephard@oceanic.com', phone: '08 9000 1000',
    }
];

const mockContacts = {
    '1': [
        { id: 'C1A', name: 'John Doe', emails: ['john.doe@innovate.com'], phones: ['02 9999 8888'], jobTitle: 'IT Manager' },
        { id: 'C1B', name: 'Sarah Lee', emails: ['sarah.lee@innovate.com', 's.lee.personal@email.com'], phones: ['02 9999 8889'], jobTitle: 'Office Manager' },
    ],
    '2': [
        { id: 'C2A', name: 'Jane Smith', emails: ['jane.smith@builders.com'], phones: ['03 8888 7777'], jobTitle: 'Site Foreman' },
        { id: 'C2B', name: 'Mike Ross', emails: ['mike.r@builders.com'], phones: ['03 8888 7778'], jobTitle: 'Project Coordinator' },
    ],
    '3': [
        { id: 'C3A', name: 'Sam Green', emails: ['sam.g@greenleaf.com'], phones: ['07 1111 2222'], jobTitle: 'Owner' },
    ],
    '4': [
        { id: 'C4A', name: 'Karen Wheeler', emails: ['k.wheeler@education.gov.au'], phones: ['02 6200 0000'], jobTitle: 'Facilities Manager' },
        { id: 'C4B', name: 'Martin Brenner', emails: ['m.brenner@education.gov.au'], phones: ['02 6200 0001'], jobTitle: 'Head of Procurement' },
    ],
    '5': [
        { id: 'C5A', name: 'Jack Shephard', emails: ['j.shephard@oceanic.com'], phones: ['08 9000 1000'], jobTitle: 'Operations Director' },
        { id: 'C5B', name: 'Kate Austen', emails: ['k.austen@oceanic.com'], phones: ['08 9000 1001'], jobTitle: 'Security Supervisor' },
    ],
};

const mockSites = {
    '1': [
        { id: 'S1A', name: 'Sydney HQ', address: '123 Tech Park, Sydney NSW 2000', primaryContactId: 'C1A' },
        { id: 'S1B', name: 'Melbourne Office', address: '55 Collins St, Melbourne VIC 3000', primaryContactId: 'C1B' },
    ],
    '2': [
        { id: 'S2A', name: 'Main Yard', address: '456 Construction Ave, Melbourne VIC 3000', primaryContactId: 'C2A' },
        { id: 'S2B', name: 'New Development Site', address: '100 Development Rd, Geelong VIC 3220', primaryContactId: 'C2B'},
    ],
    '3': [
        { id: 'S3A', name: 'Cafe Location', address: '789 Garden Lane, Brisbane QLD 4000', primaryContactId: 'C3A' },
    ],
    '4': [
        { id: 'S4A', name: 'Hawkins High School', address: '1 School Rd, Hawkins ACT 2602', primaryContactId: 'C4A' },
        { id: 'S4B', name: 'Starcourt Primary', address: '88 Mall Ave, Hawkins ACT 2602', primaryContactId: 'C4A' },
    ],
    '5': [
        { id: 'S5A', name: 'Perth Airport Hangar', address: '815 Skyway, Perth WA 6000', primaryContactId: 'C5A' },
    ],
};

const mockProjects = [
    // Innovate Corp Projects
    { id: 'PROJ001', name: 'Website Redesign', description: 'Complete overhaul of the corporate website.', customerId: '1', customerName: 'Innovate Corp', siteId: 'S1A', status: 'In Progress' },
    { id: 'PROJ002', name: 'Server Upgrade', description: 'Upgrade all production servers.', customerId: '1', customerName: 'Innovate Corp', siteId: 'S1A', status: 'Completed' },
    { id: 'PROJ003', name: 'Office Network Setup', description: 'New network infrastructure for Melbourne office.', customerId: '1', customerName: 'Innovate Corp', siteId: 'S1B', status: 'Planning' },
    // Builders Pty Ltd Projects
    { id: 'PROJ004', name: 'New Apartment Complex Wiring', description: 'Electrical wiring for a 50-unit complex.', customerId: '2', customerName: 'Builders Pty Ltd', siteId: 'S2B', status: 'In Progress' },
    { id: 'PROJ005', name: 'Main Yard Security System', description: 'Install new security cameras and alarm system.', customerId: '2', customerName: 'Builders Pty Ltd', siteId: 'S2A', status: 'On Hold' },
    // Greenleaf Cafe Projects
    { id: 'PROJ006', name: 'Kitchen Appliance Test & Tag', description: 'Annual safety check for all kitchen equipment.', customerId: '3', customerName: 'Greenleaf Cafe', siteId: 'S3A', status: 'Completed' },
    { id: 'PROJ007', name: 'POS System Upgrade', description: 'Install new Point of Sale hardware and software.', customerId: '3', customerName: 'Greenleaf Cafe', siteId: 'S3A', status: 'Planning' },
    // State Education Dept. Projects
    { id: 'PROJ008', name: 'Hawkins High CCTV Upgrade', description: 'Upgrade all CCTV cameras to digital IP.', customerId: '4', customerName: 'State Education Dept.', siteId: 'S4A', status: 'In Progress' },
    { id: 'PROJ009', name: 'Starcourt Primary PA System', description: 'Install new public address system.', customerId: '4', customerName: 'State Education Dept.', siteId: 'S4B', status: 'Planning' },
    // Oceanic Airlines Projects
    { id: 'PROJ010', name: 'Hangar 5 Lighting Retrofit', description: 'Replace all hangar lighting with LEDs.', customerId: '5', customerName: 'Oceanic Airlines', siteId: 'S5A', status: 'Completed' },
];

const mockJobs = [
    { id: 'JOB001', projectId: 'PROJ001', projectName: 'Website Redesign', customerId: '1', customerName: 'Innovate Corp', siteId: 'S1A', title: 'Design new homepage mockup', description: 'Detailed mockup in Figma.', status: 'Completed', assignedStaff: [{ employeeId: 'EMP001', role: 'Project Manager' }] },
    { id: 'JOB002', projectId: 'PROJ001', projectName: 'Website Redesign', customerId: '1', customerName: 'Innovate Corp', siteId: 'S1A', title: 'Develop frontend components', description: 'Build React components for the homepage.', status: 'In Progress', assignedStaff: [{ employeeId: 'EMP006', role: 'Lead Technician' }] },
    { id: 'JOB003', projectId: null, projectName: null, customerId: '1', customerName: 'Innovate Corp', siteId: 'S1A', title: 'Standalone Server Check', description: 'Perform health check on secondary server.', status: 'Planned', assignedStaff: [{ employeeId: 'EMP002', role: 'Lead Technician' }] },
    { id: 'JOB004', projectId: 'PROJ004', projectName: 'New Apartment Complex Wiring', customerId: '2', customerName: 'Builders Pty Ltd', siteId: 'S2B', title: 'Run conduit for Level 1', description: 'Run all electrical conduit for first floor.', status: 'In Progress', assignedStaff: [{ employeeId: 'EMP002', role: 'Lead Technician' }, { employeeId: 'EMP003', role: 'Technician' }] },
    { id: 'JOB005', projectId: 'PROJ004', projectName: 'New Apartment Complex Wiring', customerId: '2', customerName: 'Builders Pty Ltd', siteId: 'S2B', title: 'Pull cabling for Level 1', description: 'Pull all Cat6 and power cables.', status: 'Planned', assignedStaff: [{ employeeId: 'EMP003', role: 'Technician' }] },
    { id: 'JOB006', projectId: 'PROJ004', projectName: 'New Apartment Complex Wiring', customerId: '2', customerName: 'Builders Pty Ltd', siteId: 'S2B', title: 'Install distribution board', description: 'Fit out main distribution board for the floor.', status: 'Planned', assignedStaff: [{ employeeId: 'EMP002', role: 'Lead Technician' }] },
    { id: 'JOB007', projectId: null, projectName: null, customerId: '3', customerName: 'Greenleaf Cafe', siteId: 'S3A', title: 'Test & Tag Appliances', description: 'Annual safety check for all kitchen equipment.', status: 'Completed', assignedStaff: [{ employeeId: 'EMP005', role: 'Technician' }] },
    { id: 'JOB008', projectId: 'PROJ008', projectName: 'Hawkins High CCTV Upgrade', customerId: '4', customerName: 'State Education Dept.', siteId: 'S4A', title: 'Audit existing camera locations', description: 'Map out current camera placements and cable runs.', status: 'Completed', assignedStaff: [{ employeeId: 'EMP006', role: 'Lead Technician' }] },
    { id: 'JOB009', projectId: 'PROJ008', projectName: 'Hawkins High CCTV Upgrade', customerId: '4', customerName: 'State Education Dept.', siteId: 'S4A', title: 'Install Cat6 cabling', description: 'Run new Cat6 for all new camera locations.', status: 'In Progress', assignedStaff: [{ employeeId: 'EMP008', role: 'Apprentice' }] },
    { id: 'JOB010', projectId: 'PROJ008', projectName: 'Hawkins High CCTV Upgrade', customerId: '4', customerName: 'State Education Dept.', siteId: 'S4A', title: 'Mount 10x IP cameras', description: 'Mount and configure 10 new IP cameras.', status: 'Planned', assignedStaff: [{ employeeId: 'EMP006', role: 'Lead Technician' }, { employeeId: 'EMP008', role: 'Apprentice' }] },
];


async function seedDatabase() {
    console.log('Starting to seed database with Admin privileges...');
    const batch = db.batch();

    // Seed Employees
    const employeesCollection = db.collection('employees');
    mockEmployees.forEach(employee => {
        const docRef = employeesCollection.doc(employee.id);
        batch.set(docRef, employee);
    });
    console.log(`${mockEmployees.length} employees queued for seeding.`);

    // Seed Customers
    const customersCollection = db.collection('customers');
    mockCustomers.forEach(customerData => {
        const customerDocRef = customersCollection.doc(customerData.id);
        batch.set(customerDocRef, customerData);
    });
    console.log(`${mockCustomers.length} customers queued for seeding.`);
    
    // Seed Contacts (Subcollection)
    Object.entries(mockContacts).forEach(([customerId, contacts]) => {
        contacts.forEach(contact => {
            const contactDocRef = db.collection('customers').doc(customerId).collection('contacts').doc(contact.id);
            batch.set(contactDocRef, contact);
        });
        console.log(`Queued ${contacts.length} contacts for customer ${customerId}.`);
    });
    
    // Seed Sites (Subcollection)
    Object.entries(mockSites).forEach(([customerId, sites]) => {
        sites.forEach(site => {
            const siteDocRef = db.collection('customers').doc(customerId).collection('sites').doc(site.id);
            batch.set(siteDocRef, site);
        });
        console.log(`Queued ${sites.length} sites for customer ${customerId}.`);
    });

    // Seed Projects (Root Collection)
    const projectsCollection = db.collection('projects');
    mockProjects.forEach(project => {
        const { id, ...projectData } = project;
        const projectDocRef = projectsCollection.doc(id);
        batch.set(projectDocRef, {
            ...projectData,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });
    console.log(`${mockProjects.length} projects queued for seeding.`);
    
    // Seed Jobs (Root Collection)
    const jobsCollection = db.collection('jobs');
    mockJobs.forEach(job => {
        const { id, ...jobData } = job;
        const jobDocRef = jobsCollection.doc(id);
        batch.set(jobDocRef, {
            ...jobData,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });
    console.log(`Queued ${mockJobs.length} jobs for seeding.`);


    try {
        await batch.commit();
        console.log('Database seeded successfully!');
    } catch (e) {
        console.error('Error seeding database: ', e);
    }
}

seedDatabase();
