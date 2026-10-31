import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface TableSkeletonProps {
  /** Number of columns to render (defaults to 4) */
  columns?: number;
  /** Number of placeholder rows (defaults to 5) */
  rows?: number;
  /** Optional custom container CSS class */
  className?: string;
}

/**
 * Reusable table skeleton loader.
 *
 * Reuses the Table and Skeleton UI primitives to provide a minimal,
 * animated placeholder table while asynchronous data is loading.
 */
export function TableSkeleton({
  columns = 4,
  rows = 5,
  className,
}: TableSkeletonProps) {
  const cols = Array.from({ length: columns });
  const rowList = Array.from({ length: rows });

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-border/60 bg-card/60",
        className
      )}
      aria-busy="true"
      aria-label="Loading table data"
    >
      <Table>
        <TableHeader>
          <TableRow className="border-border/30 hover:bg-transparent">
            {cols.map((_, i) => (
              <TableHead key={`head-${i}`}>
                <Skeleton className={cn("h-3.5", i === 0 ? "w-24" : "w-16")} />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/20">
          {rowList.map((_, r) => (
            <TableRow key={`row-${r}`} className="border-border/20 hover:bg-transparent">
              {cols.map((_, c) => (
                <TableCell key={`cell-${r}-${c}`}>
                  <Skeleton
                    className={cn(
                      "h-4",
                      c === 0
                        ? "w-28 sm:w-36"
                        : c === cols.length - 1
                        ? "ml-auto w-16"
                        : "w-20"
                    )}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
