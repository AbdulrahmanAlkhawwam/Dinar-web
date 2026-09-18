import { describe, expect, test } from 'vitest';

import { categorySchema, productSchema } from './catalog';

const category = {
  id: 'c1',
  name: 'Electronics',
  image: null,
  createdAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
};

describe('catalog schemas', () => {
  // The OpenAPI document types image as an object. Prisma says String?.
  test('accepts a category with no image', () => {
    expect(categorySchema.parse(category).image).toBeNull();
  });

  test('parses a product with its category included', () => {
    const product = productSchema.parse({
      id: 'p1',
      title: 'Smartphone X',
      description: 'All-day battery.',
      price: 499.99,
      images: [],
      stock: 0,
      categoryId: 'c1',
      category,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    });

    expect(product.category.name).toBe('Electronics');
    expect(product.stock).toBe(0);
  });
});
