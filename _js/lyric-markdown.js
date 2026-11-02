import MarkdownIt from 'markdown-it';

const markdown = new MarkdownIt({ html: false, breaks: true, linkify: false });

export const renderMarkdown = (text) => markdown.render(String(text ?? ''));
