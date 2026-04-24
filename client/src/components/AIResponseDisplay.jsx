import { Sparkles } from 'lucide-react';

function parseMarkdown(text) {
  if (!text) return '';

  let html = text
    // Headers
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Code inline
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-4 border-gray-300" />')
    // Unordered lists
    .replace(/^[*-] (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');

  // Wrap consecutive <li> tags in <ul>
  html = html.replace(/(<li>.*?<\/li>(?:<br \/>)?)+/g, (match) => {
    const cleaned = match.replace(/<br \/>/g, '');
    return `<ul class="list-disc">${cleaned}</ul>`;
  });

  return `<p>${html}</p>`;
}

export default function AIResponseDisplay({ content }) {
  if (!content) return null;

  return (
    <div className="relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 via-purple-500 to-blue-500 rounded-full" />
      <div className="pl-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-600">AI Legal Analysis</span>
        </div>
        <div
          className="ai-response prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
        />
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 italic">
            This AI analysis is for informational purposes only and does not constitute legal advice.
            Always consult with a licensed attorney for legal decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
