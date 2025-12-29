import { useState } from "react";
import { GripVertical, Trash2, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { FormFieldInput, FieldOption, FormFieldType } from "@/services/eventFormService";
import { FIELD_TYPES } from "@/services/eventFormService";

interface FormFieldItemProps {
  field: FormFieldInput & { tempId: string };
  index: number;
  onUpdate: (tempId: string, updates: Partial<FormFieldInput>) => void;
  onDelete: (tempId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

const FormFieldItem = ({
  field,
  index,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: FormFieldItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const fieldMeta = FIELD_TYPES.find(f => f.type === field.field_type);

  const hasOptions = ['select', 'radio', 'checkbox'].includes(field.field_type);

  const handleOptionChange = (optIndex: number, key: 'label' | 'value', value: string) => {
    const options = [...(field.options || [])];
    options[optIndex] = { ...options[optIndex], [key]: value };
    onUpdate(field.tempId, { options });
  };

  const addOption = () => {
    const options = [...(field.options || [])];
    options.push({ label: `Option ${options.length + 1}`, value: `option_${options.length + 1}` });
    onUpdate(field.tempId, { options });
  };

  const removeOption = (optIndex: number) => {
    const options = [...(field.options || [])];
    options.splice(optIndex, 1);
    onUpdate(field.tempId, { options });
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onMoveDown(index)}
            disabled={isLast}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-3">
          {/* Header Row */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="shrink-0">
              {fieldMeta?.label || field.field_type}
            </Badge>
            <Input
              value={field.label}
              onChange={(e) => onUpdate(field.tempId, { label: e.target.value })}
              placeholder="Field label"
              className="flex-1"
            />
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Required</Label>
              <Switch
                checked={field.is_required}
                onCheckedChange={(checked) => onUpdate(field.tempId, { is_required: checked })}
              />
            </div>
          </div>

          {/* Expandable Settings */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                {isExpanded ? "Hide" : "Show"} Settings
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Description */}
              <div className="space-y-2">
                <Label>Help Text / Description</Label>
                <Textarea
                  value={field.description || ""}
                  onChange={(e) => onUpdate(field.tempId, { description: e.target.value })}
                  placeholder="Additional instructions for this field"
                  rows={2}
                />
              </div>

              {/* Placeholder */}
              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={field.placeholder || ""}
                  onChange={(e) => onUpdate(field.tempId, { placeholder: e.target.value })}
                  placeholder="Placeholder text"
                />
              </div>

              {/* Options for select/radio/checkbox */}
              {hasOptions && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    {(field.options || []).map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <Input
                          value={option.label}
                          onChange={(e) => handleOptionChange(optIndex, 'label', e.target.value)}
                          placeholder="Label"
                          className="flex-1"
                        />
                        <Input
                          value={option.value}
                          onChange={(e) => handleOptionChange(optIndex, 'value', e.target.value)}
                          placeholder="Value"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(optIndex)}
                          disabled={field.options?.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addOption}>
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              {/* Validation Rules */}
              {['text', 'textarea', 'number'].includes(field.field_type) && (
                <div className="grid grid-cols-2 gap-4">
                  {field.field_type === 'number' ? (
                    <>
                      <div className="space-y-2">
                        <Label>Min Value</Label>
                        <Input
                          type="number"
                          value={field.validation_rules?.min ?? ""}
                          onChange={(e) => onUpdate(field.tempId, {
                            validation_rules: {
                              ...field.validation_rules,
                              min: e.target.value ? parseInt(e.target.value) : undefined,
                            }
                          })}
                          placeholder="Minimum"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Value</Label>
                        <Input
                          type="number"
                          value={field.validation_rules?.max ?? ""}
                          onChange={(e) => onUpdate(field.tempId, {
                            validation_rules: {
                              ...field.validation_rules,
                              max: e.target.value ? parseInt(e.target.value) : undefined,
                            }
                          })}
                          placeholder="Maximum"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Min Length</Label>
                        <Input
                          type="number"
                          value={field.validation_rules?.minLength ?? ""}
                          onChange={(e) => onUpdate(field.tempId, {
                            validation_rules: {
                              ...field.validation_rules,
                              minLength: e.target.value ? parseInt(e.target.value) : undefined,
                            }
                          })}
                          placeholder="Minimum"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Length</Label>
                        <Input
                          type="number"
                          value={field.validation_rules?.maxLength ?? ""}
                          onChange={(e) => onUpdate(field.tempId, {
                            validation_rules: {
                              ...field.validation_rules,
                              maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                            }
                          })}
                          placeholder="Maximum"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(field.tempId)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

export default FormFieldItem;
