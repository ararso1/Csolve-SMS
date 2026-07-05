import { FileQuestion } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const EmptyState = ({
  title = "No records found",
  description = "Try adjusting your search or filters.",
}: {
  title?: string;
  description?: string;
}) => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
