import { useState, useCallback } from "react";
import { Plus, Eye, Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import FormFieldItem from "./FormFieldItem";
import FieldTypePicker from "./FieldTypePicker";
import FormPreview from "./FormPreview";
import type { FormFieldInput, FormFieldType } from "@/services/eventFormService";

export interface FormBuilderField extends FormFieldInput {
  tempId: string;
}

interface FormBuilderProps {
  fields: FormBuilderField[];
  onChange: (fields: FormBuilderField[]) => void;
  eventTitle?: string;
}

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const FormBuilder = ({ fields, onChange, eventTitle }: FormBuilderProps) => {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const addField = useCallback((type: FormFieldType) => {
    const defaultOptions = ['select', 'radio', 'checkbox'].includes(type)
      ? [{ label: 'Option 1', value: 'option_1' }]
      : undefined;

    const newField: FormBuilderField = {
      tempId: generateTempId(),
      field_type: type,
      label: '',
      description: undefined,
      placeholder: undefined,
      is_required: false,
      field_order: fields.length,
      options: defaultOptions,
      validation_rules: undefined,
      conditional_logic: undefined,
    };

    onChange([...fields, newField]);
  }, [fields, onChange]);

  const updateField = useCallback((tempId: string, updates: Partial<FormFieldInput>) => {
    onChange(
      fields.map(f => f.tempId === tempId ? { ...f, ...updates } : f)
    );
  }, [fields, onChange]);

  const deleteField = useCallback((tempId: string) => {
    onChange(fields.filter(f => f.tempId !== tempId));
  }, [fields, onChange]);

  const moveField = useCallback((fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= fields.length) return;

    const newFields = [...fields];
    const [removed] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, removed);
    
    // Update field_order values
    const updatedFields = newFields.map((f, i) => ({ ...f, field_order: i }));
    onChange(updatedFields);
  }, [fields, onChange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Registration Form Builder
            </CardTitle>
            <CardDescription>
              Create custom fields for your event registration form
            </CardDescription>
          </div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === "edit" ? (
          <div className="space-y-4">
            {/* Field List */}
            {fields.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No custom fields yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add fields to collect additional information from registrants
                </p>
                <FieldTypePicker onSelect={addField} />
              </div>
            ) : (
              <ScrollArea className="max-h-[500px] pr-4">
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <FormFieldItem
                      key={field.tempId}
                      field={field}
                      index={index}
                      onUpdate={updateField}
                      onDelete={deleteField}
                      onMoveUp={() => moveField(index, 'up')}
                      onMoveDown={() => moveField(index, 'down')}
                      isFirst={index === 0}
                      isLast={index === fields.length - 1}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Add Field Button */}
            {fields.length > 0 && (
              <div className="flex justify-center pt-4 border-t">
                <FieldTypePicker onSelect={addField} />
              </div>
            )}

            {/* Info text */}
            <p className="text-xs text-muted-foreground text-center">
              Basic fields (Name, Email, College) are collected automatically. 
              Add custom fields here for event-specific information.
            </p>
          </div>
        ) : (
          <FormPreview fields={fields} eventTitle={eventTitle} />
        )}
      </CardContent>
    </Card>
  );
};

export default FormBuilder;
