import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface QuickRegisterButtonProps {
  eventId: string;
  isPast?: boolean;
  isFull?: boolean;
  className?: string;
}

const QuickRegisterButton = ({ 
  eventId, 
  isPast = false, 
  isFull = false,
  className = "" 
}: QuickRegisterButtonProps) => {
  if (isPast || isFull) return null;

  return (
    <Link to={`/register/${eventId}`}>
      <Button 
        variant="outline" 
        size="sm" 
        className={`gap-2 ${className}`}
      >
        <Zap className="w-4 h-4" />
        Quick Register
      </Button>
    </Link>
  );
};

export default QuickRegisterButton;
