// Copyright 2024 Vercel, Inc.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Modifications copyright (C) 2025 <NextGpt.ai Technologies>

"use client";

import { cn } from "@workspace/ui/lib/utils";
import { ChevronDownIcon, Loader } from "lucide-react";
import { LazyMotion } from "motion/react";
import * as m from "motion/react-m";
import { useState } from "react";
import { Markdown } from "./markdown";

const loadFeatures = () => import("@/lib/features").then((res) => res.default);

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
}

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: "auto",
      opacity: 1,
      marginTop: "1rem",
      marginBottom: "0.5rem",
    },
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-center gap-2">
        {isLoading ? (
          <>
            <div className="font-medium">Reasoning</div>
            <div className="animate-spin">
              <Loader className="size-4" />
            </div>
          </>
        ) : (
          <div className="font-medium">Reasoned for a few seconds</div>
        )}
        <div
          className="cursor-pointer"
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
        >
          <ChevronDownIcon
            className={cn(
              "size-4 transition-transform duration-200 ease-in-out",
              isExpanded && "rotate-180",
            )}
          />
        </div>
      </div>

      <LazyMotion features={loadFeatures}>
        {isExpanded && (
          <m.div
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
            className="text-muted-foreground border-l pl-4"
          >
            <Markdown parseSourceRefs={false}>{reasoning}</Markdown>
          </m.div>
        )}
      </LazyMotion>
    </div>
  );
}
