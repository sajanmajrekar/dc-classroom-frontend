import { useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Palette, Highlighter } from 'lucide-react';

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
    const selectionRef = useRef(null);

    useEffect(() => {
        const nextValue = toEditorHtml(value);
        if (editorRef.current && editorRef.current.innerHTML !== nextValue) {
            editorRef.current.innerHTML = nextValue;
        }
    }, [value]);

    const saveSelection = () => {
        const selection = window.getSelection();
        if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) {
            selectionRef.current = selection.getRangeAt(0).cloneRange();
        }
    };

    const restoreSelection = () => {
        editorRef.current?.focus();
        if (selectionRef.current) {
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(selectionRef.current);
        }
    };

    const applyFormat = (command, value = null) => {
        restoreSelection();
        document.execCommand(command, false, value);
        saveSelection();
        onChange(editorRef.current?.innerHTML || '');
    };

    return (
        <div className="rich-text-editor">
            <div className="rich-text-toolbar" aria-label="Text formatting controls">
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('bold')} aria-label="Bold"><Bold size={16} /></button>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('italic')} aria-label="Italic"><Italic size={16} /></button>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('insertUnorderedList')} aria-label="Bullet list"><List size={16} /></button>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('insertOrderedList')} aria-label="Numbered list"><ListOrdered size={16} /></button>
                <label className="rich-text-color-control" title="Text color">
                    <Palette size={16} />
                    <input type="color" aria-label="Text color" defaultValue="#ffffff" onMouseDown={saveSelection} onChange={(event) => applyFormat('foreColor', event.target.value)} />
                </label>
                <label className="rich-text-color-control" title="Highlight color">
                    <Highlighter size={16} />
                    <input type="color" aria-label="Highlight color" defaultValue="#facc15" onMouseDown={saveSelection} onChange={(event) => applyFormat('hiliteColor', event.target.value)} />
                </label>
            </div>
            <div
                ref={editorRef}
                className="rich-text-input"
                contentEditable
                role="textbox"
                aria-multiline="true"
                data-placeholder={placeholder}
                onInput={(event) => onChange(event.currentTarget.innerHTML)}
                onKeyUp={saveSelection}
                onMouseUp={saveSelection}
                onFocus={saveSelection}
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
