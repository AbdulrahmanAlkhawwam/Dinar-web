'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RemoteImage } from '@/components/ui/remote-image';
import { TextField } from '@/components/ui/text-field';
import { useSaveCategory } from '@/lib/api/catalog';
import { applyApiError } from '@/lib/client/form-errors';
import type { Category } from '@/lib/schemas/catalog';
import {
  categoryInputSchema,
  type CategoryFormValues,
  type CategoryInput,
} from '@/lib/schemas/catalog-inputs';

export function CategoryForm({ category, onDone }: { category?: Category; onDone: () => void }) {
  const save = useSaveCategory();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<CategoryFormValues, unknown, CategoryInput>({
    resolver: zodResolver(categoryInputSchema),
    defaultValues: { name: category?.name ?? '', image: category?.image ?? '' },
  });
  const [name, image] = useWatch({ control, name: ['name', 'image'] });

  const onSubmit = handleSubmit(async (input) => {
    setFormError(null);
    try {
      await save.mutateAsync({ id: category?.id, input });
      onDone();
    } catch (error) {
      applyApiError(error, setError, setFormError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <Alert>{formError}</Alert> : null}
      <TextField label="Name" error={errors.name?.message} {...register('name')} />
      <div className="flex items-end gap-4">
        <TextField
          label="Image URL (optional)"
          type="url"
          placeholder="https://"
          className="flex-1"
          error={errors.image?.message}
          {...register('image')}
        />
        <RemoteImage
          key={image}
          src={image?.trim() || null}
          alt=""
          fallback={name || '?'}
          className="size-12 shrink-0 rounded-inner"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="text" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          {category ? 'Save changes' : 'Add category'}
        </Button>
      </div>
    </form>
  );
}
