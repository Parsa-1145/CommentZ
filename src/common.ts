export type CommentFormat = {
	name: string;
	getCommentString(content:string, language:string, args: Record<string, any>):string;
	arguments: Record<string, CommentArgument>;
    docComment: string;
    details: string;
}
export type CommentArgument = {
	name: string;
	isInteger: boolean;
	optional: boolean;
}