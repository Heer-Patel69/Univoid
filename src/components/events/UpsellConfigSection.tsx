import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Trash2, Edit2, Users, Gift, Tag, IndianRupee, 
  Sparkles, Save, Type
} from "lucide-react";
import type { EventUpsell } from "@/services/upsellService";

// Draft upsell for creating events before they exist
export interface DraftUpsell {
  id: string;
  upsell_type: 'group_offer' | 'addon' | 'custom_addon';
  name: string;
  description: string | null;
  price: number;
  discount_amount: number;
  min_quantity: number;
  max_quantity: number;
  group_size: number | null;
  is_active: boolean;
  display_order: number;
  allow_custom_input: boolean;
  custom_input_label: string | null;
  custom_input_placeholder: string | null;
  custom_input_max_length: number;
}

interface UpsellConfigSectionProps {
  upsells: DraftUpsell[];
  onChange: (upsells: DraftUpsell[]) => void;
  upsellEnabled: boolean;
  onUpsellEnabledChange: (enabled: boolean) => void;
  isPaidEvent: boolean;
}

export function UpsellConfigSection({
  upsells,
  onChange,
  upsellEnabled,
  onUpsellEnabledChange,
  isPaidEvent,
}: UpsellConfigSectionProps) {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUpsell, setEditingUpsell] = useState<DraftUpsell | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    upsell_type: "addon" as DraftUpsell["upsell_type"],
    price: 0,
    discount_amount: 0,
    min_quantity: 1,
    max_quantity: 10,
    group_size: 5,
    is_active: true,
    allow_custom_input: false,
    custom_input_label: "",
    custom_input_placeholder: "",
    custom_input_max_length: 200,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      upsell_type: "addon",
      price: 0,
      discount_amount: 0,
      min_quantity: 1,
      max_quantity: 10,
      group_size: 5,
      is_active: true,
      allow_custom_input: false,
      custom_input_label: "",
      custom_input_placeholder: "",
      custom_input_max_length: 200,
    });
  };

  const openEdit = (upsell: DraftUpsell) => {
    setEditingUpsell(upsell);
    setFormData({
      name: upsell.name,
      description: upsell.description || "",
      upsell_type: upsell.upsell_type,
      price: upsell.price,
      discount_amount: upsell.discount_amount,
      min_quantity: upsell.min_quantity,
      max_quantity: upsell.max_quantity,
      group_size: upsell.group_size || 5,
      is_active: upsell.is_active,
      allow_custom_input: upsell.allow_custom_input || false,
      custom_input_label: upsell.custom_input_label || "",
      custom_input_placeholder: upsell.custom_input_placeholder || "",
      custom_input_max_length: upsell.custom_input_max_length || 200,
    });
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    if (formData.upsell_type === "group_offer" && (!formData.group_size || formData.group_size < 2)) {
      toast({ title: "Group size must be at least 2", variant: "destructive" });
      return;
    }

    const newUpsell: DraftUpsell = {
      id: editingUpsell?.id || `draft-${Date.now()}`,
      upsell_type: formData.upsell_type,
      name: formData.name,
      description: formData.description || null,
      price: formData.price,
      discount_amount: formData.discount_amount,
      min_quantity: formData.min_quantity,
      max_quantity: formData.max_quantity,
      group_size: formData.upsell_type === "group_offer" ? formData.group_size : null,
      is_active: formData.is_active,
      display_order: editingUpsell?.display_order || upsells.length,
      allow_custom_input: formData.allow_custom_input,
      custom_input_label: formData.allow_custom_input ? formData.custom_input_label || null : null,
      custom_input_placeholder: formData.allow_custom_input ? formData.custom_input_placeholder || null : null,
      custom_input_max_length: formData.custom_input_max_length,
    };

    if (editingUpsell) {
      onChange(upsells.map(u => u.id === editingUpsell.id ? newUpsell : u));
      toast({ title: "Upsell Updated" });
    } else {
      onChange([...upsells, newUpsell]);
      toast({ title: "Upsell Created" });
    }

    setIsCreateOpen(false);
    setEditingUpsell(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    onChange(upsells.filter(u => u.id !== id));
    toast({ title: "Upsell Deleted" });
  };

  const groupOffers = upsells.filter(u => u.upsell_type === "group_offer");
  const addons = upsells.filter(u => u.upsell_type === "addon" || u.upsell_type === "custom_addon");

  const UpsellForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Type *</Label>
        <Select 
          value={formData.upsell_type} 
          onValueChange={(v) => setFormData(prev => ({ ...prev, upsell_type: v as DraftUpsell["upsell_type"] }))}
          disabled={!!editingUpsell}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="group_offer">Group Offer</SelectItem>
            <SelectItem value="addon">Add-on</SelectItem>
            <SelectItem value="custom_addon">Custom Add-on</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Name *</Label>
        <Input 
          value={formData.name} 
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={formData.upsell_type === "group_offer" ? "e.g., Group of 5 Discount" : "e.g., Snacks Combo"}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea 
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Optional description"
          rows={2}
        />
      </div>

      {formData.upsell_type === "group_offer" ? (
        <>
          <div className="space-y-2">
            <Label>Minimum Group Size *</Label>
            <Input 
              type="number"
              min={2}
              value={formData.group_size}
              onChange={(e) => setFormData(prev => ({ ...prev, group_size: parseInt(e.target.value) || 2 }))}
            />
            <p className="text-xs text-muted-foreground">Users must book at least this many tickets</p>
          </div>
          <div className="space-y-2">
            <Label>Discount Amount (₹) *</Label>
            <Input 
              type="number"
              min={0}
              value={formData.discount_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Price (₹) *</Label>
            <Input 
              type="number"
              min={0}
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Quantity</Label>
              <Input 
                type="number"
                min={1}
                value={formData.min_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, min_quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Quantity</Label>
              <Input 
                type="number"
                min={1}
                value={formData.max_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, max_quantity: parseInt(e.target.value) || 10 }))}
              />
            </div>
          </div>

          {/* Custom Input Section for Add-ons */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Allow User Input</Label>
              </div>
              <Switch 
                checked={formData.allow_custom_input}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, allow_custom_input: c }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enable this to let users enter custom text (e.g., names, preferences)
            </p>

            {formData.allow_custom_input && (
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs">Input Label</Label>
                  <Input 
                    value={formData.custom_input_label}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_input_label: e.target.value }))}
                    placeholder="e.g., Enter participant names"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Placeholder Text</Label>
                  <Input 
                    value={formData.custom_input_placeholder}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_input_placeholder: e.target.value }))}
                    placeholder="e.g., John, Jane, Mike..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Max Character Limit</Label>
                  <Input 
                    type="number"
                    min={10}
                    max={1000}
                    value={formData.custom_input_max_length}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_input_max_length: parseInt(e.target.value) || 200 }))}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <Label>Active</Label>
        <Switch 
          checked={formData.is_active}
          onCheckedChange={(c) => setFormData(prev => ({ ...prev, is_active: c }))}
        />
      </div>

      <Button onClick={handleSubmit} className="w-full gap-2">
        <Save className="w-4 h-4" />
        {editingUpsell ? "Update" : "Create"} Upsell
      </Button>
    </div>
  );

  if (!isPaidEvent) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Upsells for Paid Events Only</h3>
          <p className="text-muted-foreground">
            Enable paid ticketing to add upsells and group offers.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <Card className="border-primary/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Enable Upsells</h3>
                <p className="text-sm text-muted-foreground">
                  Show upsell screen during booking
                </p>
              </div>
            </div>
            <Switch 
              checked={upsellEnabled}
              onCheckedChange={onUpsellEnabledChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upsells Management */}
      <Tabs defaultValue="group_offers">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="group_offers" className="gap-1.5">
              <Users className="w-4 h-4" /> Group Offers
            </TabsTrigger>
            <TabsTrigger value="addons" className="gap-1.5">
              <Gift className="w-4 h-4" /> Add-ons
            </TabsTrigger>
          </TabsList>

          <Dialog open={isCreateOpen || !!editingUpsell} onOpenChange={(open) => {
            if (!open) {
              setIsCreateOpen(false);
              setEditingUpsell(null);
              resetForm();
            } else {
              setIsCreateOpen(true);
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingUpsell ? "Edit Upsell" : "Create Upsell"}
                </DialogTitle>
              </DialogHeader>
              <UpsellForm />
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="group_offers" className="space-y-3">
          {groupOffers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No group offers yet</p>
                <p className="text-sm text-muted-foreground">Create offers to reward group bookings</p>
              </CardContent>
            </Card>
          ) : (
            groupOffers.map(offer => (
              <Card key={offer.id} className={!offer.is_active ? "opacity-60" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Tag className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{offer.name}</h4>
                          {!offer.is_active && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Min {offer.group_size} tickets → ₹{offer.discount_amount} OFF
                        </p>
                        {offer.description && (
                          <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(offer)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(offer.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="addons" className="space-y-3">
          {addons.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Gift className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No add-ons yet</p>
                <p className="text-sm text-muted-foreground">Create add-ons like snacks, merch, etc.</p>
              </CardContent>
            </Card>
          ) : (
            addons.map(addon => (
              <Card key={addon.id} className={!addon.is_active ? "opacity-60" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Gift className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{addon.name}</h4>
                          {!addon.is_active && <Badge variant="secondary">Inactive</Badge>}
                          <Badge variant="outline" className="text-xs">
                            {addon.upsell_type === "custom_addon" ? "Custom" : "Add-on"}
                          </Badge>
                          {addon.allow_custom_input && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Type className="w-3 h-3" /> Text Input
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />{addon.price}
                          {addon.max_quantity > 1 && ` (max ${addon.max_quantity})`}
                        </p>
                        {addon.description && (
                          <p className="text-sm text-muted-foreground mt-1">{addon.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(addon)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(addon.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UpsellConfigSection;
