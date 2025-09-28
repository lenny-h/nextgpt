import { useEditor } from "@/contexts/editor-context";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { ChevronDownIcon, CodeIcon, FileTextIcon } from "lucide-react";
import { memo } from "react";

export const ModeSwitcher = memo(() => {
  const [editorMode, setEditorMode] = useEditor();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {editorMode.charAt(0).toUpperCase() + editorMode.slice(1)}
          <ChevronDownIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setEditorMode("text")}
        >
          <FileTextIcon className="size-4 mr-2" />
          Text
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setEditorMode("code")}
        >
          <CodeIcon className="size-4 mr-2" />
          Code
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
