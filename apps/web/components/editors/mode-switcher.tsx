import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useEditor } from "@workspace/ui/contexts/editor-context";
import { ChevronDownIcon, CodeIcon, File, FileText } from "lucide-react";
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
          <FileText className="mr-2 size-4" />
          Text
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setEditorMode("code")}
        >
          <CodeIcon className="mr-2 size-4" />
          Code
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setEditorMode("pdf")}
        >
          <File className="mr-2 size-4" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
