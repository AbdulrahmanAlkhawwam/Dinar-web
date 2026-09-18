import { z } from 'zod';

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/** The product form takes image URLs one per line. */
export function parseImageList(text: string): string[] {
  const urls = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return [...new Set(urls)];
}

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name'),
  // UpdateCategoryDto validates `image` with @IsUrl unless it is null, so an
  // emptied field goes out as null — which also clears the stored image.
  image: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value))
    .refine((value) => value === null || isHttpUrl(value), 'Enter a full http(s) URL'),
});

export type CategoryFormValues = z.input<typeof categoryInputSchema>;
export type CategoryInput = z.output<typeof categoryInputSchema>;

/** CreateProductDto. Images arrive as text and leave as the array it expects. */
export const productInputSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title'),
  description: z.string().trim().min(1, 'Enter a description'),
  price: z.number({ error: 'Enter a price' }).positive('The price must be above zero'),
  stock: z
    .number({ error: 'Enter the stock' })
    .int('Stock is a whole number')
    .min(0, 'Stock cannot be negative'),
  categoryId: z.string().min(1, 'Choose a category'),
  images: z
    .string()
    .transform(parseImageList)
    .superRefine((urls, ctx) => {
      const bad = urls.find((url) => !isHttpUrl(url));
      if (bad) {
        ctx.addIssue({ code: 'custom', message: `Not a valid image URL: ${bad}` });
      }
    }),
});

export type ProductFormValues = z.input<typeof productInputSchema>;
export type ProductInput = z.output<typeof productInputSchema>;
