import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Building2, Phone, Mail, User } from "lucide-react";
import Link from "next/link";

export default function CustomersPage() {
    const customers = [
        { id: '1', name: 'Innovate Corp', address: '123 Tech Park, Sydney NSW 2000', primaryContact: 'John Doe', email: 'john.doe@innovate.com', phone: '02 9999 8888', type: 'Corporate Client' },
        { id: '2', name: 'Builders Pty Ltd', address: '456 Construction Ave, Melbourne VIC 3000', primaryContact: 'Jane Smith', email: 'jane.smith@builders.com', phone: '03 8888 7777', type: 'Construction Partner' },
        { id: '3', name: 'Greenleaf Cafe', address: '789 Garden St, Brisbane QLD 4000', primaryContact: 'Peter Chen', email: 'peter.chen@greenleaf.com', phone: '07 7777 6666', type: 'Small Business' },
        { id: '4', name: 'State Gov Dept', address: '101 Parliament Pl, Canberra ACT 2600', primaryContact: 'Susan Reid', email: 's.reid@gov.au', phone: '02 6666 5555', type: 'Government' },
    ];
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Customer
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {customers.map(customer => (
            <Link href={`/customers/${customer.id}`} key={customer.id}>
                <Card className="hover:border-primary transition-colors h-full">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary"/>
                                    {customer.name}
                                </CardTitle>
                                <CardDescription>{customer.address}</CardDescription>
                            </div>
                            <Badge variant="secondary">{customer.type}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="text-sm text-muted-foreground space-y-2">
                             <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>Primary Contact: {customer.primaryContact}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                 <span className="hover:underline">{customer.email}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{customer.phone}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        ))}
      </div>
    </div>
  );
}
