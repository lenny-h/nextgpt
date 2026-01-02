import { type MyUITools } from "@workspace/api-routes/types/custom-ui-tools";
import { cn } from "@workspace/ui/lib/utils";
import { type ToolUIPart } from "ai";
import { CheckCircle2, HelpCircle, Loader2, XCircle } from "lucide-react";
import { memo, useState } from "react";

type Choice = "A" | "B" | "C" | "D";

export const CreateMultipleChoiceUI = memo(
  ({
    part,
  }: {
    part: ToolUIPart<{
      createMultipleChoice: MyUITools["createMultipleChoice"];
    }>;
  }) => {
    const [selectedAnswer, setSelectedAnswer] = useState<Choice | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    if (part.state === "input-streaming") {
      return (
        <div className="bg-muted/30 flex items-center gap-3 rounded-md border p-3">
          <Loader2 className="text-primary animate-spin" size={18} />
          <span className="text-sm font-medium">
            Creating multiple choice question...
          </span>
        </div>
      );
    }

    if (part.state === "input-available" || part.state === "output-available") {
      const handleChoiceClick = (choice: Choice) => {
        if (selectedAnswer !== null) return; // Already answered

        setSelectedAnswer(choice);
        const correct = choice === part.input.correctAnswer;
        setIsCorrect(correct);
      };

      const getChoiceClasses = (choice: Choice) => {
        if (selectedAnswer === null) {
          return "bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors";
        }

        if (selectedAnswer === choice) {
          if (isCorrect) {
            return "bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600";
          } else {
            return "bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600";
          }
        }

        if (isCorrect === false && choice === part.input.correctAnswer) {
          return "bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600";
        }

        return "bg-muted/30 opacity-50";
      };

      const choices: Array<{ key: Choice; text: string }> = [
        { key: "A", text: part.input.choiceA },
        { key: "B", text: part.input.choiceB },
        { key: "C", text: part.input.choiceC },
        { key: "D", text: part.input.choiceD },
      ];

      return (
        <div className="border-border/50 w-full overflow-hidden rounded-md border">
          <div className="bg-muted/50 flex items-center gap-2 p-3">
            <HelpCircle size={16} className="text-primary" />
            <span className="text-sm font-medium">
              Multiple Choice Question
            </span>
          </div>
          <div className="p-4">
            <div className="mb-4 text-sm font-medium">
              {part.input.question}
            </div>
            <div className="space-y-2">
              {choices.map(({ key, text }) => (
                <button
                  key={key}
                  onClick={() => handleChoiceClick(key)}
                  disabled={selectedAnswer !== null}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md border p-3 text-left text-sm",
                    getChoiceClasses(key),
                  )}
                >
                  <span className="font-medium">{key}.</span>
                  <span className="flex-1">{text}</span>
                  {selectedAnswer === key && isCorrect && (
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-green-600 dark:text-green-400"
                    />
                  )}
                  {selectedAnswer === key && !isCorrect && (
                    <XCircle
                      size={18}
                      className="shrink-0 text-red-600 dark:text-red-400"
                    />
                  )}
                  {selectedAnswer !== null &&
                    selectedAnswer !== key &&
                    key === part.input.correctAnswer &&
                    !isCorrect && (
                      <CheckCircle2
                        size={18}
                        className="shrink-0 text-green-600 dark:text-green-400"
                      />
                    )}
                </button>
              ))}
            </div>
            {isCorrect === true && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-green-100 p-2.5 text-sm dark:bg-green-900/20">
                <CheckCircle2
                  size={16}
                  className="text-green-600 dark:text-green-400"
                />
                <span className="text-green-700 dark:text-green-300">
                  Correct! Well done.
                </span>
              </div>
            )}
            {isCorrect === false && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-red-100 p-2.5 text-sm dark:bg-red-900/20">
                <XCircle size={16} className="text-red-600 dark:text-red-400" />
                <span className="text-red-700 dark:text-red-300">
                  Incorrect. The correct answer is {part.input.correctAnswer}.
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  },
);

CreateMultipleChoiceUI.displayName = "CreateMultipleChoiceUI";
