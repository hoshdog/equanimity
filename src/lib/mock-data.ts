
export const mockEmployees = [
    { value: 'EMP001', label: 'Alice Johnson' },
    { value: 'EMP002', label: 'Bob Smith' },
    { value: 'EMP003', label: 'Charlie Brown' },
    { value: 'EMP004', label: 'Diana Prince' },
    { value: 'EMP005', label: 'Ethan Hunt' },
];

export const employees = [
    { id: 'EMP001', name: 'Alice Johnson', email: 'alice.j@example.com', role: 'Project Manager', status: 'Active' },
    { id: 'EMP002', name: 'Bob Smith', email: 'bob.s@example.com', role: 'Lead Technician', status: 'Active' },
    { id: 'EMP003', name: 'Charlie Brown', email: 'charlie.b@example.com', role: 'Junior Technician', status: 'Active' },
    { id: 'EMP004', name: 'Diana Prince', email: 'diana.p@example.com', role: 'HR Specialist', status: 'On Leave' },
    { id: 'EMP005', name: 'Ethan Hunt', email: 'ethan.h@example.com', role: 'Field Technician', status: 'Inactive' },
];


export const mockCustomerDetails = {
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
    '3': { 
        id: '3', name: 'Greenleaf Cafe', address: '789 Garden St, Brisbane QLD 4000', type: 'Small Business',
        primaryContactName: 'Peter Chen', email: 'peter.chen@greenleaf.com', phone: '07 7777 6666',
        contacts: [
            { id: 'C3A', name: 'Peter Chen', emails: ['peter.chen@greenleaf.com'], phones: ['07 7777 6666'] },
        ],
        sites: [
             { id: 'S3A', name: 'Greenleaf Cafe', address: '789 Garden St, Brisbane QLD 4000', primaryContactId: 'C3A'},
        ],
        projects: [
            { id: 'P3A1', siteId: 'S3A', name: 'Kitchen Appliance Testing', status: 'Completed', value: 2500 },
        ]
     },
    '4': { 
        id: '4', name: 'State Gov Dept', address: '101 Parliament Pl, Canberra ACT 2600', type: 'Government',
        primaryContactName: 'Susan Reid', email: 's.reid@gov.au', phone: '02 6666 5555',
        contacts: [
            { id: 'C4A', name: 'Susan Reid', emails: ['s.reid@gov.au'], phones: ['02 6666 5555'] },
            { id: 'C4B', name: 'Mark Felton', emails: ['m.felton@gov.au'], phones: ['02 6666 5566'] },
        ],
        sites: [
             { id: 'S4A', name: 'Civic Building A', address: '101 Parliament Pl, Canberra ACT 2600', primaryContactId: 'C4A'},
             { id: 'S4B', name: 'Barton Office Complex', address: '4 National Circuit, Barton ACT 2600', primaryContactId: 'C4B'},
        ],
        projects: [
             { id: 'P4A1', siteId: 'S4A', name: 'Accessibility Ramp Electrics', status: 'On Hold', value: 8000 },
             { id: 'P4B1', siteId: 'S4B', name: 'Data Centre Maintenance', status: 'In Progress', value: 55000 },
        ]
     },
};
