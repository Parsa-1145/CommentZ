import * as vscode from 'vscode';


type CommentFormat = {
	name: string;
	getCommentString(content:string, language:string):string;
}
const CommentFormats: Record<string, CommentFormat> = {
	BOXED: {
		name:"Boxed",
		getCommentString(content, language) {
			let out = "";
			switch(language){
				case "python":
					const totalSize = content.length + 2 + 2 * (3 + 10);
					
					out += "#".repeat(totalSize) + "\n";
					
					out += "#" + " ".repeat(3) + " ".repeat(10) + content + " ".repeat(10) + " ".repeat(3) + "#\n";
					
					out += "#".repeat(totalSize) + "\n";
					break;

				case "c":
				case "cpp":
					const lineLength = content.length + 4 + 2 * (10);
					
					out += "/*" + "*".repeat(lineLength-4) + "*/\n";
					
					out += "/*" + " ".repeat(10) + content + " ".repeat(10) + "*/\n";
					
					out += "/*" + "*".repeat(lineLength-4) + "*/\n";
					break;
			}
			return out
		},
	},
	HEADER: {
		name:"Header",
		getCommentString(content, language) {
			let out = "";
			switch(language){
				case "python":
					const totalSize = content.length + 2 + 2 * (3 + 10);
					
					out += "#" + " ".repeat(3) + " ".repeat(10) + content + " ".repeat(10) + " ".repeat(3) + "#\n";
					break;

				case "c":
				case "cpp":
					const lineLength = content.length + 2 + 2 * (3 + 10);
				
					out += "/*" + " ".repeat(3) + " ".repeat(10) + content + " ".repeat(10) + " ".repeat(3) + "*/\n";
					break;
			}
			return out
		},
	}
}

const formatKeys = Object.keys(CommentFormats).join('|');
const regex = new RegExp(`\\.COMMENT\\.(${formatKeys})\\.(.*)`);

class CommentProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {

		const items: vscode.CompletionItem[] = [];
		const lineText = document.lineAt(position).text.substring(0, position.character).trim();

		if (lineText == ".") {
			const item = new vscode.CompletionItem("COMMENT", vscode.CompletionItemKind.Module);
			item.detail = "start styled comment";
			// item.range = new vscode.Range(position.line, lineText.lastIndexOf('.'), position.line, position.character);
			items.push(item);
		}
		if (lineText === ".COMMENT.") {
			for (const formatKey in CommentFormats) {
				const item = new vscode.CompletionItem(formatKey, vscode.CompletionItemKind.Function);
				item.insertText = new vscode.SnippetString(formatKey);
				items.push(item);
			}
		}
		
		const match = lineText.match(regex);
		
        if (match) {
			const content = match[2].trim();
			const type = match[1].trim();
            if (content.length > 0) {
				const item = new vscode.CompletionItem(content, vscode.CompletionItemKind.Function);
                item.detail = "Convert to comment";
				item.command = {
					command: "styled-commenter.convertToComment",
					title: "Convert to Boxed Comment",
					arguments: [content, type]
				};
                items.push(item);
            }
        }

		return items;
	}
	resolveCompletionItem(item: vscode.CompletionItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CompletionItem> {
		return item;
	}
}

export function activate(context: vscode.ExtensionContext) {
	const suggestProvider = vscode.languages.registerCompletionItemProvider(
		['python', 'cpp', 'c'],
		new CommentProvider(),
		"."
	);

	context.subscriptions.push(
        vscode.commands.registerCommand("styled-commenter.convertToComment", (content, type) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const line = editor.document.lineAt(editor.selection.active.line);
            const range = new vscode.Range(line.range.start, line.range.end);

			let comment = CommentFormats[type].getCommentString(content, editor.document.languageId);
            
            editor.edit(editBuilder => {
                editBuilder.delete(range);
                editBuilder.insert(line.range.start, comment);
            });
        })
    );

	context.subscriptions.push(suggestProvider);
}



/* ------------------------------------------- */
/* ----------------- asdasd ------------------ */
/* ------------------------------------------- */

export function deactivate() { }