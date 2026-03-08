import * as vscode from 'vscode';
import { CommentFormat, CommentArgument } from './common';
import { boxedFormat, borderedFormat, headerFormat } from './formats';

const CommentFormats: Record<string, CommentFormat> = {
	bordered: borderedFormat,
	boxed: boxedFormat,
	header: headerFormat
};

const normalizedFormatKeys = Object.keys(CommentFormats).map(key => key.toLowerCase());

class CommentProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {

		const lineText = document.lineAt(position).text.substring(0, position.character).trim();
		const lineTokensNormalized = lineText.toLowerCase().split(".");
		const lineTokens = lineText.split(".");

		if (!lineText.startsWith(".")) {
			return [];
		}

		if ((lineTokens.length === 2)) {
			const item = new vscode.CompletionItem("cz", vscode.CompletionItemKind.Module);
			item.detail = "start styled comment";
			item.sortText = "0" + item.label;
			return [item];
		}
		if ((lineTokens.length === 3) && (lineTokensNormalized[1] === "cz")) {
			const items: vscode.CompletionItem[] = [];
			for (const [key, format] of Object.entries(CommentFormats)) {
				const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Module);
				item.insertText = new vscode.SnippetString(key);
				item.detail = format.details;
				item.sortText = "0" + item.label;
				items.push(item);
			}
			return items;
		}

		if ((lineTokens.length > 3) && (lineTokensNormalized[1] === "cz") && (normalizedFormatKeys.includes(lineTokensNormalized[2]))) {
			const items: vscode.CompletionItem[] = [];

			const commentFormat = CommentFormats[lineTokensNormalized[2]]; // FUCK ME

			const commandTokens = lineTokensNormalized.slice(3);
			const args: Record<string, any> = {};
			const lastToken = lineTokens[lineTokens.length - 1];

			for (let i = 0; i < commandTokens.length; i += 2) {
				args[commandTokens[i]] = commandTokens[i + 1];
			}

			let argsLeft: Record<string, CommentArgument> = {};
			let canEnterComment = true;

			for (const [key, arg] of Object.entries(commentFormat.arguments)) {
				if (args[key] === undefined) {
					argsLeft[key] = arg;
				}
			}
			canEnterComment = !Object.values(argsLeft).some(arg => !arg.optional);

			if (commandTokens.length % 2) {
				if (canEnterComment) {
					if (lastToken === "") {
						const item = new vscode.CompletionItem("Enter a long ass comment", vscode.CompletionItemKind.Text);
						item.detail = "Enter the comment";
						item.keepWhitespace = true;
						items.push(item);
					} else {
						const tmp = lastToken.split(" ");
						const item = new vscode.CompletionItem(lastToken, vscode.CompletionItemKind.Event);
						item.detail = "Make comment";
						item.command = {
							command: "commentZ.convertToComment",
							title: "Convert to comment",
							arguments: [lastToken, lineTokensNormalized[2], args]
						};
						items.push(item);
					}
				}
				for (const [key, arg] of Object.entries(argsLeft)) {
					const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Property);
					item.detail = arg.name;
					items.push(item);
				}
			} else {
				const lastArg = commentFormat.arguments[commandTokens[commandTokens.length - 2]];

				if (lastArg !== undefined) {
					if (lastToken === "") {
						if (lastArg.isInteger) {
							const item = new vscode.CompletionItem("60", vscode.CompletionItemKind.Property);
							item.detail = `Enter an integer as ${lastArg.name}`;
							items.push(item);
						} else {
							const item = new vscode.CompletionItem(lastArg.name, vscode.CompletionItemKind.Property);
							item.detail = `Enter ${lastArg.name}`;
							items.push(item);
						}
					} else {
						const item = new vscode.CompletionItem(lastToken, vscode.CompletionItemKind.Property);
						item.detail = `Set ${lastArg.name} to ${lastToken}`;
						items.push(item);
					}
				}
			}

			items.forEach(items => items.sortText = "0_" + items.label);
			return items;
		}

		return [];
	}
	resolveCompletionItem(item: vscode.CompletionItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CompletionItem> {
		return item;
	}
}

function convertToCommand(content: string, type: string, args: Record<string, any>) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}

	const line = editor.document.lineAt(editor.selection.active.line);
	const range = new vscode.Range(line.range.start, line.range.end);

	let comment = CommentFormats[type].getCommentString(content, editor.document.languageId, args);

	editor.edit(editBuilder => {
		editBuilder.delete(range);
		editBuilder.insert(line.range.start, comment);
	});
}
const getSelectedContent = (): string => {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return "";
	}
	const selection = editor.selection;
	return editor.document.getText(selection);
};

export function activate(context: vscode.ExtensionContext) {
	const suggestProvider = vscode.languages.registerCompletionItemProvider(
		['python', 'cpp', 'c', 'javascript', 'typescript'],
		new CommentProvider(),
		"."
	);
	context.subscriptions.push(suggestProvider);

	const command = vscode.commands.registerCommand("commentZ.convertToComment", convertToCommand);
	context.subscriptions.push(command);

	const borderedCommand = vscode.commands.registerCommand("commentZ.convertToBordered", () => {
		const content = getSelectedContent();
		if (content) {
			convertToCommand(content, "bordered", {});
		}
	});

	const boxedCommand = vscode.commands.registerCommand("commentZ.convertToBoxed", () => {
		const content = getSelectedContent();
		if (content) {
			convertToCommand(content, "boxed", {});
		}
	});

	const headerCommand = vscode.commands.registerCommand("commentZ.convertToHeader", () => {
		const content = getSelectedContent();
		if (content) {
			convertToCommand(content, "header", {});
		}
	});

	context.subscriptions.push(borderedCommand, boxedCommand, headerCommand);
}

export function deactivate() { };