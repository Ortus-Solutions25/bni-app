/**
 * Type definitions for matrix analytics
 */

export interface MatrixData {
  members: string[];
  matrix: number[][];
  totals?: {
    given?: Record<string, number>;
    received?: Record<string, number>;
    unique_given?: Record<string, number>;
    unique_received?: Record<string, number>;
  };
  summaries?: {
    neither?: Record<string, number>;
    oto_only?: Record<string, number>;
    referral_only?: Record<string, number>;
    both?: Record<string, number>;
  };
  legend?: Record<string, string>;
}

export interface TYFCBData {
  inside: {
    total_amount: number;
    count: number;
    by_member: Record<string, number>;
  };
  outside: {
    total_amount: number;
    count: number;
    by_member: Record<string, number>;
  };
  month_year: string;
  processed_at: string;
}

export type MatrixType = 'referral' | 'oto' | 'combination';

export interface MatrixTabProps {
  chapterData: {
    chapterId: string;
    chapterName: string;
  };
}
