import { NextResponse } from 'next/server';

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function error(message: string, status = 400, code?: string) {
  return NextResponse.json({ success: false, error: message, code }, { status });
}

export function paginated<T>(data: T[], meta: { total: number; page: number; pageSize: number }) {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.pageSize),
      hasNext: meta.page * meta.pageSize < meta.total,
      hasPrev: meta.page > 1,
    },
  });
}
