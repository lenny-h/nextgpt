"use client";

import { type StudyMode } from "@/lib/study-modes";
import { type FrontendFilter } from "@/types/filter";
import { useQuery } from "@tanstack/react-query";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface Props {
  children: ReactNode;
}

interface FilterContextType {
  data:
    | {
        bucketId: string;
        name: string;
        type: string;
      }[]
    | undefined;
  isLoading: boolean;
  isError: boolean;
  filter: FrontendFilter;
  setFilter: React.Dispatch<React.SetStateAction<FrontendFilter>>;
  studyMode: StudyMode;
  setStudyMode: React.Dispatch<React.SetStateAction<StudyMode>>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: Props) {
  const { sharedT } = useSharedTranslations();

  const [filter, setFilter] = useState<FrontendFilter>({
    bucketId: "",
    courses: [],
    files: [],
    documents: [],
  });

  const [studyMode, setStudyMode] = useState<StudyMode>("facts");

  const {
    data: bucketsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["buckets"],
    queryFn: () =>
      apiFetcher(
        (client) => client["buckets"]["used"].$get(),
        sharedT.apiCodes,
      ),
  });

  const buckets = bucketsData?.items;

  useEffect(() => {
    if (buckets && buckets.length > 0 && buckets[0]) {
      setFilter({
        bucketId: buckets[0].bucketId,
        courses: [],
        files: [],
        documents: [],
      });
    }
  }, [buckets]);

  return (
    <FilterContext.Provider
      value={{
        data: buckets,
        isLoading,
        isError,
        filter,
        setFilter,
        studyMode,
        setStudyMode,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter(): FilterContextType {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
}
