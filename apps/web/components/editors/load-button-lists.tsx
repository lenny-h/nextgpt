import { useFilter } from "@/contexts/filter-context";
import { usePdf } from "@/contexts/pdf-context";
import { useRefs } from "@/contexts/refs-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { useDocumentHandler } from "@/hooks/use-document-handler";
import { type ArtifactKind } from "@workspace/api-routes/types/artifact-kind";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { FilterableList, ListItem } from "../custom/filterable-list";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  inputValue: string;
}

interface File extends ListItem {
  id: string;
  name: string;
  courseId: string;
}

export const FilesList = memo(({ open, setOpen, inputValue }: Props) => {
  const { sharedT } = useSharedTranslations();
  const { webT } = useWebTranslations();

  const isMobile = useIsMobile();

  const { filter } = useFilter();
  const { panelRef } = useRefs();
  const { openPdf } = usePdf();

  const handleItemClick = (item: ListItem) => {
    const file = item as File;
    openPdf(isMobile, panelRef, file.course_id, file.name);
    setOpen(false);
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
      selectedItems={[]}
      onToggleItem={handleItemClick}
      disabledMessage={webT.loadButtonLists.selectCourseFirst}
      enabled={filter.courses.length > 0}
      maxItems={5}
    />
  );
});

interface Document extends ListItem {
  id: string;
  title: string;
  kind: ArtifactKind;
}

export const DocumentsList = memo(({ open, setOpen, inputValue }: Props) => {
  const { sharedT } = useSharedTranslations();

  const { handleDocumentClick } = useDocumentHandler();

  const handleItemClick = (item: ListItem) => {
    const document = item as Document;
    handleDocumentClick(document.id, document.title, document.kind);
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
              query: {
                prefix,
              },
            }),
          sharedT.apiCodes,
        )
      }
      selectedItems={[]}
      onToggleItem={handleItemClick}
      maxItems={1}
    />
  );
});

interface Chat extends ListItem {
  id: string;
  title: string;
}

export const ChatsList = memo(({ open, setOpen, inputValue }: Props) => {
  const { locale, sharedT } = useSharedTranslations();

  const router = useRouter();

  const handleItemClick = (item: ListItem) => {
    const chat = item as Chat;
    router.push(`/${locale}/chat/${chat.id}`);
    setOpen(false);
  };

  return (
    <FilterableList
      open={open}
      inputValue={inputValue}
      queryKey={["chats"]}
      queryFn={({ pageParam }) =>
        apiFetcher(
          (client) =>
            client.chats.$get({
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
            client.chats.ilike.$get({
              query: {
                prefix,
              },
            }),
          sharedT.apiCodes,
        )
      }
      selectedItems={[]}
      onToggleItem={handleItemClick}
      maxItems={1}
    />
  );
});
