import { useFilter } from "@/contexts/filter-context";
import { type ArtifactKind } from "@workspace/api-routes/types/artifact-kind";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { memo } from "react";
import { FilterableList, type ListItem } from "./filterable-list";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  inputValue: string;
  max: number;
}

interface File extends ListItem {
  id: string;
  name: string;
  pageCount?: number | null;
}

export const FilesList = memo(({ open, inputValue, max }: Props) => {
  const { sharedT } = useSharedTranslations();

  const { filter, setFilter } = useFilter();

  const toggleFile = (item: ListItem) => {
    const file = item as File;
    const fileIncluded = filter.files.map((f) => f.id).includes(file.id);

    const newFilter = {
      ...filter,
      files: fileIncluded
        ? filter.files.filter((f) => f.id !== file.id)
        : [...filter.files, file],
    };
    setFilter(newFilter);
  };

  return (
    <FilterableList
      open={open}
      inputValue={inputValue}
      queryKey={["files", ...filter.courses.map((c) => c.id)]}
      queryFn={({ pageParam }) =>
        apiFetcher(
          (client) =>
            client.files.$get({
              query: {
                bucketId: filter.bucket.id,
                courseIds: filter.courses.map((c) => c.id).join(","),
                pageNumber: (pageParam ?? 0).toString(),
                itemsPerPage: "10",
              },
            }),
          sharedT.apiCodes,
        )
      }
      ilikeQueryFn={(prefix) =>
        apiFetcher(
          (client) =>
            client.files.ilike.$get({
              query: {
                prefix,
                bucketId: filter.bucket.id,
                courseIds: filter.courses.map((c) => c.id).join(","),
              },
            }),
          sharedT.apiCodes,
        )
      }
      selectedItems={filter.files}
      onToggleItem={toggleFile}
      disabledMessage="Please select a course first"
      enabled={filter.courses.length > 0}
      maxItems={max}
    />
  );
});

interface Document extends ListItem {
  id: string;
  title: string;
  kind: ArtifactKind;
}

export const DocumentsList = memo(
  ({ open, setOpen, inputValue, max }: Props) => {
    const { sharedT } = useSharedTranslations();

    const { filter, setFilter } = useFilter();

    const toggleDocument = (item: ListItem) => {
      const document = item as Document;
      const documentIncluded = filter.documents
        .map((d) => d.id)
        .includes(document.id);

      const newFilter = {
        ...filter,
        documents: documentIncluded ? [] : [document],
      };
      setFilter(newFilter);

      setOpen(false);
    };

    return (
      <FilterableList
        open={open}
        inputValue={inputValue}
        queryKey={["documents"]}
        queryFn={({ pageParam }) =>
          apiFetcher(
            (client) =>
              client.documents.$get({
                query: {
                  pageNumber: (pageParam ?? 0).toString(),
                  itemsPerPage: "10",
                },
              }),
            sharedT.apiCodes,
          )
        }
        ilikeQueryFn={(prefix) =>
          apiFetcher(
            (client) =>
              client.documents.ilike.$get({
                query: { prefix },
              }),
            sharedT.apiCodes,
          )
        }
        selectedItems={filter.documents}
        onToggleItem={toggleDocument}
        maxItems={max}
      />
    );
  },
);

interface Prompt extends ListItem {
  id: string;
  name: string;
  content: string;
}

export const PromptsList = memo(({ open, inputValue, max }: Props) => {
  const { sharedT } = useSharedTranslations();

  const { filter, setFilter } = useFilter();

  const togglePrompt = (item: ListItem) => {
    const prompt = item as Prompt;
    const promptIncluded = filter.prompts.map((p) => p.id).includes(prompt.id);

    const newFilter = {
      ...filter,
      prompts: promptIncluded
        ? filter.prompts.filter((p) => p.id !== prompt.id)
        : [...filter.prompts, prompt],
    };
    setFilter(newFilter);
  };

  return (
    <FilterableList
      open={open}
      inputValue={inputValue}
      queryKey={["prompts"]}
      queryFn={async () => {
        const response = await apiFetcher(
          (client) => client.prompts.$get(),
          sharedT.apiCodes,
        );
        return response;
      }}
      ilikeQueryFn={async (prefix) => {
        const response = await apiFetcher(
          (client) => client.prompts.ilike.$get({ query: { prefix } }),
          sharedT.apiCodes,
        );
        return response;
      }}
      selectedItems={filter.prompts}
      onToggleItem={togglePrompt}
      maxItems={max}
    />
  );
});
