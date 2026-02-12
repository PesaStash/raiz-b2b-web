import { ITransaction } from "@/types/transactions";
import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface TableMeta {
    onViewDetails: (transaction: ITransaction) => void;
  }
}
