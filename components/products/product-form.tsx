'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RemoteImage } from '@/components/ui/remote-image';
import { SelectField } from '@/components/ui/select-field';
import { TextArea } from '@/components/ui/text-area';
import { TextField } from '@/components/ui/text-field';
import { useSaveProduct } from '@/lib/api/catalog';
import { applyApiError } from '@/lib/client/form-errors';
import type { Category, Product } from '@/lib/schemas/catalog';
import {
  parseImageList,
  productInputSchema,
  type ProductFormValues,
  type ProductInput,
} from '@/lib/schemas/catalog-inputs';

export function ProductForm({
  product,
  categories,
  onDone,
}: {
  product?: Product;
  categories: Category[];
  onDone: () => void;
}) {
  const save = useSaveProduct();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<ProductFormValues, unknown, ProductInput>({
    resolver: zodResolver(productInputSchema),
    defaultValues: product
      ? {
          title: product.title,
          description: product.description,
          price: product.price,
          stock: product.stock,
          categoryId: product.categoryId,
          images: product.images.join('\n'),
        }
      : {
          title: '',
          description: '',
          categoryId: categories.length === 1 ? categories[0].id : '',
          images: '',
        },
  });
  const imageText = useWatch({ control, name: 'images' });
  const previews = parseImageList(imageText ?? '').slice(0, 6);

  const onSubmit = handleSubmit(async (input) => {
    setFormError(null);
    try {
      await save.mutateAsync({ id: product?.id, input });
      onDone();
    } catch (error) {
      applyApiError(error, setError, setFormError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <Alert>{formError}</Alert> : null}
      <TextField label="Title" error={errors.title?.message} {...register('title')} />
      <TextArea label="Description" error={errors.description?.message} {...register('description')} />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Price"
          type="number"
          step="any"
          min="0"
          inputMode="decimal"
          hint="The API stores no currency for products."
          error={errors.price?.message}
          {...register('price', { valueAsNumber: true })}
        />
        <TextField
          label="Stock"
          type="number"
          step="1"
          min="0"
          inputMode="numeric"
          error={errors.stock?.message}
          {...register('stock', { valueAsNumber: true })}
        />
      </div>
      <SelectField label="Category" error={errors.categoryId?.message} {...register('categoryId')}>
        <option value="" disabled>
          Choose a category
        </option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </SelectField>
      <TextArea
        label="Image URLs (optional)"
        placeholder="https://… one per line"
        hint="One URL per line. The first is the cover."
        error={errors.images?.message}
        {...register('images')}
      />
      {previews.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Image previews">
          {previews.map((url, index) => (
            <li key={url}>
              <RemoteImage
                src={url}
                alt={`Image ${index + 1}`}
                fallback="!"
                className="size-14 rounded-inner"
              />
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="text" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          {product ? 'Save changes' : 'Add product'}
        </Button>
      </div>
    </form>
  );
}
