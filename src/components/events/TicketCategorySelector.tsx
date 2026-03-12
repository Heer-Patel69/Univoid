import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, IndianRupee, Users, ChevronDown, ChevronUp } from "lucide-react";
import type { TicketCategory, TicketCategorySelection, AttendeeInfo } from "@/services/ticketCategoryService";

interface TicketCategorySelectorProps {
  categories: TicketCategory[];
  selections: TicketCategorySelection[];
  onChange: (selections: TicketCategorySelection[]) => void;
  isPaidEvent: boolean;
  allowAudienceMembers?: boolean;
}

const TicketCategorySelector = ({ categories, selections, onChange, isPaidEvent, allowAudienceMembers = false }: TicketCategorySelectorProps) => {
  const [expandedAttendees, setExpandedAttendees] = useState<string | null>(null);

  // Auto-expand attendee details when first ticket is added
  useEffect(() => {
    if (selections.length > 0 && !expandedAttendees) {
      const firstWithQty = selections.find(s => s.quantity >= 1);
      if (firstWithQty) setExpandedAttendees(firstWithQty.category.id);
    }
  }, [selections]);

  // Total tickets across all categories (artist tickets only, audience is separate)
  const totalTickets = useMemo(
    () => selections.reduce((sum, s) => sum + s.quantity, 0),
    [selections]
  );

  // Total audience across all categories
  const totalAudience = useMemo(
    () => selections.reduce((sum, s) => sum + (s.audienceCount || 0), 0),
    [selections]
  );

  // Total price (includes audience)
  const totalPrice = useMemo(
    () => selections.reduce((sum, s) => sum + s.category.price * (s.quantity + (s.audienceCount || 0)), 0),
    [selections]
  );

  const updateQuantity = (categoryId: string, delta: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const existing = selections.find(s => s.category.id === categoryId);
    const currentQty = existing?.quantity || 0;
    const newQty = Math.max(0, Math.min(category.max_per_user, currentQty + delta));

    if (newQty === 0) {
      onChange(selections.filter(s => s.category.id !== categoryId));
      return;
    }

    if (existing) {
      // Adjust attendees array
      let attendees = [...existing.attendees];
      if (newQty > attendees.length) {
        for (let i = attendees.length; i < newQty; i++) {
          attendees.push({ name: "", email: "", mobile: "" });
        }
      } else {
        attendees = attendees.slice(0, newQty);
      }
      onChange(selections.map(s =>
        s.category.id === categoryId ? { ...s, quantity: newQty, attendees } : s
      ));
    } else {
      const attendees: AttendeeInfo[] = Array.from({ length: newQty }, () => ({
        name: "", email: "", mobile: "",
      }));
      onChange([...selections, { category, quantity: newQty, attendees, audienceCount: 0 }]);
    }
  };

  const updateAudienceCount = (categoryId: string, count: number) => {
    const safeCount = Math.max(0, Math.floor(count) || 0);
    onChange(selections.map(s =>
      s.category.id === categoryId ? { ...s, audienceCount: safeCount } : s
    ));
  };

  const updateAttendee = (categoryId: string, attendeeIndex: number, field: keyof AttendeeInfo, value: string) => {
    onChange(selections.map(s => {
      if (s.category.id !== categoryId) return s;
      const attendees = [...s.attendees];
      attendees[attendeeIndex] = { ...attendees[attendeeIndex], [field]: value };
      return { ...s, attendees };
    }));
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Select Tickets</Label>

      {categories.map(cat => {
        const selection = selections.find(s => s.category.id === cat.id);
        const qty = selection?.quantity || 0;
        const audienceCount = selection?.audienceCount || 0;
        const isExpanded = expandedAttendees === cat.id;

        return (
          <Card key={cat.id} className={qty > 0 ? "border-primary/50" : ""}>
            <CardContent className="p-4 space-y-3">
              {/* Category header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                  )}
                  {isPaidEvent && (
                    <p className="text-sm font-semibold mt-1 flex items-center">
                      <IndianRupee className="w-3.5 h-3.5" />{cat.price}
                    </p>
                  )}
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(cat.id, -1)}
                    disabled={qty === 0}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{qty}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(cat.id, 1)}
                    disabled={qty >= cat.max_per_user}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Max info */}
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>Max {cat.max_per_user} per person</span>
                {cat.max_total && <span>• {cat.max_total} total available</span>}
              </div>

              {/* Attendee details (only for the registrant, not audience) */}
              {qty >= 1 && (
                <>
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between text-xs"
                      onClick={() => setExpandedAttendees(isExpanded ? null : cat.id)}
                    >
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Your Details ({qty} attendee{qty > 1 ? 's' : ''}) *
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </Button>

                    {isExpanded && selection && (
                      <div className="space-y-3 mt-2">
                        {selection.attendees.map((attendee, idx) => (
                          <div key={idx} className="p-3 bg-muted rounded-lg space-y-2">
                            <p className="text-xs font-medium">Attendee {idx + 1}</p>
                            <Input
                              placeholder="Full Name *"
                              value={attendee.name}
                              onChange={(e) => updateAttendee(cat.id, idx, "name", e.target.value)}
                              className="h-8 text-sm"
                            />
                            <Input
                              type="email"
                              placeholder="Email *"
                              value={attendee.email}
                              onChange={(e) => updateAttendee(cat.id, idx, "email", e.target.value)}
                              className="h-8 text-sm"
                            />
                            <Input
                              type="tel"
                              placeholder="Mobile *"
                              value={attendee.mobile}
                              onChange={(e) => updateAttendee(cat.id, idx, "mobile", e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Audience members input */}
                  <div className="p-3 bg-accent/30 rounded-lg space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Number of Audience Members
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Bringing audience? They don't need to register separately.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateAudienceCount(cat.id, audienceCount - 1)}
                        disabled={audienceCount <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        value={audienceCount}
                        onChange={(e) => updateAudienceCount(cat.id, parseInt(e.target.value) || 0)}
                        className="h-8 w-20 text-center text-sm"
                        min={0}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateAudienceCount(cat.id, audienceCount + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    {isPaidEvent && audienceCount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Audience cost: {audienceCount} × ₹{cat.price} = <span className="font-medium text-foreground">₹{audienceCount * cat.price}</span>
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Summary */}
      {totalTickets > 0 && (
        <div className="p-3 bg-primary/5 rounded-xl space-y-1">
          <div className="flex justify-between text-sm">
            <span>Your Tickets</span>
            <Badge variant="secondary">{totalTickets}</Badge>
          </div>
          {totalAudience > 0 && (
            <div className="flex justify-between text-sm">
              <span>Audience Members</span>
              <Badge variant="secondary">{totalAudience}</Badge>
            </div>
          )}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total People</span>
            <span>{totalTickets + totalAudience}</span>
          </div>
          {isPaidEvent && (
            <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border/50">
              <span>Total Amount</span>
              <span className="flex items-center"><IndianRupee className="w-3.5 h-3.5" />{totalPrice}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketCategorySelector;
