import Link from "next/link";

import { CategoryManager } from "@/components/admin/CategoryManager";
import { ProductActiveToggle } from "@/components/admin/ProductActiveToggle";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/format-price";
import { requireOwner } from "@/lib/queries/auth";
import {
  listCategoriesForTenant,
  listProductsForTenant,
} from "@/lib/queries/products";
import { cn } from "@/lib/utils";

export default async function AdminProductsPage() {
  const { membership } = await requireOwner();
  const [products, categories] = await Promise.all([
    listProductsForTenant(membership.tenant_id),
    listCategoriesForTenant(membership.tenant_id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Товары</h1>
          <p className="text-sm text-neutral-600">{products.length} шт.</p>
        </div>
        <Link
          href="/admin/products/new"
          className={cn(buttonVariants({ size: "sm" }))}
          style={{ backgroundColor: "#0E5C4A", color: "white" }}
        >
          + товар
        </Link>
      </div>

      <CategoryManager categories={categories} />

      <div className="overflow-x-auto rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Товар</TableHead>
              <TableHead>Раздел</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead>Остаток</TableHead>
              <TableHead>На витрине</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const stock = product.product_variants.reduce(
                (sum, v) => sum + (v.is_active ? v.stock_qty : 0),
                0,
              );
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {product.title}
                    </Link>
                  </TableCell>
                  <TableCell>{product.categories?.name ?? "—"}</TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>{stock}</TableCell>
                  <TableCell>
                    <ProductActiveToggle
                      productId={product.id}
                      isActive={product.is_active}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
