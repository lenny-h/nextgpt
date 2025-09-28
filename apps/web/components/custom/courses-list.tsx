import { useFilter } from "@/contexts/filter-context";
import { useGlobalTranslations } from "@/contexts/global-translations";
import { CourseAccessCache } from "@/lib/course-access-cache";
import { checkResponse } from "@workspace/ui/lib/translation-utils";
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
    const { globalT } = useGlobalTranslations();
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
      toast.promise(
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/courses/validate-access`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ courseId: course.id }),
          },
        ).then(async (response) => {
          checkResponse(response, globalT.globalErrors);

          const { hasAccess } = await response.json();
          return hasAccess;
        }),
        {
          loading: "Checking course access...",
          success: (hasAccess) => {
            CourseAccessCache.set(course.id, hasAccess);
            if (hasAccess) {
              onAddCourseToFilter(course);
              return "Course access validated!";
            } else {
              onShowKeyDialog(course);
              return "Course key required";
            }
          },
          error: (error) => {
            console.error(error);
            return "Unable to validate access, please try again later";
          },
        },
      );
    };

    return (
      <FilterableList
        open={open}
        inputValue={inputValue}
        queryKey={["courses", filter.bucketId]}
        rpcProcedure="get_bucket_courses"
        rpcParams={{
          p_bucket_id: filter.bucketId,
        }}
        ilikeProcedure="ilike_bucket_courses"
        ilikeParams={{
          p_bucket_id: filter.bucketId,
        }}
        selectedItems={filter.courses}
        onToggleItem={toggleCourse}
        disabledMessage="Please select a bucket first"
        enabled={!!filter.bucketId}
        maxItems={max}
      />
    );
  },
);
