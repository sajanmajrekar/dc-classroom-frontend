import { useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

const toEditorHtml = (value) => {
    if (!value) return '';
    if (/<\/?[a-z][\s\S]*>/i.test(value)) return value;

    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
};

export default function RichTextEditor({ value, onChange, placeholder }) {
    const editorRef = useRef(null);

    useEffect(() => {
        const nextValue = toEditorHtml(value);
        if (editorRef.current && editorRef.current.innerHTML !== nextValue) {
            editorRef.current.innerHTML = nextValue;
        }
    }, [value]);

    const applyFormat = (command) => {
        editorRef.current?.focus();
        document.execCommand(command, false);
        onChange(editorRef.current?.innerHTML || '');
    };

    return (
        <div className="rich-text-editor">
            <div className="rich-text-toolbar" aria-label="Text formatting controls">
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('bold')} aria-label="Bold"><Bold size={16} /></button>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('italic')} aria-label="Italic"><Italic size={16} /></button>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('insertUnorderedList')} aria-label="Bullet list"><List size={16} /></button>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('insertOrderedList')} aria-label="Numbered list"><ListOrdered size={16} /></button>
            </div>
            <div
                ref={editorRef}
                className="rich-text-input"
                contentEditable
                role="textbox"
                aria-multiline="true"
                data-placeholder={placeholder}
                onInput={(event) => onChange(event.currentTarget.innerHTML)}
            />
        </div>
    );
}

export function RichTextContent({ content }) {
    if (!content) return null;
    const isHtml = /<\/?[a-z][\s\S]*>/i.test(content);

    if (!isHtml) {
        return <div className="rich-text-content rich-text-plain">{content}</div>;
    }

    return <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: content }} />;
}
