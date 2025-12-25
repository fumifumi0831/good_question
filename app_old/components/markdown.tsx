import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface MarkdownProps {
    content: string;
    className?: string;
}

export const Markdown = ({ content, className }: MarkdownProps) => {
    // Prevent long separators from overflowing mobile views by replacing them with HRs
    const processedContent = content.replace(/━{10,}/g, '\n\n---\n\n');

    return (
        <div className={cn('prose prose-sm prose-invert max-w-none break-words', className)}>
            <ReactMarkdown>{processedContent}</ReactMarkdown>
        </div>
    );
};
