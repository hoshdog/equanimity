// scripts/seed.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const mockEmployees = [
    { id: 'EMP001', name: 'Alice Johnson', email: 'alice.j@example.com', role: 'Project Manager', status: 'Active', wage: 55, employmentType: 'Full-time', isOverhead: true },
    { id: 'EMP002', name: 'Bob Smith', email: 'bob.s@example.com', role: 'Lead Technician', status: 'Active', wage: 50, employmentType: 'Full-time', isOverhead: false },
    { id: 'EMP003', name: 'Charlie Brown', email: 'charlie.b@example.com', role: 'Technician', status: 'Active', wage: 42, employmentType: 'Full-time', isOverhead: false },
    { id: 'EMP004', name: 'Diana Prince', email: 'diana.p@example.com', role: 'HR Specialist', status: 'On Leave', wage: 40, employmentType: 'Full-time', isOverhead: true },
    { id: 'EMP005', name: 'Ethan Hunt', email: 'ethan.h@example.com', role: 'Technician', status: 'Inactive', wage: 40, employmentType: 'Casual', isOverhead: false },
    { id: 'EMP006', name: 'Fiona Glenanne', email: 'fiona.g@example.com', role: 'Lead Technician', status: 'Active', wage: 52, employmentType: 'Full-time', isOverhead: false },
    { id: 'EMP007', name: 'George Costanza', email: 'george.c@example.com', role: 'Sales Manager', status: 'Active', wage: 48, employmentType: 'Full-time', isOverhead: true },
    { id: 'EMP008', name: 'Hannah Montana', email: 'hannah.m@example.com', role: 'Apprentice', status: 'Active', wage: 25, employmentType: 'Full-time', isOverhead: false },
    { id: 'EMP009', name: 'Ian Malcolm', email: 'ian.m@example.com', role: 'Compliance Officer', status: 'Active', wage: 60, employmentType: 'Full-time', isOverhead: true },
    { id: 'EMP010', name: 'Jane Doe', email: 'jane.d@example.com', role: 'CEO', status: 'Active', wage: 90, employmentType: 'Full-time', isOverhead: true },
    { id: 'EMP011', name: 'Kevin McCallister', email: 'kevin.m@example.com', role: 'IT Support', status: 'Active', wage: 38, employmentType: 'Full-time', isOverhead: false },
    { id: 'EMP012', name: 'Laura Palmer', email: 'laura.p@example.com', role: 'Office Administrator', status: 'Active', wage: 35, employmentType: 'Part-time', isOverhead: true },
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
    { id: 'PROJ001', name: 'Website Redesign', description: 'Complete overhaul of the corporate website.', customerId: '1', siteId: 'S1A', status: 'In Progress' },
    { id: 'PROJ002', name: 'Server Upgrade', description: 'Upgrade all production servers.', customerId: '1', siteId: 'S1A', status: 'Completed' },
    { id: 'PROJ003', name: 'Office Network Setup', description: 'New network infrastructure for Melbourne office.', customerId: '1', siteId: 'S1B', status: 'Planning' },
    // Builders Pty Ltd Projects
    { id: 'PROJ004', name: 'New Apartment Complex Wiring', description: 'Electrical wiring for a 50-unit complex.', customerId: '2', siteId: 'S2B', status: 'In Progress' },
    { id: 'PROJ005', name: 'Main Yard Security System', description: 'Install new security cameras and alarm system.', customerId: '2', siteId: 'S2A', status: 'On Hold' },
    // Greenleaf Cafe Projects
    { id: 'PROJ006', name: 'Kitchen Appliance Test & Tag', description: 'Annual safety check for all kitchen equipment.', customerId: '3', siteId: 'S3A', status: 'Completed' },
    { id: 'PROJ007', name: 'POS System Upgrade', description: 'Install new Point of Sale hardware and software.', customerId: '3', siteId: 'S3A', status: 'Planning' },
    // State Education Dept. Projects
    { id: 'PROJ008', name: 'Hawkins High CCTV Upgrade', description: 'Upgrade all CCTV cameras to digital IP.', customerId: '4', siteId: 'S4A', status: 'In Progress' },
    { id: 'PROJ009', name: 'Starcourt Primary PA System', description: 'Install new public address system.', customerId: '4', siteId: 'S4B', status: 'Planning' },
    // Oceanic Airlines Projects
    { id: 'PROJ010', name: 'Hangar 5 Lighting Retrofit', description: 'Replace all hangar lighting with LEDs.', customerId: '5', siteId: 'S5A', status: 'Completed' },
];

const mockJobs = {
    'PROJ001': [
        { id: 'JOB001', description: 'Design new homepage mockup', status: 'Completed', technicianId: 'EMP001' },
        { id: 'JOB002', description: 'Develop frontend components', status: 'In Progress', technicianId: 'EMP006' },
        { id: 'JOB003', description: 'Setup staging server', status: 'Not Started', technicianId: 'EMP011' },
    ],
    'PROJ004': [
        { id: 'JOB004', description: 'Run conduit for Level 1', status: 'In Progress', technicianId: 'EMP002' },
        { id: 'JOB005', description: 'Pull cabling for Level 1', status: 'Not Started', technicianId: 'EMP003' },
        { id: 'JOB006', description: 'Install distribution board', status: 'Not Started', technicianId: 'EMP002' },
    ],
    'PROJ006': [
        { id: 'JOB007', description: 'Test and tag all kitchen appliances', status: 'Completed', technicianId: 'EMP005' },
    ],
    'PROJ008': [
        { id: 'JOB008', description: 'Audit existing camera locations', status: 'Completed', technicianId: 'EMP006' },
        { id: 'JOB009', description: 'Install Cat6 cabling for new cameras', status: 'In Progress', technicianId: 'EMP008' },
        { id: 'JOB010', description: 'Mount and configure 10x IP cameras', status: 'Not Started', technicianId: 'EMP006' },
    ],
};

async function seedDatabase() {
    console.log('Starting to seed database...');
    const batch = writeBatch(db);

    // Seed Employees
    const employeesCollection = collection(db, 'employees');
    mockEmployees.forEach(employee => {
        const docRef = doc(employeesCollection, employee.id);
        batch.set(docRef, employee);
    });
    console.log(`${mockEmployees.length} employees queued for seeding.`);

    // Seed Customers
    const customersCollection = collection(db, 'customers');
    mockCustomers.forEach(customerData => {
        const customerDocRef = doc(customersCollection, customerData.id);
        batch.set(customerDocRef, customerData);
    });
    console.log(`${mockCustomers.length} customers queued for seeding.`);
    
    // Seed Contacts (Subcollection)
    Object.entries(mockContacts).forEach(([customerId, contacts]) => {
        contacts.forEach(contact => {
            const contactDocRef = doc(db, 'customers', customerId, 'contacts', contact.id);
            batch.set(contactDocRef, contact);
        });
        console.log(`Queued ${contacts.length} contacts for customer ${customerId}.`);
    });
    
    // Seed Sites (Subcollection)
    Object.entries(mockSites).forEach(([customerId, sites]) => {
        sites.forEach(site => {
            const siteDocRef = doc(db, 'customers', customerId, 'sites', site.id);
            batch.set(siteDocRef, site);
        });
        console.log(`Queued ${sites.length} sites for customer ${customerId}.`);
    });

    // Seed Projects (Root Collection)
    const projectsCollection = collection(db, 'projects');
    mockProjects.forEach(project => {
        const { id, ...projectData } = project;
        const projectDocRef = doc(projectsCollection, id);
        batch.set(projectDocRef, {
            ...projectData,
            createdAt: serverTimestamp()
        });
    });
    console.log(`${mockProjects.length} projects queued for seeding.`);
    
    // Seed Jobs (Subcollection of Projects)
    Object.entries(mockJobs).forEach(([projectId, jobs]) => {
        jobs.forEach(job => {
            const { id, ...jobData } = job;
            const jobDocRef = doc(db, 'projects', projectId, 'jobs', id);
            batch.set(jobDocRef, jobData);
        });
        console.log(`Queued ${jobs.length} jobs for project ${projectId}.`);
    });


    try {
        await batch.commit();
        console.log('Database seeded successfully!');
    } catch (e) {
        console.error('Error seeding database: ', e);
    }
}

seedDatabase();
