import { describe, expect, test } from 'vitest';

import { categoryInputSchema, parseImageList, productInputSchema } from './catalog-inputs';

describe('parseImageList', () => {
  test('takes one URL per line, trimmed, skipping blanks', () => {
    expect(parseImageList(' https://a.test/1.jpg \n\n https://a.test/2.jpg ')).toEqual([
      'https://a.test/1.jpg',
      'https://a.test/2.jpg',
    ]);
  });

  test('drops repeats', () => {
    expect(parseImageList('https://a.test/1.jpg\nhttps://a.test/1.jpg')).toEqual([
      'https://a.test/1.jpg',
    ]);
  });
});

describe('categoryInputSchema', () => {
  test('trims the name', () => {
    expect(categoryInputSchema.parse({ name: '  Electronics ', image: '' }).name).toBe('Electronics');
  });

  // UpdateCategoryDto runs @IsUrl on `image` unless it is null or absent
  // (@IsOptional). An empty string would fail validation, so a cleared field
  // must be sent as null — which is also how the stored image gets removed.
  test('turns an empty image field into null', () => {
    expect(categoryInputSchema.parse({ name: 'Books', image: '  ' }).image).toBeNull();
  });

  test('rejects an image that is not an http(s) URL', () => {
    expect(categoryInputSchema.safeParse({ name: 'Books', image: 'javascript:alert(1)' }).success).toBe(false);
  });
});

describe('productInputSchema', () => {
  const valid = {
    title: 'Smartphone X',
    description: 'All-day battery.',
    price: 499.99,
    stock: 25,
    categoryId: 'c1',
    images: 'https://a.test/phone.jpg',
  };

  test('turns the image text into the array the API expects', () => {
    expect(productInputSchema.parse(valid).images).toEqual(['https://a.test/phone.jpg']);
  });

  test('requires a description, as CreateProductDto does', () => {
    expect(productInputSchema.safeParse({ ...valid, description: ' ' }).success).toBe(false);
  });

  test('accepts zero stock but not a fraction of one', () => {
    expect(productInputSchema.safeParse({ ...valid, stock: 0 }).success).toBe(true);
    expect(productInputSchema.safeParse({ ...valid, stock: 2.5 }).success).toBe(false);
  });

  test('rejects a free product', () => {
    expect(productInputSchema.safeParse({ ...valid, price: 0 }).success).toBe(false);
  });

  test('names the bad line when one image is not a URL', () => {
    const result = productInputSchema.safeParse({
      ...valid,
      images: 'https://a.test/ok.jpg\nnot a url',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('not a url');
  });
});
