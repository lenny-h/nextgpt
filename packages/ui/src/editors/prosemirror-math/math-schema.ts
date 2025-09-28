import { MarkSpec, NodeSpec, SchemaSpec } from "prosemirror-model";

import { tableNodes } from "@workspace/ui/editors/prosemirror-tables/schema";
import {
  defaultBlockMathParseRules,
  defaultInlineMathParseRules,
} from "@workspace/ui/editors/prosemirror-math/plugins/math-paste-rules";

////////////////////////////////////////////////////////////

interface SchemaSpecJson<N extends string = any, M extends string = any>
  extends SchemaSpec<N, M> {
  nodes: { [name in N]: NodeSpec };
  marks: { [name in M]: MarkSpec };
  topNode?: string;
}

////////////////////////////////////////////////////////////

// force typescript to infer generic type arguments for SchemaSpec
function createSchemaSpec<N extends string = any, M extends string = any>(
  spec: SchemaSpecJson<N, M>
): SchemaSpecJson<N, M> {
  return spec;
}

// bare minimum ProseMirror schema for working with math nodes
export const mathSchemaSpec = createSchemaSpec({
  nodes: {
    doc: {
      content: "block+",
    },

    paragraph: {
      content: "inline*",
      group: "block",
      parseDOM: [{ tag: "p" }],
      toDOM: () => ["p", 0],
    },

    ordered_list: {
      content: "list_item+",
      group: "block",
      parseDOM: [{ tag: "ol" }],
      toDOM: () => ["ol", 0],
    },

    bullet_list: {
      content: "list_item+",
      group: "block",
      parseDOM: [{ tag: "ul" }],
      toDOM: () => ["ul", 0],
    },

    list_item: {
      content: "block+",
      defining: true,
      parseDOM: [{ tag: "li" }],
      toDOM: () => ["li", 0],
    },

    // blockquote: {
    //   content: "block+",
    //   group: "block",
    //   defining: true,
    //   parseDOM: [{ tag: "blockquote" }],
    //   toDOM: () => ["blockquote", 0],
    // },

    heading: {
      attrs: { level: { default: 1, validate: "number" } },
      content: "inline*",
      group: "block",
      defining: true,
      parseDOM: [
        { tag: "h1", attrs: { level: 1 } },
        { tag: "h2", attrs: { level: 2 } },
        { tag: "h3", attrs: { level: 3 } },
        { tag: "h4", attrs: { level: 4 } },
        { tag: "h5", attrs: { level: 5 } },
        { tag: "h6", attrs: { level: 6 } },
      ],
      toDOM(node) {
        return ["h" + node.attrs.level, 0];
      },
    },

    code_block: {
      content: "text*",
      marks: "",
      group: "block",
      code: true,
      defining: true,
      parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
      toDOM: () => ["pre", ["code", 0]],
    },

    text: {
      group: "inline",
    },

    // hard_break: {
    //   inline: true,
    //   group: "inline",
    //   selectable: false,
    //   parseDOM: [{ tag: "br" }],
    //   toDOM: () => ["br"],
    // },

    math_inline: {
      group: "inline math",
      content: "text*",
      inline: true,
      atom: true,
      toDOM: () => ["math-inline", { class: "math-node" }, 0],
      parseDOM: [{ tag: "math-inline" }, ...defaultInlineMathParseRules],
    },

    math_display: {
      group: "block math",
      content: "text*",
      atom: true,
      code: true,
      toDOM: () => ["math-display", { class: "math-node" }, 0],
      parseDOM: [{ tag: "math-display" }, ...defaultBlockMathParseRules],
    },

    ...tableNodes({
      tableGroup: "block",
      cellContent: "block+",
      cellAttributes: {
        background: {
          default: null,
          getFromDOM(dom) {
            return dom.style.backgroundColor || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs.style = (attrs.style || "") + `background-color: ${value};`;
          },
        },
      },
    }),
  },

  marks: {
    link: {
      attrs: {
        href: { validate: "string" },
        title: { default: null, validate: "string|null" },
      },
      inclusive: false,
      parseDOM: [
        {
          tag: "a[href]",
          getAttrs(dom: HTMLElement) {
            return {
              href: dom.getAttribute("href"),
              title: dom.getAttribute("title"),
            };
          },
        },
      ],
      toDOM(node) {
        const { href, title } = node.attrs;
        return ["a", { href, title }, 0];
      },
    },

    em: {
      parseDOM: [
        { tag: "i" },
        { tag: "em" },
        { style: "font-style=italic" },
        { style: "font-style=normal", clearMark: (m) => m.type.name == "em" },
      ],
      toDOM: () => ["em", 0],
    },

    strong: {
      parseDOM: [
        { tag: "strong" },
        // This works around a Google Docs misbehavior where
        // pasted content will be inexplicably wrapped in `<b>`
        // tags with a font-weight normal.
        {
          tag: "b",
          getAttrs: (node: HTMLElement) =>
            node.style.fontWeight != "normal" && null,
        },
        { style: "font-weight=400", clearMark: (m) => m.type.name == "strong" },
        {
          style: "font-weight",
          getAttrs: (value: string) =>
            /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
        },
      ],
      toDOM: () => ["strong", 0],
    },

    code: {
      code: true,
      parseDOM: [{ tag: "code" }],
      toDOM: () => ["code", 0],
    },

    math_select: {
      toDOM() {
        return ["math-select", 0];
      },
      parseDOM: [{ tag: "math-select" }],
    },
  },
});
