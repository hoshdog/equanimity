'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Building2, MapPin, Briefcase, AlertCircle } from 'lucide-react';
import { SearchableCombobox } from '@/components/ui/SearchableCombobox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useQuoteFormContext } from '../../../context/QuoteFormContext';
import { AddCustomerDialog } from '../../AddCustomerDialog';
import { AddSiteDialog } from '../../AddSiteDialog';
import { AddProjectDialog } from '../../AddProjectDialog';
import type { QuoteFormData } from '../../../types/quote.types';
import type { Contact, Site, Project } from '@/lib/types';

interface CustomerProjectStepProps {
  data: Partial<QuoteFormData>;
  onChange: (updates: Partial<QuoteFormData>) => void;
}

export function CustomerProjectStep({ data, onChange }: CustomerProjectStepProps) {
  const { customers, sites, projects, loadCustomerData, addCustomer, addSite, addProject } = useQuoteFormContext();
  const [selectedCustomer, setSelectedCustomer] = useState(data.customerId || '');
  const [selectedSite, setSelectedSite] = useState(data.siteId || '');
  const [selectedProject, setSelectedProject] = useState(data.projectId || '');
  const [quoteType, setQuoteType] = useState(data.quoteType || 'new-project');
  const [priority, setPriority] = useState(data.priority || 'standard');
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [showAddSiteDialog, setShowAddSiteDialog] = useState(false);
  const [showAddProjectDialog, setShowAddProjectDialog] = useState(false);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerData(selectedCustomer);
    }
  }, [selectedCustomer, loadCustomerData]);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId);
    setSelectedSite(''); // Reset site when customer changes
    setSelectedProject(''); // Reset project when customer changes
    onChange({ 
      customerId, 
      siteId: undefined, 
      projectId: undefined 
    });
  };

  const handleCustomerAdded = async (customer: Contact) => {
    await addCustomer(customer);
    setSelectedCustomer(customer.id);
    onChange({ customerId: customer.id });
    if (customer.id) {
      loadCustomerData(customer.id);
    }
  };

  const handleSiteAdded = async (site: Site) => {
    await addSite(site);
    setSelectedSite(site.id);
    onChange({ siteId: site.id });
  };

  const handleProjectAdded = async (project: Project) => {
    await addProject(project);
    setSelectedProject(project.id);
    onChange({ projectId: project.id });
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSite(siteId);
    onChange({ siteId });
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    onChange({ projectId });
  };

  const handleQuoteTypeChange = (value: string) => {
    setQuoteType(value as QuoteFormData['quoteType']);
    onChange({ quoteType: value as QuoteFormData['quoteType'] });
  };

  const handlePriorityChange = (value: string) => {
    setPriority(value as QuoteFormData['priority']);
    onChange({ priority: value as QuoteFormData['priority'] });
  };

  const customerOptions = customers.map(c => ({
    value: c.id,
    label: c.displayName,
  }));

  const siteOptions = sites
    .filter(s => !selectedCustomer || s.customerId === selectedCustomer)
    .map(s => ({
      value: s.id,
      label: s.name,
    }));

  const projectOptions = projects
    .filter(p => !selectedCustomer || p.customerId === selectedCustomer)
    .map(p => ({
      value: p.id,
      label: `${p.name} (${p.code})`,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Customer & Project Information</h2>
        <p className="text-muted-foreground">
          Start by selecting the customer and project details for this quote.
        </p>
      </div>

      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Customer
          </CardTitle>
          <CardDescription>
            Select an existing customer or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchableCombobox
                options={customerOptions}
                value={selectedCustomer}
                onChange={handleCustomerChange}
                placeholder="Search for a customer..."
                className="w-full"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowAddCustomerDialog(true)}
              title="Add New Customer"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {selectedCustomer && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Customer selected. You can now choose a site and project.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Site Selection */}
      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Site Location
              <Badge variant="outline" className="ml-2">Optional</Badge>
            </CardTitle>
            <CardDescription>
              Select the site where the work will be performed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchableCombobox
                  options={siteOptions}
                  value={selectedSite}
                  onChange={handleSiteChange}
                  placeholder="Select a site (optional)..."
                  className="w-full"
                />
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowAddSiteDialog(true)}
                title="Add New Site"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Selection */}
      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Project
              <Badge variant="outline" className="ml-2">Optional</Badge>
            </CardTitle>
            <CardDescription>
              Link this quote to an existing project or it will create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchableCombobox
                  options={projectOptions}
                  value={selectedProject}
                  onChange={handleProjectChange}
                  placeholder="Select an existing project..."
                  className="w-full"
                />
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowAddProjectDialog(true)}
                title="Create New Project"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quote Type & Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quote Type</CardTitle>
            <CardDescription>
              What kind of work is this quote for?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={quoteType} onValueChange={handleQuoteTypeChange}>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new-project" id="new-project" />
                  <Label htmlFor="new-project">New Project</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing-project" id="existing-project" />
                  <Label htmlFor="existing-project">Existing Project</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="maintenance" id="maintenance" />
                  <Label htmlFor="maintenance">Maintenance</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="consultation" id="consultation" />
                  <Label htmlFor="consultation">Consultation</Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Level</CardTitle>
            <CardDescription>
              How urgent is this quote?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={priority} onValueChange={handlePriorityChange}>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low">Low Priority</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard">Standard</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent">Urgent</Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      {/* Add Customer Dialog */}
      <AddCustomerDialog
        open={showAddCustomerDialog}
        onOpenChange={setShowAddCustomerDialog}
        onCustomerAdded={handleCustomerAdded}
      />

      {/* Add Site Dialog */}
      {selectedCustomer && (
        <AddSiteDialog
          open={showAddSiteDialog}
          onOpenChange={setShowAddSiteDialog}
          onSiteAdded={handleSiteAdded}
          customerId={selectedCustomer}
        />
      )}

      {/* Add Project Dialog */}
      {selectedCustomer && (
        <AddProjectDialog
          open={showAddProjectDialog}
          onOpenChange={setShowAddProjectDialog}
          onProjectAdded={handleProjectAdded}
          customerId={selectedCustomer}
          siteId={selectedSite}
        />
      )}
    </div>
  );
}