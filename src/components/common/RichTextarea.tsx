import React, { useRef } from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface RichTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  minLength?: number;
  showCharCount?: boolean;
}

const RichTextarea = ({
  value,
  onChange,
  placeholder,
  rows = 6,
  className,
  minLength,
  showCharCount = false,
}: RichTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    // Restore cursor position after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertBulletList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    // Split selected text into lines and add bullets
    const lines = selectedText.split('\n');
    const bulletedLines = lines.map(line => line.trim() ? `• ${line.trim()}` : line).join('\n');
    
    const newText = value.substring(0, start) + bulletedLines + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const insertNumberedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    // Split selected text into lines and add numbers
    const lines = selectedText.split('\n');
    const numberedLines = lines.map((line, index) => line.trim() ? `${index + 1}. ${line.trim()}` : line).join('\n');
    
    const newText = value.substring(0, start) + numberedLines + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Get HTML content if available
    const html = e.clipboardData.getData('text/html');
    const plainText = e.clipboardData.getData('text/plain');
    
    if (html) {
      e.preventDefault();
      
      // Parse HTML and convert to simple formatted text
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const convertToText = (element: Element | ChildNode): string => {
        let result = '';
        
        element.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            result += node.textContent;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            const tagName = el.tagName.toLowerCase();
            
            if (tagName === 'strong' || tagName === 'b') {
              result += `**${convertToText(el)}**`;
            } else if (tagName === 'em' || tagName === 'i') {
              result += `*${convertToText(el)}*`;
            } else if (tagName === 'li') {
              const parent = el.parentElement;
              if (parent?.tagName.toLowerCase() === 'ol') {
                const index = Array.from(parent.children).indexOf(el) + 1;
                result += `${index}. ${convertToText(el)}\n`;
              } else {
                result += `• ${convertToText(el)}\n`;
              }
            } else if (tagName === 'br') {
              result += '\n';
            } else if (tagName === 'p' || tagName === 'div') {
              result += convertToText(el) + '\n';
            } else if (tagName === 'ul' || tagName === 'ol') {
              result += convertToText(el);
            } else {
              result += convertToText(el);
            }
          }
        });
        
        return result;
      };
      
      const formattedText = convertToText(doc.body).trim();
      
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = value.substring(0, start) + formattedText + value.substring(end);
        onChange(newText);
      }
    }
    // If no HTML, let default paste behavior handle plain text
  };

  const isValidLength = !minLength || value.length >= minLength;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 p-1 border rounded-t-md bg-muted/30 border-b-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => wrapSelection('**', '**')}
          title="Bold (select text first)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => wrapSelection('*', '*')}
          title="Italic (select text first)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={insertBulletList}
          title="Bullet list (select lines)"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={insertNumberedList}
          title="Numbered list (select lines)"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground ml-auto mr-2">
          Select text, then click to format
        </span>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "rounded-t-none -mt-2",
          minLength && value.length > 0 && !isValidLength && "border-destructive",
          className
        )}
      />
      {showCharCount && minLength && (
        <p className={cn(
          "text-xs",
          !isValidLength ? "text-destructive" : "text-muted-foreground"
        )}>
          {value.length}/{minLength} characters
        </p>
      )}
    </div>
  );
};

export default RichTextarea;
