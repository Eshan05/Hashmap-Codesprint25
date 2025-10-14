'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AutosizeTextarea } from '@/components/ui/autoresize-textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IoInformationOutline } from 'react-icons/io5';

const FormSchema = z.object({
  diseaseName: z
    .string()
    .trim()
    .min(3, 'Please provide at least 3 characters to help us identify the condition.')
    .max(120, 'Keep disease names under 120 characters for best results.')
    .regex(/^[a-z0-9 ,.'()/-]+$/i, 'Use letters, numbers, spaces, or simple punctuation (.,\'()/-).'),
});

export default function DiseaseSearchForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      diseaseName: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    const payload = { diseaseName: values.diseaseName.trim() };
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/diseases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Something went wrong. Please try again.');
        return;
      }

      const result = await response.json();
      if (result?.searchId) {
        router.push(`/dashboard/diseases/${result.searchId}`);
      } else {
        setError('We could not determine where to send you. Please retry.');
      }
    } catch (err) {
      setError('Unable to process the request. Check your network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="diseaseName"
          render={({ field }) => (
            <FormItem className="lg:grid lg:grid-cols-3 gap-2">
              <FormLabel className="p-1">
                <header className="px-1 flex items-start gap-2 font-medium">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button size="sm-icon" variant="outline" type="button">
                        <IoInformationOutline className="hover:text-black dark:hover:text-white text-muted-foreground" />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-72 m-2 leading-normal bg-[#fff2] dark:bg-[#2224] backdrop-blur-lg">
                      <div className="space-y-1 flex flex-col text-sm">
                        <h4 className="font-semibold text-base">What should I type?</h4>
                        <p>
                          Enter a disease, condition, syndrome, or disorder. Feel free to include qualifiers like stage or type
                          (for example, "Stage 2 breast cancer" or "Type 1 diabetes").
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  <article className="flex flex-col items-start lg:gap-1">
                    <span className="text-base -mt-0.5">Condition name</span>
                    <p className="text-muted-foreground !text-sm hidden lg:block">
                      We will generate a gentle overview with symptoms, risks, treatments, and prevention tips.
                    </p>
                  </article>
                </header>
              </FormLabel>
              <div className="w-full lg:col-span-2 -mt-4 lg:mt-0 p-1">
                <FormControl>
                  <AutosizeTextarea
                    placeholder="e.g. Type 2 diabetes, Celiac disease, Viral meningitis"
                    minHeight={120}
                    maxHeight={220}
                    {...field}
                    className={`w-full ${loading ? 'cursor-not-allowed opacity-80' : ''}`}
                    disabled={loading}
                  />
                </FormControl>
                <p className="text-muted-foreground !text-sm inline-block lg:hidden py-2 px-1">
                  We will generate a gentle overview with symptoms, risks, treatments, and prevention tips.
                </p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <section className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating report…' : 'Generate insight'}
            </Button>
            <Button type="button" variant="secondary" disabled>
              Browse conditions (coming soon)
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="privacy-opt" defaultChecked disabled={loading} />
            <Label
              htmlFor="privacy-opt"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Don&apos;t store my inputs
            </Label>
          </div>
        </section>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>
    </Form>
  );
}
