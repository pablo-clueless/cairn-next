import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "../ui/button";

interface Props {
  onPageChange: (page: number) => void;
  page: number;
  pageSize: number;
  total: number;
}

export const Pagination = ({ onPageChange, page, pageSize, total }: Props) => {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex items-center justify-between">
      <div className=""></div>
      <div className="flex items-center gap-x-2">
        <Button disabled size="icon" variant="outline">
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button disabled size="icon" variant="outline">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button disabled size="icon" variant="outline">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button disabled size="icon" variant="outline">
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
      <div className=""></div>
    </div>
  );
};
