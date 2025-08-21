// src/components/forms/item-creation-form.tsx
'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FieldConfig {
    name: string;
    label: string;
    type: 'input' | 'textarea' | 'select';
    placeholder?: string;
    options?: { value: string; label: string }[];
}

interface ItemCreationFormProps {
    fields: readonly FieldConfig[];
}

export function ItemCreationForm({ fields }: ItemCreationFormProps) {
    const { control } = useFormContext();

    return (
        <>
            {fields.map((fieldConfig) => (
                <FormField
                    key={fieldConfig.name}
                    control={control}
                    name={fieldConfig.name}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{fieldConfig.label}</FormLabel>
                            <FormControl>
                                {fieldConfig.type === 'input' && <Input placeholder={fieldConfig.placeholder} {...field} />}
                                {fieldConfig.type === 'textarea' && <Textarea placeholder={fieldConfig.placeholder} {...field} />}
                                {fieldConfig.type === 'select' && (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={fieldConfig.placeholder} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {fieldConfig.options?.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            ))}
        </>
    );
}
