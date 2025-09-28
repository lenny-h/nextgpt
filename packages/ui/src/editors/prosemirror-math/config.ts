/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/

import { insertMathCmd } from "@workspace/ui/editors/prosemirror-math/commands/insert-math-cmd";
import { mathPlugin } from "@workspace/ui/editors/prosemirror-math/math-plugin";
import { mathSchemaSpec } from "@workspace/ui/editors/prosemirror-math/math-schema";
import { mathBackspaceCmd } from "@workspace/ui/editors/prosemirror-math/plugins/math-backspace";
import {
  makeBlockMathInputRule,
  makeInlineMathInputRule,
  REGEX_BLOCK_MATH_DOLLARS,
  REGEX_INLINE_MATH_DOLLARS,
} from "@workspace/ui/editors/prosemirror-math/plugins/math-inputrules";
import {
  chainCommands,
  createParagraphNear,
  deleteSelection,
  joinBackward,
  joinForward,
  liftEmptyBlock,
  newlineInCode,
  selectNodeBackward,
  selectNodeForward,
  splitBlock,
} from "prosemirror-commands";
import { inputRules } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { Plugin as ProsePlugin } from "prosemirror-state";

export const textEditorSchema = new Schema(mathSchemaSpec);

export const inlineMathInputRule = makeInlineMathInputRule(
  REGEX_INLINE_MATH_DOLLARS,
  textEditorSchema.nodes.math_inline
);

export const blockMathInputRule = makeBlockMathInputRule(
  REGEX_BLOCK_MATH_DOLLARS,
  textEditorSchema.nodes.math_display
);

export const plugins: ProsePlugin[] = [
  mathPlugin,
  keymap({
    "Mod-Space": insertMathCmd(textEditorSchema.nodes.math_inline),
    Backspace: chainCommands(
      deleteSelection,
      mathBackspaceCmd,
      joinBackward,
      selectNodeBackward
    ),
    // below is the default keymap
    Enter: chainCommands(
      newlineInCode,
      createParagraphNear,
      liftEmptyBlock,
      splitBlock
    ),
    "Ctrl-Enter": chainCommands(newlineInCode, createParagraphNear, splitBlock),
    Delete: chainCommands(deleteSelection, joinForward, selectNodeForward),
  }),
  inputRules({ rules: [inlineMathInputRule, blockMathInputRule] }),
];
