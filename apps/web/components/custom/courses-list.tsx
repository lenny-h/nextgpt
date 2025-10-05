import { useFilter } from "@/contexts/filter-context";
import { CourseAccessCache } from "@/lib/course-access-cache";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { memo, useCallback } from "react";
import { toast } from "sonner";
import { FilterableList, ListItem } from "./filterable-list";

interface Props {
  open: boolean;
  inputValue: string;
  max: number;
  onShowKeyDialog: (course: Course) => void;
  onAddCourseToFilter: (course: Course) => void;
}

interface Course extends ListItem {
  id: string;
  name: string;
  private: boolean;
}

export const CoursesList = memo(
  ({ open, inputValue, max, onShowKeyDialog, onAddCourseToFilter }: Props) => {
    const { sharedT } = useSharedTranslations();

    const { filter, setFilter } = useFilter();

    const removeCourseFromFilter = useCallback(
      (course: Course) => {
        const newFilter = {
          ...filter,
          courses: filter.courses.filter((c) => c.id !== course.id),
        };
        setFilter(newFilter);
      },
      [filter, setFilter],
    );

    const toggleCourse = async (item: ListItem) => {
      const course = item as Course;
      const courseIncluded = filter.courses
        .map((c) => c.id)
        .includes(course.id);

      // If removing course, just remove it
      if (courseIncluded) {
        removeCourseFromFilter(course);
        return;
      }

      // If course is not private, add it directly
      if (!course.private) {
        onAddCourseToFilter(course);
        return;
      }

      const cachedAccess = CourseAccessCache.get(course.id);
      if (cachedAccess !== null) {
        if (cachedAccess) {
          onAddCourseToFilter(course);
        } else {
          onShowKeyDialog(course);
        }
        return;
      }

      // Validate course access
      const validateAccessPromise = apiFetcher(
        (client) =>
          client.courses["validate-access"].$post({
            json: { courseId: course.id },
          }),
        sharedT.apiCodes,
      ).then(({ hasAccess }) => {
        CourseAccessCache.set(course.id, hasAccess);
        if (hasAccess) {
          onAddCourseToFilter(course);
        } else {
          onShowKeyDialog(course);
        }
        return hasAccess;
      });

      toast.promise(validateAccessPromise, {
        loading: "Checking course access...",
        success: (hasAccess) =>
          hasAccess ? "Course access validated!" : "Course key required",
        error: (error) => "Error checking course access: " + error.message,
      });
    };

    return (
      <FilterableList
        open={open}
        inputValue={inputValue}
        queryKey={["courses", filter.bucketId]}
        queryFn={({ pageParam }) =>
          apiFetcher(
            (client) =>
              client["courses"][":bucketId"].$get({
                param: { bucketId: filter.bucketId },
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
              client["courses"]["ilike"][":bucketId"].$get({
                param: { bucketId: filter.bucketId },
                query: {
                  prefix,
                },
              }),
            sharedT.apiCodes,
          )
        }
        selectedItems={filter.courses}
        onToggleItem={toggleCourse}
        disabledMessage="Please select a bucket first"
        enabled={!!filter.bucketId}
        maxItems={max}
      />
    );
  },
);
