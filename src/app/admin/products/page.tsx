import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdminMembership } from "@/lib/actions/auth";
import { formatPrice } from "@/lib/format-price";
import { listProductsForTenant } from "@/lib/queries/products";
import { cn } from "@/lib/utils";

export default async function AdminProductsPage() {
  const membership = await requireAdminMembership();
  const products = await listProductsForTenant(membership.tenant_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Товары</h1>
          <p className="text-muted-foreground text-sm">
            {products.length} шт.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          Новый товар
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Пока пусто. Добавьте первый товар — фото, название, цена, размеры.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Товар</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Остаток</TableHead>
                <TableHead>Статус</TableHead>
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
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>{stock}</TableCell>
                    <TableCell>
                      {product.is_active ? "Активен" : "Скрыт"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
