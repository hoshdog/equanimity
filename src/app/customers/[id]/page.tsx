// src/app/customers/[id]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, User, Mail, Phone, Briefcase, PlusCircle, MapPin, MinusCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { addSite, addContact, addProjectToCustomer, getCustomer, getCustomerContacts, getCustomerSites, getCustomerProjects } from '@/lib/customers';
import { addProject } from '@/lib/projects';
import type { Customer, Contact, Site, ProjectSummary, OptionType } from '@/lib/types';
import { Combobox } from '@/components/ui/combobox';

interface CustomerPageProps {
  params: { id: string };
}

const siteSchema = z.object({
  name: z.string().min(2, "Site name must be at least 2 characters."),
  address: z.string().min(10, "Address must be at least 10 characters."),
  primaryContactId: z.string().min(1, "You must select a primary contact."),
});

const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters."),
  siteId: z.string().min(1, "You must select a site for the project."),
  status: z.string().min(2, "Please select a status."),
});

const contactSchema = z.object({
  name: z.string().min(2, "Contact name must be at least 2 characters."),
  emails: z.array(z.object({ value: z.string().email("Please enter a valid email address.") })).min(1, "At least one email is required."),
  phones: z.array(z.object({ value: z.string().min(8, "Phone number seems too short.") })).min(1, "At least one phone number is required."),
  siteId: z.string().optional(),
});

const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'text-yellow-600';
      case 'Planning': return 'text-blue-600';
      case 'Completed': return 'text-green-600';
      case 'On Hold': return 'text-gray-600';
      default: return 'text-gray-500';
    }
}

export default function CustomerDetailPage({ params }: CustomerPageProps) {
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomerData() {
        setLoading(true);
        try {
            const customerId = params.id;
            const [customerData, contactsData, sitesData, projectsData] = await Promise.all([
                getCustomer(customerId),
                getCustomerContacts(customerId),
                getCustomerSites(customerId),
                getCustomerProjects(customerId),
            ]);
            
            setCustomer(customerData);
            setContacts(contactsData);
            setSites(sitesData);
            setProjects(projectsData);

            if (sitesData.length > 0) {
                setSelectedSiteId(sitesData[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch customer details:", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to load customer details." });
        } finally {
            setLoading(false);
        }
    }
    fetchCustomerData();
  }, [params.id, toast]);


  const primaryContact = useMemo(() => {
    if (!customer || !sites.length) return null;
    const site = sites.find(s => s.id === selectedSiteId);
    return contacts.find(c => c.id === site?.primaryContactId) || contacts[0];
  }, [customer, sites, contacts, selectedSiteId]);

  const [isSiteDialogOpen, setIsSiteDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  const siteForm = useForm<z.infer<typeof siteSchema>>({ resolver: zodResolver(siteSchema), defaultValues: { name: "", address: "", primaryContactId: "" } });
  const projectForm = useForm<z.infer<typeof projectSchema>>({ resolver: zodResolver(projectSchema), defaultValues: { name: "", siteId: "", status: "Planning" } });
  const contactForm = useForm<z.infer<typeof contactSchema>>({ resolver: zodResolver(contactSchema), defaultValues: { name: "", emails: [{ value: "" }], phones: [{ value: "" }], siteId: "" } });

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({ control: contactForm.control, name: "emails" });
  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({ control: contactForm.control, name: "phones" });

  const handleAddSite = async (values: z.infer<typeof siteSchema>) => {
    if (!customer) return;
    try {
      const newSiteId = await addSite(customer.id, values);
      setSites(prev => [...prev, { id: newSiteId, ...values }]);
      toast({ title: "Site Added", description: `"${values.name}" has been added.` });
      setIsSiteDialogOpen(false);
      siteForm.reset();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add site." });
    }
  };

  const handleAddProject = async (values: z.infer<typeof projectSchema>) => {
    if (!customer) return;
    try {
      // This is simplified. `addProject` is more complex now.
      // This part would need to be updated to match the new `addProject` signature if it was fully functional.
      const newProject: Omit<ProjectSummary, 'id'> = { name: values.name, status: values.status, value: 0 };
      const newProjectId = await addProjectToCustomer(customer.id, newProject);
      setProjects(prev => [...prev, { id: newProjectId, ...newProject }]);
      toast({ title: "Project Added", description: `"${values.name}" has been created.` });
      setIsProjectDialogOpen(false);
      projectForm.reset();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add project." });
    }
  }

  const handleAddContact = async (values: z.infer<typeof contactSchema>) => {
    if (!customer) return;
    try {
      const contactData = { name: values.name, emails: values.emails.map(e => e.value), phones: values.phones.map(p => p.value) };
      const newContactId = await addContact(customer.id, contactData);
      setContacts(prev => [...prev, { id: newContactId, ...contactData }]);
      toast({ title: "Contact Added", description: `"${values.name}" has been added.` });
      setIsContactDialogOpen(false);
      contactForm.reset({ name: "", emails: [{ value: "" }], phones: [{ value: "" }], siteId: "" });
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "Failed to add contact." });
    }
  }

  const contactOptions = useMemo(() => {
    return contacts.map(contact => ({ label: contact.name, value: contact.id }));
  }, [contacts]);
  
  const siteOptions = useMemo(() => {
    return sites.map(site => ({ label: site.name, value: site.id }));
  }, [sites]);


  if (loading) {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex items-center justify-center h-full">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  if (!customer) {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Customer Not Found</h2>
            <p>The customer you are looking for does not exist.</p>
            <Button asChild>
                <Link href="/customers"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Customers</Link>
            </Button>
        </div>
    );
  }

  const filteredProjects = projects.filter(p => sites.find(s => s.id === selectedSiteId)?.projects?.some(proj => proj.id === p.id));


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-start md:items-center space-x-4 mb-4">
             <Button asChild variant="outline" size="icon" className="shrink-0">
                <Link href="/customers">
                    <ArrowLeft className="h-4 w-4"/>
                    <span className="sr-only">Back to Customers</span>
                </Link>
            </Button>
            <div>
                <h2 className="text-3xl font-bold tracking-tight flex items-start md:items-center gap-3">
                    <Building2 className="h-8 w-8 text-primary mt-1 md:mt-0 shrink-0"/>
                    {customer.name}
                </h2>
                <p className="text-muted-foreground">{customer.address}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Admin & Primary Contact</CardTitle>
                    </CardHeader>
                    {primaryContact ? (
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{primaryContact.name}</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                                <div className='flex flex-col'>
                                  {primaryContact.emails.map(email => <a key={email} href={`mailto:${email}`} className="hover:underline break-all">{email}</a>)}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                                <div className='flex flex-col'>
                                  {primaryContact.phones.map(phone => <span key={phone}>{phone}</span>)}
                                </div>
                            </div>
                            <div>
                               <Badge variant="secondary">{customer.type}</Badge>
                            </div>
                        </CardContent>
                    ) : (
                         <CardContent><p className="text-sm text-muted-foreground">No primary contact assigned.</p></CardContent>
                    )}
                </Card>
            </div>
            <div className="lg:col-span-2">
                 <Tabs defaultValue="sites" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="sites">Sites</TabsTrigger>
                        <TabsTrigger value="projects">All Projects</TabsTrigger>
                        <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    </TabsList>
                    <TabsContent value="sites">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1 space-y-2">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-lg">Sites</h3>
                                    <Dialog open={isSiteDialogOpen} onOpenChange={setIsSiteDialogOpen}>
                                        <DialogTrigger asChild><Button variant="ghost" size="icon"><PlusCircle className="h-5 w-5"/></Button></DialogTrigger>
                                        <DialogContent><DialogHeader><DialogTitle>Add New Site</DialogTitle><DialogDescription>Add a new site for {customer.name}.</DialogDescription></DialogHeader>
                                            <Form {...siteForm}><form onSubmit={siteForm.handleSubmit(handleAddSite)} className="space-y-4">
                                                <FormField control={siteForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Site Name</FormLabel><FormControl><Input placeholder="e.g., Melbourne Office" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                <FormField control={siteForm.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Site Address</FormLabel><FormControl><Input placeholder="e.g., 55 Collins St, Melbourne" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                <FormField control={siteForm.control} name="primaryContactId" render={({ field }) => (
                                                  <FormItem className="flex flex-col"><FormLabel>Primary Contact</FormLabel>
                                                    <Combobox
                                                        options={contactOptions as OptionType[]}
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Select a contact"
                                                    />
                                                  <FormMessage /></FormItem> )}/>
                                                <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose><Button type="submit">Add Site</Button></DialogFooter>
                                            </form></Form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                {sites.map(site => {
                                    const contact = contacts.find(c => c.id === site.primaryContactId);
                                    return (
                                        <button key={site.id} onClick={() => setSelectedSiteId(site.id)} className={cn("w-full text-left p-3 rounded-md border", selectedSiteId === site.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent")}>
                                            <div className="font-semibold">{site.name}</div>
                                            <div className={cn("text-xs mb-2", selectedSiteId === site.id ? "text-primary-foreground/80" : "text-muted-foreground")}>{site.address}</div>
                                            {contact && (
                                                <div className="text-xs flex items-center gap-1 border-t pt-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                                    <User className="h-3 w-3" />
                                                    <span>{contact.name}</span>
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                             <div className="md:col-span-2">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-lg">Projects for {sites.find(s => s.id === selectedSiteId)?.name || 'Selected Site'}</h3>
                                </div>
                                
                                {filteredProjects.length > 0 ? (
                                    <div className="space-y-2">
                                        {filteredProjects.map(project => (
                                             <Link href={`/projects/${project.id}`} key={project.id}>
                                                <Card className="hover:border-primary transition-colors">
                                                    <CardContent className="p-4">
                                                        <div className="font-semibold">{project.name}</div>
                                                        <span className={cn("text-sm", getStatusColor(project.status))}>{project.status}</span>
                                                    </CardContent>
                                                </Card>
                                             </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                                        <Briefcase className="h-12 w-12 text-muted-foreground" />
                                        <p className="mt-4 text-sm text-muted-foreground">No projects for this site.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="projects">
                        <Card>
                             <CardHeader className="flex flex-row items-center justify-between">
                                <div className="space-y-1.5">
                                    <CardTitle>All Projects for {customer.name}</CardTitle>
                                    <CardDescription>A list of all projects across all sites for this customer.</CardDescription>
                                </div>
                                 {/* Add Project Dialog would go here, but it's more complex with DB */}
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {projects.length > 0 ? projects.map(project => (
                                    <Link href={`/projects/${project.id}`} key={project.id}>
                                        <Card className="hover:border-primary transition-colors">
                                             <CardContent className="p-4 flex justify-between items-center">
                                                <div>
                                                    <div className="font-semibold">{project.name}</div>
                                                    <div className={cn("text-sm", getStatusColor(project.status))}>{project.status}</div>
                                                </div>
                                                <Badge variant="outline">{sites.find(s => s.projects?.some(p => p.id === project.id))?.name}</Badge>
                                             </CardContent>
                                        </Card>
                                    </Link>
                                )) : (
                                     <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                                        <Briefcase className="h-12 w-12 text-muted-foreground" />
                                        <p className="mt-4 text-sm text-muted-foreground">This customer has no projects yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                     <TabsContent value="contacts">
                        <Card>
                             <CardHeader className="flex flex-row items-center justify-between">
                                <div className="space-y-1.5">
                                    <CardTitle>Contacts at {customer.name}</CardTitle>
                                    <CardDescription>Manage all contact persons for this customer.</CardDescription>
                                </div>
                                <Dialog open={isContactDialogOpen} onOpenChange={(open) => { setIsContactDialogOpen(open); if (!open) contactForm.reset({ name: "", emails: [{ value: "" }], phones: [{ value: "" }], siteId: "" }); }}>
                                    <DialogTrigger asChild><Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4"/>New Contact</Button></DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader><DialogTitle>Add New Contact</DialogTitle><DialogDescription>Add a new contact person for {customer.name}.</DialogDescription></DialogHeader>
                                        <Form {...contactForm}>
                                          <form onSubmit={contactForm.handleSubmit(handleAddContact)} className="space-y-4">
                                            <FormField control={contactForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                            
                                            <div>
                                                <FormLabel>Email Addresses</FormLabel>
                                                {emailFields.map((field, index) => (
                                                  <FormField key={field.id} control={contactForm.control} name={`emails.${index}.value`} render={({ field }) => (
                                                    <FormItem className="flex items-center gap-2 mt-1">
                                                      <FormControl><Input placeholder="jane.doe@example.com" {...field} /></FormControl>
                                                      <Button type="button" variant="ghost" size="icon" disabled={emailFields.length <= 1} onClick={() => removeEmail(index)}>
                                                        <MinusCircle className="h-5 w-5 text-destructive"/>
                                                      </Button>
                                                    </FormItem>
                                                  )}/>
                                                ))}
                                                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendEmail({ value: "" })}>
                                                    <PlusCircle className="mr-2 h-4 w-4"/>Add Email
                                                </Button>
                                            </div>

                                            <div>
                                                <FormLabel>Phone Numbers</FormLabel>
                                                {phoneFields.map((field, index) => (
                                                  <FormField key={field.id} control={contactForm.control} name={`phones.${index}.value`} render={({ field }) => (
                                                    <FormItem className="flex items-center gap-2 mt-1">
                                                      <FormControl><Input placeholder="0412 345 678" {...field} /></FormControl>
                                                      <Button type="button" variant="ghost" size="icon" disabled={phoneFields.length <= 1} onClick={() => removePhone(index)}>
                                                        <MinusCircle className="h-5 w-5 text-destructive"/>
                                                      </Button>
                                                    </FormItem>
                                                  )}/>
                                                ))}
                                                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendPhone({ value: "" })}>
                                                    <PlusCircle className="mr-2 h-4 w-4"/>Add Phone
                                                </Button>
                                            </div>
                                            
                                            <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose><Button type="submit">Add Contact</Button></DialogFooter>
                                          </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {contacts.map(contact => (
                                            <TableRow key={contact.id}>
                                                <TableCell className="font-medium">{contact.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        {contact.emails.map(email => <span key={email}>{email}</span>)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        {contact.phones.map(phone => <span key={phone}>{phone}</span>)}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    </div>
  );
}

    