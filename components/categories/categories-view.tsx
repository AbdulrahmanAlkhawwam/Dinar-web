'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { RemoteImage } from '@/components/ui/remote-image';
import { useCategories, useDeleteCategory } from '@/lib/api/catalog';
import type { Category } from '@/lib/schemas/catalog';

import { CategoryForm } from './category-form';

type Editing = { mode: 'create' } | { mode: 'edit'; category: Category } | null;

export function CategoriesView({ isAdmin }: { isAdmin: boolean }) {
  const categories = useCategories();
  const remove = useDeleteCategory();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const closeDelete = () => {
    setDeleting(null);
    remove.reset();
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-sm text-on-surface-variant">How the product catalog is grouped.</p>
        </div>
        {isAdmin ? (
          <Button onClick={() => setEditing({ mode: 'create' })}>Add category</Button>
        ) : null}
      </div>

      {categories.isPending ? (
        <p className="text-sm text-on-surface-variant">Loading categories…</p>
      ) : categories.isError ? (
        <Alert>{categories.error.message}</Alert>
      ) : categories.data.length === 0 ? (
        <EmptyState
          title="No categories yet"
          action={
            isAdmin ? (
              <Button onClick={() => setEditing({ mode: 'create' })}>Add the first category</Button>
            ) : null
          }
        >
          {isAdmin
            ? 'Every product belongs to a category, so start here.'
            : 'An administrator has not set up the catalog yet.'}
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.data.map((category) => (
            <li key={category.id}>
              <Card className="flex h-full flex-col gap-4">
                <div className="flex items-center gap-4">
                  <RemoteImage
                    src={category.image}
                    alt=""
                    fallback={category.name}
                    className="size-14 shrink-0 rounded-inner"
                  />
                  <h2 className="min-w-0 truncate font-bold">{category.name}</h2>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/products?categoryId=${encodeURIComponent(category.id)}`}
                    className="text-sm font-medium underline"
                  >
                    View products
                  </Link>
                  {isAdmin ? (
                    <div className="flex gap-1">
                      <Button
                        variant="text"
                        onClick={() => setEditing({ mode: 'edit', category })}
                        aria-label={`Edit ${category.name}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="text"
                        onClick={() => setDeleting(category)}
                        aria-label={`Delete ${category.name}`}
                      >
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? `Edit ${editing.category.name}` : 'Add category'}
      >
        {editing ? (
          <CategoryForm
            key={editing.mode === 'edit' ? editing.category.id : 'new'}
            category={editing.mode === 'edit' ? editing.category : undefined}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? ''}?`}
        confirmLabel="Delete"
        pending={remove.isPending}
        // CategoriesService answers a category that still has products with
        // a 409 and a clear message, so it is shown as sent.
        error={remove.isError ? remove.error.message : null}
        onClose={closeDelete}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: closeDelete })}
      >
        Categories that still contain products cannot be deleted. Move or
        delete those products first.
      </ConfirmDialog>
    </div>
  );
}
