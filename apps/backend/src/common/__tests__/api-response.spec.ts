import { PaginatedResponseDto, ListResponseDto, PaginationMeta } from '../dto/api-response.dto';

describe('PaginationMeta', () => {
  it('calculates totalPages correctly', () => {
    const meta = new PaginationMeta(100, 1, 20);
    expect(meta.total).toBe(100);
    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(20);
    expect(meta.totalPages).toBe(5);
  });

  it('handles non-even division', () => {
    const meta = new PaginationMeta(101, 1, 20);
    expect(meta.totalPages).toBe(6);
  });

  it('handles zero total', () => {
    const meta = new PaginationMeta(0, 1, 20);
    expect(meta.totalPages).toBe(0);
  });

  it('handles single item', () => {
    const meta = new PaginationMeta(1, 1, 20);
    expect(meta.totalPages).toBe(1);
  });
});

describe('PaginatedResponseDto', () => {
  it('creates response with items and meta', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const response = PaginatedResponseDto.from(items, 50, 1, 20);

    expect(response.items).toEqual(items);
    expect(response.meta.total).toBe(50);
    expect(response.meta.page).toBe(1);
    expect(response.meta.limit).toBe(20);
    expect(response.meta.totalPages).toBe(3);
  });

  it('serializes to expected JSON shape', () => {
    const response = PaginatedResponseDto.from(['a', 'b'], 10, 2, 5);
    const json = JSON.parse(JSON.stringify(response));

    expect(json).toEqual({
      items: ['a', 'b'],
      meta: {
        total: 10,
        page: 2,
        limit: 5,
        totalPages: 2,
      },
    });
  });
});

describe('ListResponseDto', () => {
  it('creates response with items and auto-counted meta', () => {
    const items = [1, 2, 3];
    const response = ListResponseDto.from(items);

    expect(response.items).toEqual([1, 2, 3]);
    expect(response.meta.total).toBe(3);
  });

  it('allows explicit total override', () => {
    const response = ListResponseDto.from([1, 2], 100);

    expect(response.items).toHaveLength(2);
    expect(response.meta.total).toBe(100);
  });

  it('serializes to expected JSON shape', () => {
    const response = ListResponseDto.from([{ id: 1 }]);
    const json = JSON.parse(JSON.stringify(response));

    expect(json).toEqual({
      items: [{ id: 1 }],
      meta: { total: 1 },
    });
  });
});
