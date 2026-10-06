import type { ModuleDeclaration, Node as EstreeNode, Statement } from "estree";
import { EXIT, visit as visitEstree } from "estree-util-visit";

import { COMPONENT_NAME, NODE_ONLY_GLOBALS } from "../constants/builtins";
import type {
  ForbiddenSyntax,
  IdentifierReference,
  SourceRange,
} from "../types/estree";

/** Offsets acorn adds to every node; the estree types leave them out. */
export function nodeRange(node: EstreeNode): SourceRange {
  const ranged = node as EstreeNode & Partial<SourceRange>;
  return { start: ranged.start ?? 0, end: ranged.end ?? 0 };
}

/** Names bound by a declaration pattern (`const { a, b: [c] } = …` → a, c). */
function patternNames(pattern: EstreeNode | null | undefined): string[] {
  if (!pattern) {
    return [];
  }
  switch (pattern.type) {
    case "Identifier":
      return [pattern.name];
    case "ObjectPattern":
      return pattern.properties.flatMap((property) =>
        property.type === "RestElement"
          ? patternNames(property.argument)
          : patternNames(property.value)
      );
    case "ArrayPattern":
      return pattern.elements.flatMap((element) => patternNames(element));
    case "RestElement":
      return patternNames(pattern.argument);
    case "AssignmentPattern":
      return patternNames(pattern.left);
    default:
      return [];
  }
}

/** `export const a = …` / `export function b` / `export class C` → their names. */
export function exportedDeclarationNames(
  statement: Statement | ModuleDeclaration
): string[] {
  if (statement.type !== "ExportNamedDeclaration" || !statement.declaration) {
    return [];
  }
  const { declaration } = statement;
  if (declaration.type === "VariableDeclaration") {
    return declaration.declarations.flatMap((declarator) =>
      declarator.id.type === "Identifier" ? [declarator.id.name] : []
    );
  }
  if (
    declaration.type === "FunctionDeclaration" ||
    declaration.type === "ClassDeclaration"
  ) {
    return declaration.id ? [declaration.id.name] : [];
  }
  return [];
}

/** Every name a node declares locally (params, variables, functions, classes, catch bindings). */
export function declaredNames(root: EstreeNode): Set<string> {
  const names = new Set<string>();
  visitEstree(root, (node) => {
    const current = node as EstreeNode;
    switch (current.type) {
      case "VariableDeclarator":
        for (const name of patternNames(current.id)) {
          names.add(name);
        }
        break;
      case "FunctionDeclaration":
      case "FunctionExpression":
      case "ArrowFunctionExpression":
        if ("id" in current && current.id) {
          names.add(current.id.name);
        }
        for (const param of current.params) {
          for (const name of patternNames(param)) {
            names.add(name);
          }
        }
        break;
      case "ClassDeclaration":
        if (current.id) {
          names.add(current.id.name);
        }
        break;
      case "CatchClause":
        for (const name of patternNames(current.param)) {
          names.add(name);
        }
        break;
      default:
        break;
    }
  });
  return names;
}

/**
 * Identifiers used as values (not property keys, member names or JSX attribute
 * names). Over-approximates scope on purpose: callers only use it to decide
 * whether something might reference an outer binding.
 */
export function referencedIdentifiers(root: EstreeNode): IdentifierReference[] {
  const references: IdentifierReference[] = [];
  visitEstree(root, (node, key, _index, ancestors) => {
    const current = node as EstreeNode & Partial<SourceRange>;
    const parent = ancestors.at(-1) as EstreeNode | undefined;
    if (current.type === "Identifier") {
      if (
        parent?.type === "MemberExpression" &&
        key === "property" &&
        !parent.computed
      ) {
        return;
      }
      if (parent?.type === "Property" && key === "key" && !parent.computed) {
        return;
      }
      references.push({
        name: current.name,
        start: current.start ?? -1,
        end: current.end ?? -1,
      });
      return;
    }
    // JSX element names reference components too (`<Counter />`); estree has no JSX types.
    const jsx = node as { type: string; name?: string } & Partial<SourceRange>;
    if (
      jsx.type === "JSXIdentifier" &&
      key === "name" &&
      jsx.name &&
      COMPONENT_NAME.test(jsx.name)
    ) {
      references.push({
        name: jsx.name,
        start: jsx.start ?? -1,
        end: jsx.end ?? -1,
      });
    }
  });
  return references;
}

export function containsJsxOrFunction(root: EstreeNode): boolean {
  let found = false;
  visitEstree(root, (node) => {
    const { type } = node as { type: string };
    if (
      type === "JSXElement" ||
      type === "JSXFragment" ||
      type === "ArrowFunctionExpression" ||
      type === "FunctionExpression" ||
      type === "FunctionDeclaration"
    ) {
      found = true;
      return EXIT;
    }
    return undefined;
  });
  return found;
}

/** Dynamic imports, `require`, `eval` and `new Function` are never allowed in site code. */
function findForbiddenSyntax(root: EstreeNode): ForbiddenSyntax[] {
  const found: ForbiddenSyntax[] = [];
  visitEstree(root, (node) => {
    const current = node as EstreeNode;
    const { start } = nodeRange(current);
    if (current.type === "ImportExpression") {
      found.push({ message: "Dynamic import() is not supported", start });
    }
    if (
      current.type === "CallExpression" &&
      current.callee.type === "Identifier" &&
      (current.callee.name === "require" || current.callee.name === "eval")
    ) {
      found.push({
        message: `${current.callee.name}() is not supported`,
        start,
      });
    }
    if (
      current.type === "NewExpression" &&
      current.callee.type === "Identifier" &&
      current.callee.name === "Function"
    ) {
      found.push({ message: "new Function() is not supported", start });
    }
    if (current.type === "MetaProperty") {
      found.push({
        message: "import.meta is not available in site code",
        start,
      });
    }
  });
  return found;
}

/**
 * Site components run in the browser (and once at build time in the sandbox).
 * Node-only globals are part of neither contract, so using them is an error
 * even though the sandbox would contain it anyway.
 */
function findNodeApiUsage(
  root: EstreeNode,
  declared: ReadonlySet<string>
): ForbiddenSyntax[] {
  return referencedIdentifiers(root)
    .filter(
      (reference) =>
        NODE_ONLY_GLOBALS.has(reference.name) && !declared.has(reference.name)
    )
    .map((reference) => ({
      message: `${reference.name} is a Node.js API and is not available in site components`,
      start: reference.start,
    }));
}

/** Forbidden syntax, then Node.js globals that `declared` doesn't shadow. */
export function forbiddenUsage(
  root: EstreeNode,
  declared: ReadonlySet<string> = new Set()
): ForbiddenSyntax[] {
  return [...findForbiddenSyntax(root), ...findNodeApiUsage(root, declared)];
}
