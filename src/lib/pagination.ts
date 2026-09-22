export type PaginationMeta = {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    from: number;
    to: number;
};

export type PaginatedResponse<T, TFacets = Record<string, never>> = {
    items: T[];
    pagination: PaginationMeta;
    facets: TFacets;
};

function positiveInteger(value: string | null, fallback: number) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function readPagination(searchParams: URLSearchParams, defaultPageSize = 24, maxPageSize = 100) {
    const page = positiveInteger(searchParams.get("page"), 1);
    const pageSize = Math.min(positiveInteger(searchParams.get("pageSize") || searchParams.get("size"), defaultPageSize), maxPageSize);
    return { page, pageSize, skip: (page - 1) * pageSize };
}

export function paginationMeta(total: number, page: number, pageSize: number): PaginationMeta {
    const offset = (page - 1) * pageSize;
    const hasItems = total > offset;
    return {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        from: hasItems ? offset + 1 : 0,
        to: hasItems ? Math.min(page * pageSize, total) : 0,
    };
}
