export class PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(total: number, page: number, limit: number) {
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}

export class PaginatedResponseDto<T> {
  items: T[];
  meta: PaginationMeta;

  constructor(items: T[], total: number, page: number, limit: number) {
    this.items = items;
    this.meta = new PaginationMeta(total, page, limit);
  }

  static from<T>(items: T[], total: number, page: number, limit: number): PaginatedResponseDto<T> {
    return new PaginatedResponseDto(items, total, page, limit);
  }
}

export class ListResponseDto<T> {
  items: T[];
  meta: { total: number };

  constructor(items: T[]) {
    this.items = items;
    this.meta = { total: items.length };
  }

  static from<T>(items: T[], total?: number): ListResponseDto<T> {
    const dto = new ListResponseDto(items);
    if (total !== undefined) {
      dto.meta.total = total;
    }
    return dto;
  }
}
