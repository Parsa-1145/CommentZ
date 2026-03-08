import { CommentFormat } from "./common";
import * as vscode from 'vscode';
import { splitText } from "./utils";

type LanguageStyle = 'c' | 'python';
type LangConfig = {
    operator: string;
    style: LanguageStyle;
}
const LANGUAGE_CONFIG: Record<string, LangConfig> = {
    "cpp": {
        operator: "//",
        style: "c"
    },
    "c": {
        operator: "//",
        style: "c"
    },
    "javascript": {
        operator: "//",
        style: "c"
    },
    "typescript": {
        operator: "//",
        style: "c"
    },
    "python": {
        operator: "#",
        style: "python"
    }
};

const borderedFormat: CommentFormat = {
    name: "Borderd",
    details: "box with single-line borders",
    arguments: {
        "s": {
            name: "Size",
            isInteger: true,
            optional: true
        }
    },

    getCommentString(content, language, args: Record<string, any>) {
        let out = "";

        const commentOperator = LANGUAGE_CONFIG[language].operator;

        const config = vscode.workspace.getConfiguration();
        const defaultSize = Number(config.get("commentZ.styles.bordered.defaultSize"));
        const minPadding = Number(config.get("commentZ.styles.bordered.minPadding"));
        const leftMargin = Number(config.get("commentZ.styles.bordered.leftMargin"));

        const edgeSize = 2;
        let size = Number(args["s"] ? args["s"] : defaultSize);
        size = Number.isInteger(size) ? size : defaultSize;
        size = size - leftMargin - commentOperator.length;

        const maxTextWidth = size - edgeSize - (2 * minPadding);
        const textLines = splitText(content, maxTextWidth);

        out += commentOperator + " ".repeat(leftMargin) + "+" + "-".repeat(size - edgeSize) + "+\n";
        textLines.forEach(line => {
            let padding = Math.ceil((size - edgeSize - line.length) / 2);
            out += commentOperator + " ".repeat(leftMargin) + "|" + " ".repeat(padding) + line + " ".repeat(size - padding - edgeSize - line.length) + "|\n";
        });
        out += commentOperator + " ".repeat(leftMargin) + "+" + "-".repeat(size - edgeSize) + "+\n";

        return out;
    },
};

const boxedFormat: CommentFormat = {
    name: "Boxed",
    details: "box with heavy borders",
    arguments: {
        "s": {
            name: "Size",
            isInteger: true,
            optional: true
        }
    },
    getCommentString(content, language, args: Record<string, any>) {
        let out = "";

        const commentOperator = LANGUAGE_CONFIG[language].operator;
        const secOperator = LANGUAGE_CONFIG[language].style === 'c' ? "/" : "#";

        const edgeSize = 2 * commentOperator.length;

        const config = vscode.workspace.getConfiguration();
        const defaultSize = Number(config.get("commentZ.styles.boxed.defaultSize"));
        const minPadding = Number(config.get("commentZ.styles.boxed.minPadding"));

        let size = Number(args["s"] ? args["s"] : defaultSize);
        size = Number.isInteger(size) ? size : defaultSize;
        const maxTextWidth = size - edgeSize - (2 * minPadding);
        const textLines = splitText(content, maxTextWidth);

        out += commentOperator + secOperator.repeat(size - edgeSize) + commentOperator + "\n";
        for (const line of textLines) {
            let padding = Math.ceil((size - edgeSize - 8 - line.length) / 2);
            out += commentOperator + secOperator.repeat(4) + " ".repeat(padding) + line + " ".repeat(size - padding - 8 - edgeSize - line.length) + commentOperator + secOperator.repeat(4) + "\n";
        }
        out += commentOperator + secOperator.repeat(size - edgeSize) + commentOperator + "\n";
        
        return out;
    },
};

const headerFormat: CommentFormat = {
    name: "Header",
    details: "horizontal seperator",
    arguments: {
        "s": {
            name: "Size",
            isInteger: true,
            optional: true
        }
    },
    getCommentString(content, language, args: Record<string, any>) {
        let out = "";
        
        const commentOperator = LANGUAGE_CONFIG[language].operator;
        
        const edgeSize = 2 * commentOperator.length;

        const config = vscode.workspace.getConfiguration();
        const defaultSize = Number(config.get("commentZ.styles.line.defaultSize"));
        const minPadding = Number(config.get("commentZ.styles.line.minPadding"));

        let size = Number(args["s"] ? args["s"] : defaultSize);
        size = Number.isInteger(size) ? size : defaultSize;
        size = Math.max(size, content.length + edgeSize + 2 * minPadding);
        const padding = Math.max(minPadding, Math.ceil((size - edgeSize - content.length) / 2));

        out += commentOperator + " " + "-".repeat(padding - 2) + " " + content + " " + "-".repeat(size - padding - edgeSize - content.length - 2) + " " + commentOperator + "\n";

        return out;
    },
};

export { boxedFormat, borderedFormat, headerFormat };