'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { RemoteImage } from '@/components/ui/remote-image';
import { SelectField } from '@/components/ui/select-field';
import { Table, Td, Th } from '@/components/ui/table';
import { TextField } from '@/components/ui/text-field';
import { useCategories, useDeleteProduct, useProducts } from '@/lib/api/catalog';
import { useDebouncedValue } from '@/lib/client/use-debounced-value';
import { formatPrice } from '@/lib/money';
import {
  SORTS,
  parseFilters,
  toSearchParams,
  type ProductFilters,
  type SortChoice,
} from '@/lib/products/filters';
import type { Product } from '@/lib/schemas/catalog';

import { ProductForm } from './product-form';

type Editing = { mode: 'create' } | { mode: 'edit'; product: Product } | null;

export function ProductsView({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const filters = parseFilters(new URLSearchParams(useSearchParams().toString()));

  const products = useProducts(filters);
  const categories = useCategories();
  const remove = useDeleteProduct();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const setFilters = (next: ProductFilters) => {
    const query = toSearchParams(next).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  const refine = (change: Partial<ProductFilters>) => setFilters({ ...filters, ...change, page: 1 });

  // The box updates as you type; the URL and the request wait for a pause.
  const [searchText, setSearchText] = useState(filters.search ?? '');
  const search = useDebouncedValue(searchText.trim(), 300);
  useEffect(() => {
    if (search !== (filters.search ?? '')) {
      refine({ search: search || undefined });
    }
    // Only a settled search term should move the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasFilters = Boolean(filters.search || filters.categoryId);
  const noCategories = categories.isSuccess && categories.data.length === 0;

  const closeDelete = () => {
    setDeleting(null);
    remove.reset();
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-sm text-on-surface-variant">The product catalog.</p>
        </div>
        {isAdmin ? (
          <Button
            onClick={() => setEditing({ mode: 'create' })}
            disabled={!categories.isSuccess || noCategories}
          >
            Add product
          </Button>
        ) : null}
      </div>

      {isAdmin && noCategories ? (
        <Alert>
          Every product needs a category.{' '}
          <Link href="/categories" className="underline">
            Add a category
          </Link>{' '}
          first.
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-end gap-4">
        <TextField
          label="Search"
          type="search"
          placeholder="Title or description"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          className="min-w-56 flex-1"
        />
        <SelectField
          label="Category"
          value={filters.categoryId ?? ''}
          onChange={(event) => refine({ categoryId: event.target.value || undefined })}
        >
          <option value="">All categories</option>
          {categories.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Sort by"
          value={filters.sort}
          onChange={(event) => refine({ sort: event.target.value as SortChoice })}
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </SelectField>
        {hasFilters ? (
          <Button
            variant="text"
            onClick={() => {
              setSearchText('');
              setFilters({ page: 1, sort: filters.sort });
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>

      {products.isPending ? (
        <p className="text-sm text-on-surface-variant">Loading products…</p>
      ) : products.isError ? (
        <Alert>{products.error.message}</Alert>
      ) : products.data.data.length === 0 ? (
        <EmptyState title={hasFilters ? 'No products match' : 'No products yet'}>
          {hasFilters
            ? 'Try another search or category.'
            : isAdmin
              ? 'Add a product to start the catalog.'
              : 'An administrator has not added any products yet.'}
        </EmptyState>
      ) : (
        <div
          className={`flex flex-col gap-4 transition-opacity ${products.isPlaceholderData ? 'opacity-60' : ''}`}
        >
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">Stock</Th>
                {isAdmin ? <Th className="text-right">Actions</Th> : null}
              </tr>
            </thead>
            <tbody>
              {products.data.data.map((product) => (
                <tr key={product.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <RemoteImage
                        src={product.images[0]}
                        alt=""
                        fallback={product.title}
                        className="size-11 shrink-0 rounded-inner"
                      />
                      <div className="min-w-0">
                        <p className="font-medium">{product.title}</p>
                        <p className="line-clamp-1 max-w-md text-xs text-on-surface-variant">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap text-on-surface-variant">{product.category.name}</Td>
                  <Td className="whitespace-nowrap text-right tabular-nums">
                    {formatPrice(product.price)}
                  </Td>
                  <Td className="whitespace-nowrap text-right tabular-nums">
                    {product.stock === 0 ? (
                      <span className="rounded-pill bg-surface-container-high px-2.5 py-1 text-xs text-on-surface-variant">
                        Out of stock
                      </span>
                    ) : (
                      product.stock
                    )}
                  </Td>
                  {isAdmin ? (
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="text"
                          onClick={() => setEditing({ mode: 'edit', product })}
                          disabled={!categories.isSuccess}
                          aria-label={`Edit ${product.title}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="text"
                          onClick={() => setDeleting(product)}
                          aria-label={`Delete ${product.title}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </Td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination
            page={products.data.meta.page}
            totalPages={products.data.meta.totalPages}
            total={products.data.meta.total}
            onPage={(page) => setFilters({ ...filters, page })}
          />
        </div>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? `Edit ${editing.product.title}` : 'Add product'}
      >
        {editing && categories.isSuccess ? (
          <ProductForm
            key={editing.mode === 'edit' ? editing.product.id : 'new'}
            product={editing.mode === 'edit' ? editing.product : undefined}
            categories={categories.data}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.title ?? ''}?`}
        confirmLabel="Delete"
        pending={remove.isPending}
        error={remove.isError ? remove.error.message : null}
        onClose={closeDelete}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: closeDelete })}
      >
        The product will be removed from the catalog. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
