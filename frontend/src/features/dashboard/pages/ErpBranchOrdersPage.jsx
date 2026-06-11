import ErpShell from "../components/ErpShell";
import { EmptyState } from "../../../components/ui";
import { Package } from "lucide-react";

export default function ErpBranchOrdersPage() {
  return (
    <ErpShell title="Branch Orders" description="Permintaan barang antar branch">
      <EmptyState
        icon={Package}
        title="Fitur akan segera hadir"
        description="Halaman ini akan dipakai untuk permintaan barang antar branch atau dari branch ke pusat distribusi. Saat ini masih dalam tahap pengembangan."
      />
    </ErpShell>
  );
}
