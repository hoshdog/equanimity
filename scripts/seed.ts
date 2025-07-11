// scripts/seed.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
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
    { id: 'EMP001', name: 'Alice Johnson', email: 'alice.j@example.com', role: 'Project Manager', status: 'Active' },
    { id: 'EMP002', name: 'Bob Smith', email: 'bob.s@example.com', role: 'Lead Technician', status: 'Active' },
    { id: 'EMP003', name: 'Charlie Brown', email: 'charlie.b@example.com', role: 'Junior Technician', status: 'Active' },
    { id: 'EMP004', name: 'Diana Prince', email: 'diana.p@example.com', role: 'HR Specialist', status: 'On Leave' },
    { id: 'EMP005', name: 'Ethan Hunt', email: 'ethan.h@example.com', role: 'Field Technician', status: 'Inactive' },
];

const mockCustomerDetails = {
    '1': { 
        id: '1', name: 'Innovate Corp', address: '123 Tech Park, Sydney NSW 2000', type: 'Corporate Client',
        primaryContactName: 'John Doe', email: 'john.doe@innovate.com', phone: '02 9999 8888',
        contacts: [
            { id: 'C1A', name: 'John Doe', emails: ['john.doe@innovate.com'], phones: ['02 9999 8888'] },
            { id: 'C1B', name: 'Sarah Lee', emails: ['sarah.lee@innovate.com', 's.lee.personal@email.com'], phones: ['02 9999 8889'] },
        ],
        sites: [
            { id: 'S1A', name: 'Sydney HQ', address: '123 Tech Park, Sydney NSW 2000', primaryContactId: 'C1A' },
            { id: 'S1B', name: 'Melbourne Office', address: '55 Collins St, Melbourne VIC 3000', primaryContactId: 'C1B' },
        ],
        projects: [
            { id: 'P1A1', siteId: 'S1A', name: 'Website Redesign', status: 'In Progress', value: 25000 },
            { id: 'P1A2', siteId: 'S1A', name: 'Server Upgrade', status: 'Completed', value: 15000 },
            { id: 'P1B1', siteId: 'S1B', name: 'Office Network Setup', status: 'Planning', value: 35000 },
        ]
    },
    '2': { 
        id: '2', name: 'Builders Pty Ltd', address: '456 Construction Ave, Melbourne VIC 3000', type: 'Construction Partner',
        primaryContactName: 'Jane Smith', email: 'jane.smith@builders.com', phone: '03 8888 7777',
         contacts: [
            { id: 'C2A', name: 'Jane Smith', emails: ['jane.smith@builders.com'], phones: ['03 8888 7777'] },
        ],
        sites: [
            { id: 'S2A', name: 'Main Yard', address: '456 Construction Ave, Melbourne VIC 3000', primaryContactId: 'C2A'},
        ],
        projects: [
            { id: 'P2A1', siteId: 'S2A', name: 'New Apartment Complex Wiring', status: 'In Progress', value: 120000 },
            { id: 'P2A2', siteId: 'S2A', name: 'Security System Install', status: 'In Progress', value: 18000 },
        ]
     },
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
    console.log('Employees queued for seeding.');

    // Seed Customers and their subcollections
    const customersCollection = collection(db, 'customers');
    Object.values(mockCustomerDetails).forEach(customerData => {
        const { contacts, sites, projects, ...customerCoreData } = customerData;
        
        const customerDocRef = doc(customersCollection, customerCoreData.id);
        batch.set(customerDocRef, customerCoreData);

        contacts.forEach(contact => {
            const contactDocRef = doc(db, 'customers', customerCoreData.id, 'contacts', contact.id);
            batch.set(contactDocRef, contact);
        });

        sites.forEach(site => {
            const siteDocRef = doc(db, 'customers', customerCoreData.id, 'sites', site.id);
            batch.set(siteDocRef, site);
        });

        projects.forEach(project => {
            const projectDocRef = doc(db, 'customers', customerCoreData.id, 'projects', project.id);
            batch.set(projectDocRef, project);
        });
    });
    console.log('Customers and subcollections queued for seeding.');


    try {
        await batch.commit();
        console.log('Database seeded successfully!');
    } catch (e) {
        console.error('Error seeding database: ', e);
    }
}

seedDatabase();
