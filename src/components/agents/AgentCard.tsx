
import { useState } from "react";
import { Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface AgentCardProps {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "pending";
  usagePercentage: number;
  lastUpdated: string;
  image?: string;
  onStatusChange?: (id: string, isActive: boolean) => void;
  onEditClick?: (id: string) => void;
}

export const AgentCard = ({
  id,
  name,
  description,
  status,
  usagePercentage,
  lastUpdated,
  image,
  onStatusChange,
  onEditClick,
}: AgentCardProps) => {
  const [isActive, setIsActive] = useState(status === "active");
  const [isHovered, setIsHovered] = useState(false);

  const handleStatusChange = (checked: boolean) => {
    setIsActive(checked);
    onStatusChange?.(id, checked);
  };

  return (
    <Card 
      className={cn(
        "group relative h-full overflow-hidden border-border/40 transition-all duration-200 hover:border-primary/30 hover:shadow-md",
        isActive ? "bg-background/80" : "bg-background/40 opacity-80"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {usagePercentage > 0 && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-300"
          style={{ width: `${usagePercentage}%` }}
        />
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-primary/10">
              {image ? (
                <img src={image} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                  <span className="text-lg font-semibold text-primary">{name.charAt(0)}</span>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold leading-none tracking-tight">{name}</h3>
              <p className="text-sm text-muted-foreground">
                Última atualização: {lastUpdated}
              </p>
            </div>
          </div>
          
          <div className={cn("flex transition-opacity", !isHovered && "opacity-70")}>
            <Switch checked={isActive} onCheckedChange={handleStatusChange} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between border-t border-border/30 pt-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full",
            status === "active" ? "bg-green-500" : 
            status === "pending" ? "bg-amber-500" : "bg-gray-300"
          )} />
          <span className="text-xs text-muted-foreground">
            {status === "active" ? "Ativo" : status === "pending" ? "Pendente" : "Inativo"}
          </span>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onEditClick?.(id)}
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Configurações</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export const AgentCardSkeleton = () => (
  <Card className="h-full border-border/40">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-8 rounded-full" />
      </div>
    </CardHeader>
    
    <CardContent>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
    </CardContent>
    
    <CardFooter className="border-t border-border/30 pt-3">
      <div className="flex w-full items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </CardFooter>
  </Card>
);
