import * as m from "motion/react-m";

import { useGlobalTranslations } from "@/contexts/global-translations";
import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { AnimatePresence, LazyMotion } from "motion/react";
import { memo } from "react";

const loadFeatures = () => import("@/lib/features").then((res) => res.default);

export const Introduction = memo(() => {
  const { globalT } = useGlobalTranslations();
  const [isTemporary] = useIsTemporary();

  return (
    <div className="flex-1 overflow-y-scroll px-6 pb-3 pt-8 md:pt-20">
      <div className="mx-auto max-w-2xl">
        <LazyMotion features={loadFeatures}>
          <AnimatePresence mode="wait">
            {isTemporary ? (
              <m.div
                key="temporary"
                className="flex flex-col space-y-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <h1 className="text-3xl font-semibold">
                  {globalT.components.introduction.temporaryChatActivated}
                </h1>
                <p className="text-xl font-medium">
                  {globalT.components.introduction.messagesNotSaved}
                </p>
              </m.div>
            ) : (
              <m.div
                key="welcome"
                className="flex flex-col space-y-4 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h1 className="text-3xl font-semibold">
                  {globalT.components.introduction.welcomeToNextGPT}
                </h1>
                <p className="text-xl font-medium">
                  {globalT.components.introduction.selectCourseResources}
                </p>
              </m.div>
            )}
          </AnimatePresence>
        </LazyMotion>
      </div>
    </div>
  );
});
