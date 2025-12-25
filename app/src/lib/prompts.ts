import fs from 'fs/promises';
import path from 'path';

export type PromptMode = 'facilitator' | 'mentor' | 'helper' | 'reviewer';

export async function getPrompt(mode: PromptMode): Promise<string> {
    const filePath = path.join(process.cwd(), 'src/prompts', `${mode}.md`);
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        console.error(`Failed to read prompt for mode: ${mode}`, error);
        return '';
    }
}
