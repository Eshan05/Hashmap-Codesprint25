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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IoInformationOutline } from "react-icons/io5";
import { ModeDrawer } from './mode-drawer';

const FormSchema = z.object({
  searchType: z.string(),
  query: z.string(),
})

const getQueryPlaceholder = (searchType: string) => {
  switch (searchType) {
    case 'disease':
      return 'Enter disease name';
    case 'name':
      return 'Enter medicine name';
    case 'sideEffects':
      return 'Enter side effect(s)';
    case 'ingredient':
      return 'Enter ingredient name';
    case 'similar':
      return 'Enter medicine name';
    default:
      return '';
  }
};

export default function MedSearchForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      searchType: 'name',
      query: '',
    },
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [searchType, setSearchType] = useState<string>('name');
  const [queryPlaceholder, setQueryPlaceholder] = useState<string>(getQueryPlaceholder('name'));

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setLoading(true);
    setError('');
    // console.log(data);
    try {
      const response = await fetch('/api/v1/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const payload = await response.json();
        const destinationId = payload.searchId;
        if (destinationId) {
          router.push(`/dashboard/medicine-search/${destinationId}`);
        } else {
          setError('Missing search identifier in response');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'An error occurred');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="searchType"
          render={({ field }) => (
            <FormItem className='lg:grid lg:grid-cols-3 gap-2'>
              <FormLabel className="p-1">
                <header className="px-1 flex items-start gap-2 font-medium">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button size={'sm-icon'} variant='outline' type='button'>
                        <IoInformationOutline className='hover:text-black dark:hover:text-white text-muted-foreground' />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className='w-72 m-2 leading-normal bg-[#fff2] dark:bg-[#2224] backdrop-blur-lg'>
                      <div className="space-y-1 flex flex-col">
                        <h4 className="font-semibold text-base">Search For</h4>
                        <p className="text-[.75rem] font-normal">
                          You can choose to search for medicines either by diseases it&apos;s used for, by name, by side effects it has, by ingredient it contains or by dosage information.
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  <article className='flex flex-col items-start lg:gap-1'>
                    <span className='text-base -mt-0.5'>Search Type</span>
                    <div className='gap-2 space-evenly items-start lg:flex hidden'>
                      <p className='text-muted-foreground !text-sm inline-block'>Select a mode (Hover over the information icon to know more), you can see examples for different modes <ModeDrawer /></p>
                    </div>
                  </article>
                </header>
              </FormLabel>
              <div className='w-full lg:col-span-2 -mt-4 lg:mt-0 p-1'>
                <FormControl>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSearchType(value);
                      setQueryPlaceholder(getQueryPlaceholder(value));
                    }}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a search type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disease">By Disease</SelectItem>
                      <SelectItem value="name">By Medicine Name</SelectItem>
                      <SelectItem value="sideEffects">By Side Effects</SelectItem>
                      <SelectItem value="ingredient">By Ingredient</SelectItem>
                      <SelectItem value="similar">Similar Medicines</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <p className='text-muted-foreground !text-sm inline-block lg:hidden py-2 px-1'>Select a mode (Hover over the information icon to know more), you can see examples for different modes <ModeDrawer /></p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem className='lg:grid lg:grid-cols-3 gap-2'>
              <FormLabel className="p-1">
                <header className="px-1 flex items-start gap-2 font-medium">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button size={'sm-icon'} variant='outline' type='button'>
                        <IoInformationOutline className='hover:text-black dark:hover:text-white text-muted-foreground' />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className='w-72 m-2 leading-normal bg-[#fff2] dark:bg-[#2224] backdrop-blur-lg'>
                      <div className="space-y-1 flex flex-col">
                        <h4 className="font-semibold text-base">Query</h4>
                        <p className="text-[.75rem] font-normal">
                          You can choose to search for medicines either by diseases it&apos;s used for, by name, by side effects it has, by ingredient it contains or by dosage information.
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  <article className='flex flex-col items-start lg:gap-1'>
                    <span className='text-base -mt-0.5'>Query</span>
                    <div className='gap-2 space-evenly items-start lg:flex hidden'>
                      <p className='text-muted-foreground !text-sm inline-block'>Select a mode (Hover over the information icon to know more), you can see examples for different modes <ModeDrawer /></p>
                    </div>
                  </article>
                </header>
              </FormLabel>
              <div className='w-full lg:col-span-2 -mt-4 lg:mt-0 p-1'>
                <FormControl>
                  <AutosizeTextarea placeholder={queryPlaceholder} {...field} className={`w-full ${loading ? 'cursor-not-allowed' : ''} $`} />
                </FormControl>
                <p className='text-muted-foreground !text-sm inline-block lg:hidden py-2 px-1'>Select a mode (Hover over the information icon to know more), you can see examples for different modes <ModeDrawer /></p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={loading}>
              {loading ? 'Forming Response...' : 'Search'}
            </Button>
            {/* // TODO: Make it like symptom drawer */}
            {searchType === 'disease' && <Button type="button" variant="secondary">List of diseases</Button>}
            {searchType === 'name' && <Button type="button" variant="secondary">List of medicines and drugs</Button>}
            {searchType === 'sideEffects' && <Button type="button" variant="secondary">List of common side effects</Button>}
            {searchType === 'ingredient' && <Button type="button" variant="secondary">List of medical ingredients</Button>}
            {searchType === 'similar' && <Button type="button" variant="secondary">List of medicines and drugs</Button>}
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox id="data-share" defaultChecked />
            <Label htmlFor="data-share"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Don&apos;t store my inputs
            </Label>
          </div>
        </section>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </Form>
  )
};