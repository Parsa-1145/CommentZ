export function splitText(text: string, maxWidth: number): string[] {
	const words = text.split(' ');
	const lines: string[] = [];
	let currentLine = words[0];

	for (let i = 1; i < words.length; i++) {
		const word = words[i];
		// Check if adding the next word exceeds the max width
		if (currentLine.length + 1 + word.length <= maxWidth) {
			currentLine += ' ' + word;
		} else {
			lines.push(currentLine);
			currentLine = word;
		}
	}
	lines.push(currentLine);
	return lines;
};