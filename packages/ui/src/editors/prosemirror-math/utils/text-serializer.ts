import { textEditorSchema } from "@workspace/ui/editors/prosemirror-math/config";
import {
  SchemaMarkT,
  SchemaNodeT,
} from "@workspace/ui/editors/prosemirror-math/utils/types";
import {
  defaultMarkdownSerializer,
  MarkdownSerializer,
} from "prosemirror-markdown";
import {
  Fragment,
  Mark,
  MarkType,
  NodeType,
  Node as ProseNode,
  Schema,
  Slice,
} from "prosemirror-model";

////////////////////////////////////////////////////////////////////////////////

type TypedNode<T extends string> = ProseNode & { type: NodeType & { name: T } };
type TypedMark<T extends string> = Mark & { type: MarkType & { name: T } };

type NodeSerializer<T extends string> = (node: TypedNode<T>) => string;
type MarkSerializer<T extends string> = (mark: TypedMark<T>) => string;

class ProseMirrorTextSerializer<S extends Schema<any, any>> {
  public nodes: { [name: string]: NodeSerializer<string> | undefined };
  public marks: { [name: string]: NodeSerializer<string> | undefined };

  constructor(
    fns: {
      nodes?: { [name in SchemaNodeT<S>]?: NodeSerializer<name> };
      marks?: { [name in SchemaMarkT<S>]?: MarkSerializer<name> };
    },
    base?: ProseMirrorTextSerializer<S>
  ) {
    // use base serializer as a fallback
    this.nodes = { ...base?.nodes, ...fns.nodes };
    this.marks = { ...base?.marks, ...fns.marks };
  }

  serializeNode(node: ProseNode): string | null {
    // check if one of our custom serializers handles this node
    const nodeSerializer = this.nodes[node.type.name];
    if (nodeSerializer !== undefined) {
      return nodeSerializer(node);
    } else {
      return null;
    }
  }

  serializeFragment(fragment: Fragment): string {
    // adapted from the undocumented `Fragment.textBetween` function
    // https://github.com/ProseMirror/prosemirror-model/blob/eef20c8c6dbf841b1d70859df5d59c21b5108a4f/src/fragment.js#L46
    const blockSeparator = "\n\n";
    const leafText: string | undefined = undefined;
    let text: string = "";
    let separated: boolean = true;

    const from = 0;
    const to = fragment.size;

    fragment.nodesBetween(
      from,
      to,
      (node, pos) => {
        // check if one of our custom serializers handles this node
        const serialized: string | null = this.serializeNode(node);
        if (serialized !== null) {
          text += serialized;
          return false;
        }

        if (node.isText) {
          text += node.text?.slice(Math.max(from, pos) - pos, to - pos) || "";
          separated = !blockSeparator;
        } else if (node.isLeaf && leafText) {
          text += leafText;
          separated = !blockSeparator;
        } else if (!separated && node.isBlock) {
          text += blockSeparator;
          separated = true;
        }
      },
      0
    );

    return text;
  }

  serializeSlice(slice: Slice): string {
    return this.serializeFragment(slice.content);
  }
}

export const mathTextSerializer = new ProseMirrorTextSerializer<
  typeof textEditorSchema
>({
  nodes: {
    math_inline: (node) => `$${node.textContent}$`,
    math_display: (node) => `\n\n$$\n${node.textContent}\n$$`,
  },
});

export const mathMarkdownSerializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,

    table(state, node) {
      state.write("\n");
      node.forEach((row) => {
        state.write("|");
        row.forEach((cell) => {
          state.write(" ");
          state.text(cell.textContent);
          state.write(" |");
        });
        // state.write("|");
        state.write("\n");

        // Add separator after header row
        if (row.firstChild?.type.name === "table_header") {
          state.write("|");
          row.forEach(() => state.write(" --- |"));
          state.write("\n");
        }
      });
      state.write("\n");
    },

    math_inline(state, node) {
      state.write(`$${node.textContent}$`);
    },
    math_display(state, node) {
      state.write(`\n\n$$\n${node.textContent}\n$$`);
    },
  },
  defaultMarkdownSerializer.marks
);

export const mathLatexSerializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,

    ordered_list(state, node) {
      state.write("\n\\begin{enumerate}\n");
      node.forEach((item) => {
        state.write("\\item ");
        state.renderInline(item);
        state.write("\n");
      });
      state.write("\\end{enumerate}\n");
    },

    bullet_list(state, node) {
      state.write("\n\\begin{itemize}\n");
      node.forEach((item) => {
        state.write("\\item ");
        state.renderInline(item);
        state.write("\n");
      });
      state.write("\\end{itemize}\n");
    },

    list_item(state, node) {
      state.write("\\item ");
      state.renderInline(node);
      state.write("\n");
    },

    table(state, node) {
      // Count columns in first row for column spec
      const colCount = node.firstChild?.childCount || 0;
      const colSpec = "c".repeat(colCount);

      state.write(
        `\n\\begin{table}[h]\n\\begin{tabular}{|${colSpec}|}\n\\hline\n`
      );

      node.forEach((row) => {
        row.forEach((cell, _, i) => {
          state.text(cell.textContent);
          state.write(i < row.childCount - 1 ? " & " : " \\\\");
        });
        state.write(" \\hline\n");
      });

      state.write("\\end{tabular}\n\\end{table}\n");
    },

    heading(state, node) {
      state.write(
        node.attrs.level === 1
          ? `\\section{${node.textContent}}`
          : node.attrs.level === 2
            ? `\\subsection{${node.textContent}}`
            : `\\subsubsection{${node.textContent}}`
      );
    },

    code_block(state, node) {
      state.write(`\\begin{verbatim}\n${node.textContent}\n\\end{verbatim}`);
    },

    math_inline(state, node) {
      state.write(`$${node.textContent}$`);
    },
    math_display(state, node) {
      state.write(`\n\n$$\n${node.textContent}\n$$`);
    },
  },
  {
    ...defaultMarkdownSerializer.marks,
    strong: {
      open: "\\textbf{",
      close: "}",
      mixable: true,
      expelEnclosingWhitespace: true,
    },
    em: {
      open: "\\textit{",
      close: "}",
      mixable: true,
      expelEnclosingWhitespace: true,
    },
  }
);
