import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PaginationQueryDto } from '../dto/pagination.dto';

describe('PaginationQueryDto', () => {
  function createDto(plain: Record<string, unknown>) {
    return plainToInstance(PaginationQueryDto, plain);
  }

  it('applies defaults when no values provided', () => {
    const dto = createDto({});
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
  });

  it('accepts valid page and limit', async () => {
    const dto = createDto({ page: 3, limit: 50 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(50);
  });

  it('transforms string values to numbers', () => {
    const dto = createDto({ page: '5', limit: '10' });
    expect(dto.page).toBe(5);
    expect(dto.limit).toBe(10);
  });

  it('rejects page below 1', async () => {
    const dto = createDto({ page: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects limit below 1', async () => {
    const dto = createDto({ limit: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects limit above 100', async () => {
    const dto = createDto({ limit: 200 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
