"use client";

import { rpcFetcher } from "@/lib/fetcher";
import { StudyMode } from "@/lib/study-modes";
import type { FrontendFilter } from "@/types/filter";
import { useQuery } from "@tanstack/react-query";
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
        bucket_id: string;
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
  const [filter, setFilter] = useState<FrontendFilter>({
    bucketId: "",
    courses: [],
    files: [],
    documents: [],
  });

  const [studyMode, setStudyMode] = useState<StudyMode>("facts");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["buckets"],
    queryFn: () => rpcFetcher("get_user_buckets"),
  });

  useEffect(() => {
    if (data && data.length > 0 && data[0]) {
      const bucketId = data[0].bucket_id;
      setFilter({
        bucketId,
        courses: [],
        files: [],
        documents: [],
      });
    }
  }, [data]);

  return (
    <FilterContext.Provider
      value={{
        data,
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
