'use client'

import Recent from '@/components/features/core/recent';
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from '@/components/ui/credenza';
import { RecentSearch } from '@/types/recent-search';
import { useQuery } from '@tanstack/react-query';
import { ClockIcon, FileQuestionIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

function SymptomFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="lg:grid lg:grid-cols-3 gap-2">
        <div className="space-y-3 p-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-48 hidden lg:block" />
        </div>
        <div className="lg:col-span-2 p-1">
          <Skeleton className="h-32 w-full" />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-3 gap-2">
        <div className="space-y-3 p-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="lg:col-span-2 p-1">
          <Skeleton className="h-24 w-full" />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-3 gap-2">
        <div className="space-y-3 p-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="lg:col-span-2 p-1">
          <Skeleton className="h-24 w-full" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
}

const SymptomFormMain = dynamic(() => import('./_components/symptom-form-main'), {
  ssr: false,
  loading: SymptomFormSkeleton,
});

const fetchRecentSearches = async (): Promise<RecentSearch[]> => {
  const response = await fetch('/api/v1/symptoms/recent');
  if (!response.ok) {
    throw new Error('Failed to fetch recent searches');
  }
  const result = await response.json();
  return result.data || result;
};

export default function SymptomSearchPage() {
  const { data: recentSearches = [], isLoading, error: queryError } = useQuery<RecentSearch[]>({
    queryKey: ['symp-recents'],
    queryFn: fetchRecentSearches,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <section className="relative overflow-x-hidden flex flex-col min-h-svh">
      <div className="w-full px-4 py-8 lg:px-8">
        <header className='relative flex flex-col items-center mb-10 space-y-2'>
          <h1 className="shadow-heading text-4xl sm:text-5xl md:text-6xl my-4">Symptom Analyzer</h1>
          <Credenza>
            <CredenzaTrigger>
              <div className="flex-center-2 justify-center cursor-pointer">
                <ClockIcon className="size-4" />
                <h1 className="text-2xl font-light tracking-tight">View Recent</h1>
              </div>
            </CredenzaTrigger>

            <CredenzaContent>
              <CredenzaHeader>
                <CredenzaTitle>Recent Searches</CredenzaTitle>
              </CredenzaHeader>
              <CredenzaBody>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Loading recent searches...
                    </p>
                  </div>
                ) : queryError ? (
                  <div className="text-center py-8">
                    <FileQuestionIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Error loading recent searches. Please try again later.
                    </p>
                  </div>
                ) : recentSearches.length > 0 ? (
                  <div className="space-y-3">
                    <Recent items={recentSearches} basePath='/dashboard/symptom-search' />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileQuestionIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No recent searches found. Your searches will appear here.
                    </p>
                  </div>
                )}
              </CredenzaBody>
            </CredenzaContent>
          </Credenza>
        </header>
        <section className='flex flex-col lg:flex-row gap-4 lg:items-start lg:justify-between'>
          <main className='lg:max-w-6xl mx-auto border rounded-lg p-2 lg:p-6 bg-[#ddd2] dark:bg-[#2222] backdrop-blur-lg'>
            <SymptomFormMain />
          </main>
        </section>
      </div>
    </section>
  );
}