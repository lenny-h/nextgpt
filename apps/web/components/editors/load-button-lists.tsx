import { useFilter } from "@/contexts/filter-context";
import { useGlobalTranslations } from "@/contexts/web-translations";
import { usePdf } from "@/contexts/pdf-context";
import { useRefs } from "@/contexts/refs-context";
import { useDocumentHandler } from "@/hooks/use-document-handler";
import { ArtifactKind } from "@/types/artifact-kind";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
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
  course_id: string;
}

export const FilesList = memo(({ open, setOpen, inputValue }: Props) => {
  const { globalT } = useGlobalTranslations();

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
      rpcProcedure="get_courses_files"
      rpcParams={{
        p_course_ids: filter.courses.map((c) => c.id),
      }}
      ilikeProcedure="ilike_courses_files"
      ilikeParams={{
        p_course_ids: filter.courses.map((c) => c.id),
      }}
      selectedItems={[]}
      onToggleItem={handleItemClick}
      disabledMessage={globalT.components.loadButtonLists.selectCourseFirst}
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
      rpcProcedure="get_user_documents"
      rpcParams={{}}
      ilikeProcedure="ilike_user_documents"
      ilikeParams={{}}
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
  const router = useRouter();
  const { locale } = useGlobalTranslations();

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
      rpcProcedure="get_user_chats"
      rpcParams={{}}
      ilikeProcedure="ilike_user_chats"
      ilikeParams={{}}
      selectedItems={[]}
      onToggleItem={handleItemClick}
      maxItems={1}
    />
  );
});
