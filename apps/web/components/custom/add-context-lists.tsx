import { useFilter } from "@/contexts/filter-context";
import { memo } from "react";
import { FilterableList, ListItem } from "./filterable-list";
import { type ArtifactKind } from "@/types/artifact-kind";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  inputValue: string;
  max: number;
}

interface File extends ListItem {
  id: string;
  name: string;
  course_id: string;
}

export const FilesList = memo(({ open, inputValue, max }: Props) => {
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
      rpcProcedure="get_courses_files"
      rpcParams={{
        p_course_ids: filter.courses.map((c) => c.id),
      }}
      ilikeProcedure="ilike_courses_files"
      ilikeParams={{
        p_course_ids: filter.courses.map((c) => c.id),
      }}
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
        rpcProcedure="get_user_documents"
        rpcParams={{}}
        ilikeProcedure="ilike_user_documents"
        ilikeParams={{}}
        selectedItems={filter.documents}
        onToggleItem={toggleDocument}
        maxItems={max}
      />
    );
  }
);
