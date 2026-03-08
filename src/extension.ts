import * as vscode from 'vscode';
import { CommentFormat, CommentArgument } from './common';
import { boxedFormat, borderedFormat, headerFormat } from './formats';

const CommentFormats: Record<string, CommentFormat> = {
	BORDERED: borderedFormat,
	BOXED: boxedFormat,
	HEADER: headerFormat
};

const commandRegex = new RegExp(`\\.COMMENT\\.(${Object.keys(CommentFormats).join('|')})\\.(.*)`);

class CommentProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {

		const items: vscode.CompletionItem[] = [];
		const lineText = document.lineAt(position).text.substring(0, position.character).trim();

		if (lineText === ".") {
			const item = new vscode.CompletionItem("COMMENT", vscode.CompletionItemKind.Module);
			item.detail = "start styled comment";
			items.push(item);
		}
		if (lineText === ".COMMENT.") {
			for (const [key, format] of Object.entries(CommentFormats)) {
				const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Module);
				item.insertText = new vscode.SnippetString(key);
				item.documentation = "asdasdasdasda asd asd ";
				item.detail = format.details;
				items.push(item);
			}
		}


		const match = lineText.match(commandRegex);
		if (match) {
			const content = match[2];
			const type = match[1];
			const commentFormat = CommentFormats[type];

			const tokens = content.split(".")
			const args: Record<string, any> = {}
			const lastToken = tokens[tokens.length - 1]

			for (let i = 0; i < tokens.length; i += 2) {
				args[tokens[i]] = tokens[i + 1]
			}

			let argsLeft: Record<string, CommentArgument> = {}
			let canEnterComment = true;

			for (const [key, arg] of Object.entries(commentFormat.arguments)) {
				if (args[key] == undefined) {
					argsLeft[key] = arg
				}
			}
			canEnterComment = !Object.values(argsLeft).some(arg => !arg.optional);

			if (tokens.length % 2) {
				if (canEnterComment) {
					if (lastToken == "") {
						const item = new vscode.CompletionItem("enter a log ass comment", vscode.CompletionItemKind.Text);
						item.detail = "Enter the comment";
						item.keepWhitespace = true;
						items.push(item);
					} else {
						const item = new vscode.CompletionItem(lastToken, vscode.CompletionItemKind.Text);
						item.detail = "Make comment";
						item.command = {
							command: "styled-commenter.convertToComment",
							title: "Convert to comment",
							arguments: [lastToken, type, args]
						};
						item.keepWhitespace = true;
						items.push(item);

					}
				}
				for (const [key, arg] of Object.entries(argsLeft)) {
					const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Property);
					item.detail = arg.name;
					items.push(item);
				}
			} else {
				const lastArg = commentFormat.arguments[tokens[tokens.length - 2]]

				console.log(lastArg)

				if (lastArg != undefined) {
					if (lastToken == "") {
						if (lastArg.isInteger) {
							const item = new vscode.CompletionItem("10", vscode.CompletionItemKind.Property);
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
		}

		return items;
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
	if (!editor) return "";
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

	const command = vscode.commands.registerCommand("styled-commenter.convertToComment", convertToCommand)
	context.subscriptions.push(command);

	const borderedCommand = vscode.commands.registerCommand("styled-commenter.convertToBordered", () => {
		const content = getSelectedContent();
		if (content) convertToCommand(content, "BORDERED", {});
	});

	const boxedCommand = vscode.commands.registerCommand("styled-commenter.convertToBoxed", () => {
		const content = getSelectedContent();
		if (content) convertToCommand(content, "BOXED", {});
	});

	const headerCommand = vscode.commands.registerCommand("styled-commenter.convertToHeader", () => {
		const content = getSelectedContent();
		if (content) convertToCommand(content, "HEADER", {});
	});

	context.subscriptions.push(borderedCommand, boxedCommand, headerCommand);
}

export function deactivate() { }