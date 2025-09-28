import { type DocumentSource } from "@/types/document-source";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import React, { memo, useMemo } from "react"; // remove Children import
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { SourceBadge } from "./source-badge";

import "katex/dist/katex.min.css";

const CodeBlock = dynamic(
  () => import("./code-block").then((mod) => mod.CodeBlock),
  {
    loading: () => (
      <div className="flex w-full items-center justify-center rounded-lg border bg-slate-800 p-4">
        <Loader2 className="text-primary h-6 w-6 animate-spin" />
        <span className="ml-2 text-sm text-slate-50">
          Loading code block...
        </span>
      </div>
    ),
  },
);

// Helper function to preserve line breaks in text
const preserveLineBreaks = (text: string, keyPrefix: string) => {
  if (typeof text !== "string") return text;
  return text
    .split("\n")
    .map((line, i, array) =>
      i === array.length - 1
        ? line
        : [
            line,
            <React.Fragment key={`${keyPrefix}-br-${i}`}>
              <br />
              <br />
            </React.Fragment>,
          ],
    )
    .flat();
};

// Process children to preserve line breaks
const processChildrenWithLineBreaks = (children: React.ReactNode) => {
  return React.Children.map(children, (child, index) => {
    if (typeof child === "string") {
      return preserveLineBreaks(child, `child-${index}`);
    }
    return child;
  });
};

// New: rehype plugin to convert £1,2£ into <source-ref indices="1,2" />
const rehypeSourceRefs = () => {
  return (tree: any) => {
    const regex = /£(\d+(?:,\s?\d+)*)£/g;

    const transform = (parent: any) => {
      if (!parent || !Array.isArray(parent.children)) return;

      for (let i = 0; i < parent.children.length; i++) {
        const node = parent.children[i];

        if (node?.type === "text" && typeof node.value === "string") {
          const value: string = node.value;
          regex.lastIndex = 0;

          let match: RegExpExecArray | null;
          let lastIndex = 0;
          const newNodes: any[] = [];

          // Find and split around matches
          while ((match = regex.exec(value)) !== null) {
            if (match.index > lastIndex) {
              newNodes.push({
                type: "text",
                value: value.slice(lastIndex, match.index),
              });
            }

            newNodes.push({
              type: "element",
              tagName: "source-ref",
              properties: { indices: match[1] }, // e.g., "1,2"
              children: [],
            });

            lastIndex = match.index + match[0].length;
          }

          if (newNodes.length > 0) {
            if (lastIndex < value.length) {
              newNodes.push({
                type: "text",
                value: value.slice(lastIndex),
              });
            }

            // Replace this text node with the new nodes
            parent.children.splice(i, 1, ...newNodes);
            i += newNodes.length - 1;
            continue;
          }
        }

        // Recurse
        if (node && node.children) transform(node);
      }
    };

    transform(tree);
  };
};

// New: allow custom "source-ref" tag in Components typing
type ComponentsWithSourceRef = Components & {
  "source-ref"?: (props: any) => React.ReactNode;
};

const getComponents = ({
  sources,
}: {
  sources?: DocumentSource[];
  // parseSourceRefs?: boolean; // not needed here
}): Partial<ComponentsWithSourceRef> => ({
  // Render our custom element produced by rehypeSourceRefs
  "source-ref": ({ node }: any) => {
    const indicesProp = node?.properties?.indices ?? "";
    const indices = String(indicesProp)
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter(
        (n) =>
          Number.isFinite(n) && n >= 0 && sources && n < (sources?.length ?? 0),
      );

    if (!sources || indices.length === 0) {
      // Fallback: render original text if indices invalid
      return <>£{indicesProp}£</>;
    }

    return (
      <span className="inline-flex flex-wrap gap-1">
        {indices
          .map((sourceIndex) => sources[sourceIndex])
          .filter((source): source is DocumentSource => !!source)
          .map((source, i) => (
            <SourceBadge key={`source-${source.id}-${i}`} source={source} />
          ))}
      </span>
    );
  },

  p: ({ children, ...props }) => {
    const childrenWithLineBreaks = processChildrenWithLineBreaks(children);
    return <p {...props}>{childrenWithLineBreaks}</p>;
  },

  li: ({ children, ...props }) => {
    return (
      <li className="py-2" {...props}>
        {children}
      </li>
    );
  },

  // @ts-expect-error
  code: ({ node, inline, className, children, style, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");

    if (!inline && match) {
      const language = match[1];
      return (
        <CodeBlock language={language || ""} {...props}>
          {String(children)}
        </CodeBlock>
      );
    }

    return (
      <code className="bg-muted rounded-md p-1" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  ol: ({ children, ...props }) => {
    return (
      <ol className="ml-4 list-outside list-decimal" {...props}>
        {children}
      </ol>
    );
  },
  ul: ({ children, ...props }) => {
    return (
      <ul className="ml-4 list-outside list-disc" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    );
  },
  a: ({ children, ...props }) => {
    return (
      // @ts-expect-error
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ children, ...props }) => (
    <h1 className="mb-2 mt-5 text-3xl font-semibold" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mb-2 mt-5 text-2xl font-semibold" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mb-2 mt-5 text-xl font-semibold" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="mb-2 mt-5 text-lg font-semibold" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 className="mb-2 mt-5 text-base font-semibold" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 className="mb-2 mt-5 text-sm font-semibold" {...props}>
      {children}
    </h6>
  ),
  table: ({ children, ...props }) => {
    return (
      <div className="w-full overflow-x-scroll">
        <table className="my-4 divide-y overflow-hidden rounded-xl" {...props}>
          {children}
        </table>
      </div>
    );
  },
  thead: ({ children, ...props }) => {
    return (
      <thead className="bg-muted" {...props}>
        {children}
      </thead>
    );
  },
  tbody: ({ children, ...props }) => {
    return (
      <tbody className="divide-y" {...props}>
        {children}
      </tbody>
    );
  },
  tr: ({ children, ...props }) => {
    return (
      <tr className="hover:bg-muted/60" {...props}>
        {children}
      </tr>
    );
  },
  th: ({ children, ...props }) => {
    return (
      <th
        className="text-muted-foreground px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
        {...props}
      >
        {children}
      </th>
    );
  },
  td: ({ children, ...props }) => {
    return (
      <td
        className="text-muted-foreground whitespace-nowrap px-6 py-4 text-sm"
        {...props}
      >
        {children}
      </td>
    );
  },
});

interface MarkdownProps {
  children: string;
  sources?: DocumentSource[];
  parseSourceRefs?: boolean;
}

export const Markdown = memo(
  ({ children, sources = [], parseSourceRefs = false }: MarkdownProps) => {
    // Memoize components and rehype plugins
    const components = useMemo(() => getComponents({ sources }), [sources]);

    const rehypePlugins = useMemo(() => {
      const plugins: any[] = [];
      // Insert our source-ref transformer before other rehype transforms
      if (parseSourceRefs) {
        plugins.push(rehypeSourceRefs);
      }
      plugins.push(rehypeKatex);
      return plugins;
    }, [parseSourceRefs]);

    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {children}
      </ReactMarkdown>
    );
  },
);
