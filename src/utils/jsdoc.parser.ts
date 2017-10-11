import * as ts from 'typescript';

export function isVariableLike(node: ts.Node): node is any {
   if (node) {
       switch (node.kind) {
           case ts.SyntaxKind.BindingElement:
           case ts.SyntaxKind.EnumMember:
           case ts.SyntaxKind.Parameter:
           case ts.SyntaxKind.PropertyAssignment:
           case ts.SyntaxKind.PropertyDeclaration:
           case ts.SyntaxKind.PropertySignature:
           case ts.SyntaxKind.ShorthandPropertyAssignment:
           case ts.SyntaxKind.VariableDeclaration:
               return true;
       }
   }
   return false;
}

export function some<T>(array: T[], predicate?: (value: T) => boolean): boolean {
    if (array) {
        if (predicate) {
            for (const v of array) {
                if (predicate(v)) {
                    return true;
                }
            }
        } else {
            return array.length > 0;
        }
    }
    return false;
}

export function concatenate<T>(array1: T[], array2: T[]): T[] {
    if (!some(array2)) {return array1;}
    if (!some(array1)) {return array2;}
    return [...array1, ...array2];
}

export function isParameter(node: ts.Node): node is ts.ParameterDeclaration {
    return node.kind === ts.SyntaxKind.Parameter;
}

function getJSDocTags(node: ts.Node, kind: ts.SyntaxKind): ts.JSDocTag[] {
    const docs = getJSDocs(node);
    if (docs) {
        const result: ts.JSDocTag[] = [];
        for (const doc of docs) {
            if (doc.kind === ts.SyntaxKind.JSDocParameterTag) {
                if (doc.kind === kind) {
                    result.push(doc as ts.JSDocTag);
                }
            } else {
                result.push(...filter((doc as any).tags, (tag: any) => tag.kind === kind));
            }
        }
        return result;
    }
}

/**
 * Filters an array by a predicate function. Returns the same array instance if the predicate is
 * true for all elements, otherwise returns a new array instance containing the filtered subset.
 */
export function filter<T>(array: T[], f: (x: T) => boolean): T[] {
    if (array) {
        const len = array.length;
        let i = 0;
        while (i < len && f(array[i])) {
            i++;
        }
        if (i < len) {
            const result = array.slice(0, i);
            i++;
            while (i < len) {
                const item = array[i];
                if (f(item)) {
                    result.push(item);
                }
                i++;
            }
            return result;
        }
    }
    return array;
}
function getJSDocsWorker(node: any): any {
    const parent = node.parent;
    // Try to recognize this pattern when node is initializer of
    // variable declaration and JSDoc comments are on containing variable statement.
    // /**
    //   * @param {number} name
    //   * @returns {number}
    //   */
    // var x = function(name) { return name.length; }
    const isInitializerOfVariableDeclarationInStatement =
        isVariableLike(parent) &&
        parent.initializer === node &&
        parent.parent.parent.kind === ts.SyntaxKind.VariableStatement;
    const isVariableOfVariableDeclarationStatement = isVariableLike(node) &&
        parent.parent.kind === ts.SyntaxKind.VariableStatement;
    const variableStatementNode =
        isInitializerOfVariableDeclarationInStatement ? parent.parent.parent :
        isVariableOfVariableDeclarationStatement ? parent.parent :
        undefined;
    let cache;
    if (variableStatementNode) {
        cache = getJSDocsWorker(variableStatementNode);
    }

    // Also recognize when the node is the RHS of an assignment expression
    const isSourceOfAssignmentExpressionStatement =
        parent && parent.parent &&
        parent.kind === ts.SyntaxKind.BinaryExpression &&
        (parent as ts.BinaryExpression).operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        parent.parent.kind === ts.SyntaxKind.ExpressionStatement;
    if (isSourceOfAssignmentExpressionStatement) {
        cache = getJSDocsWorker(parent.parent);
    }

    const isModuleDeclaration = node.kind === ts.SyntaxKind.ModuleDeclaration &&
        parent && parent.kind === ts.SyntaxKind.ModuleDeclaration;
    const isPropertyAssignmentExpression = parent && parent.kind === ts.SyntaxKind.PropertyAssignment;
    if (isModuleDeclaration || isPropertyAssignmentExpression) {
        cache = getJSDocsWorker(parent);
    }

    // Pull parameter comments from declaring function as well
    if (node.kind === ts.SyntaxKind.Parameter) {
        return concatenate(cache, getJSDocParameterTags(node));
    }

    if (isVariableLike(node) && node.initializer) {
        return concatenate(cache, node.initializer.jsDoc);
    }

    return concatenate(cache, node.jsDoc);
}

function getJSDocs(node: any): (ts.JSDoc | ts.JSDocTag)[] {
    // console.log('getJSDocs: ', node);
    let cache: (ts.JSDoc | ts.JSDocTag)[] = node.jsDocCache;
    if (!cache) {
        cache = getJSDocsWorker(node);
        node.jsDocCache = cache;
    }

    return cache;
}

export function getJSDocParameterTags(param: ts.Node): ts.JSDocParameterTag[] {
    if (!isParameter(param)) {
        return undefined;
    }
    const func = param.parent as ts.FunctionLikeDeclaration;
    const tags = getJSDocTags(func, ts.SyntaxKind.JSDocParameterTag) as ts.JSDocParameterTag[];
    if (!param.name) {
        // this is an anonymous jsdoc param from a `function(type1, type2): type3` specification
        const i = func.parameters.indexOf(param);
        const paramTags = filter(tags, tag => tag.kind === ts.SyntaxKind.JSDocParameterTag);
        if (paramTags && 0 <= i && i < paramTags.length) {
            return [paramTags[i]];
        }
    } else if (param.name.kind === ts.SyntaxKind.Identifier) {
        const name = (param.name as ts.Identifier).text;
        return filter(tags, (tag: any) => tag.kind === ts.SyntaxKind.JSDocParameterTag && tag.parameterName.text === name);
    } else {
        // TODO: it's a destructured parameter, so it should look up an "object type" series of multiple lines
        // But multi-line object types aren't supported yet either
        return undefined;
    }
}

export let JSDocTagsParser = (function() {

    return {
        getJSDocs: getJSDocs
    };
})();
