import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

function ToolbarBtn({ onMouseDown, title, children }) {
    return (
        <button
            type="button"
            onMouseDown={onMouseDown}
            title={title}
            className="p-1.5 rounded-lg transition-colors text-stone-600 hover:bg-stone-200 hover:text-stone-900"
        >
            {children}
        </button>
    );
}

function ToolbarSep() {
    return <div className="w-px h-5 bg-stone-200 mx-1 self-center" />;
}

export default function AnamneseModal({ show, onClose, patient }) {
    const editorRef   = useRef(null);
    const savedRange  = useRef(null);   // guarda a seleção quando o editor perde foco

    /* ── salvar / restaurar seleção ── */
    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedRange.current = sel.getRangeAt(0).cloneRange();
        }
    };

    const restoreSelection = () => {
        editorRef.current?.focus();
        const sel = window.getSelection();
        if (sel && savedRange.current) {
            sel.removeAllRanges();
            sel.addRange(savedRange.current);
        }
    };

    /* ── execCommand com seleção restaurada ── */
    const exec = useCallback((cmd, value = null) => {
        restoreSelection();
        document.execCommand(cmd, false, value);
    }, []);

    /* ── handler para os <select> da toolbar ── */
    const onSelectChange = (cmd) => (e) => {
        exec(cmd, e.target.value);
        editorRef.current?.focus();
    };

    /* ── helpers de conteúdo ── */
    const getTextoPlano = () => editorRef.current?.innerText ?? '';
    const getHtml       = () => editorRef.current?.innerHTML ?? '';

    const dataAtual = () => new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
    });

    /* ── exportações ── */
    const exportarPDF = () => {
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const ml = 20, largura = 170;
        let y = 20;

        doc.setFontSize(16); doc.setFont('helvetica', 'bold');
        doc.text('Ficha de Anamnese', ml, y); y += 8;

        doc.setFontSize(11); doc.setFont('helvetica', 'normal');
        doc.text(`Paciente: ${patient?.name ?? ''}`, ml, y); y += 6;
        doc.text(`Data: ${dataAtual()}`, ml, y); y += 4;

        doc.setDrawColor(180, 180, 180);
        doc.line(ml, y, 190, y); y += 8;

        doc.setFontSize(11);
        const linhas = doc.splitTextToSize(getTextoPlano() || '(Sem conteúdo)', largura);
        doc.text(linhas, ml, y);

        doc.save(`anamnese_${(patient?.name ?? 'paciente').replace(/\s+/g, '_').toLowerCase()}.pdf`);
    };

    const exportarWord = () => {
        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office'
                  xmlns:w='urn:schemas-microsoft-com:office:word'
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Ficha de Anamnese</title>
            <style>
                body { font-family: Calibri, Arial, sans-serif; font-size: 12pt; margin: 2cm; }
                h1 { font-size: 16pt; color: #466250; }
                .info { font-size: 11pt; color: #555; margin-bottom: 4px; }
                hr { border: 1px solid #ccc; margin: 12px 0; }
                .conteudo { font-size: 12pt; line-height: 1.6; }
            </style></head>
            <body>
                <h1>Ficha de Anamnese</h1>
                <p class="info"><strong>Paciente:</strong> ${patient?.name ?? ''}</p>
                <p class="info"><strong>Data:</strong> ${dataAtual()}</p>
                <hr>
                <div class="conteudo">${getHtml() || '(Sem conteúdo)'}</div>
            </body></html>`;

        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        saveAs(blob, `anamnese_${(patient?.name ?? 'paciente').replace(/\s+/g, '_').toLowerCase()}.doc`);
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="flex flex-col" style={{ maxHeight: '88vh' }}>

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-stone-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2.5 rounded-xl">
                            <span className="material-symbols-outlined text-blue-500 text-2xl">assignment</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-stone-800">Ficha de Anamnese</h2>
                            <p className="text-sm text-stone-400">{patient?.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* ── Toolbar ── */}
                <div className="flex flex-wrap items-center gap-1 px-4 py-2.5 border-b border-stone-100 bg-stone-50 flex-shrink-0">

                    {/* Fonte */}
                    <select
                        onChange={onSelectChange('fontName')}
                        defaultValue="Arial"
                        title="Fonte"
                        className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-blue-200 cursor-pointer"
                    >
                        <option value="Arial">Arial</option>
                        <option value="Calibri">Calibri</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                    </select>

                    {/* Tamanho */}
                    <select
                        onChange={onSelectChange('fontSize')}
                        defaultValue="3"
                        title="Tamanho da fonte"
                        className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-blue-200 cursor-pointer w-16"
                    >
                        <option value="1">Muito pequeno</option>
                        <option value="2">Pequeno</option>
                        <option value="3">Normal</option>
                        <option value="4">Médio</option>
                        <option value="5">Grande</option>
                        <option value="6">Muito grande</option>
                        <option value="7">Enorme</option>
                    </select>

                    <ToolbarSep />

                    {/* Negrito */}
                    <ToolbarBtn title="Negrito (Ctrl+B)"
                        onMouseDown={(e) => { e.preventDefault(); exec('bold'); }}>
                        <span className="font-extrabold text-sm w-5 h-5 flex items-center justify-center">B</span>
                    </ToolbarBtn>

                    {/* Itálico */}
                    <ToolbarBtn title="Itálico (Ctrl+I)"
                        onMouseDown={(e) => { e.preventDefault(); exec('italic'); }}>
                        <span className="italic font-serif text-sm w-5 h-5 flex items-center justify-center">I</span>
                    </ToolbarBtn>

                    {/* Sublinhado */}
                    <ToolbarBtn title="Sublinhado (Ctrl+U)"
                        onMouseDown={(e) => { e.preventDefault(); exec('underline'); }}>
                        <span className="underline text-sm w-5 h-5 flex items-center justify-center">U</span>
                    </ToolbarBtn>

                    {/* Tachado */}
                    <ToolbarBtn title="Tachado"
                        onMouseDown={(e) => { e.preventDefault(); exec('strikeThrough'); }}>
                        <span className="line-through text-sm w-5 h-5 flex items-center justify-center">S</span>
                    </ToolbarBtn>

                    <ToolbarSep />

                    {/* Cor do texto */}
                    <label className="relative cursor-pointer p-1.5 rounded-lg hover:bg-stone-200 transition-colors" title="Cor do texto">
                        <span className="material-symbols-outlined text-stone-600" style={{ fontSize: '18px' }}>format_color_text</span>
                        <input type="color" defaultValue="#000000"
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            onChange={(e) => { saveSelection(); exec('foreColor', e.target.value); }} />
                    </label>

                    {/* Destaque */}
                    <label className="relative cursor-pointer p-1.5 rounded-lg hover:bg-stone-200 transition-colors" title="Cor de destaque">
                        <span className="material-symbols-outlined text-stone-600" style={{ fontSize: '18px' }}>format_ink_highlighter</span>
                        <input type="color" defaultValue="#ffff00"
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            onChange={(e) => { saveSelection(); exec('hiliteColor', e.target.value); }} />
                    </label>

                    <ToolbarSep />

                    {/* Alinhamento */}
                    <ToolbarBtn title="Alinhar à esquerda"
                        onMouseDown={(e) => { e.preventDefault(); exec('justifyLeft'); }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_align_left</span>
                    </ToolbarBtn>
                    <ToolbarBtn title="Centralizar"
                        onMouseDown={(e) => { e.preventDefault(); exec('justifyCenter'); }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_align_center</span>
                    </ToolbarBtn>
                    <ToolbarBtn title="Alinhar à direita"
                        onMouseDown={(e) => { e.preventDefault(); exec('justifyRight'); }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_align_right</span>
                    </ToolbarBtn>
                    <ToolbarBtn title="Justificar"
                        onMouseDown={(e) => { e.preventDefault(); exec('justifyFull'); }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_align_justify</span>
                    </ToolbarBtn>

                    <ToolbarSep />

                    {/* Listas */}
                    <ToolbarBtn title="Lista com marcadores"
                        onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_list_bulleted</span>
                    </ToolbarBtn>
                    <ToolbarBtn title="Lista numerada"
                        onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_list_numbered</span>
                    </ToolbarBtn>

                    <ToolbarSep />

                    {/* Recuo */}
                    <ToolbarBtn title="Diminuir recuo"
                        onMouseDown={(e) => { e.preventDefault(); exec('outdent'); }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_indent_decrease</span>
                    </ToolbarBtn>
                    <ToolbarBtn title="Aumentar recuo"
                        onMouseDown={(e) => { e.preventDefault(); exec('indent'); }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_indent_increase</span>
                    </ToolbarBtn>

                    <ToolbarSep />

                    {/* Desfazer / Refazer */}
                    <ToolbarBtn title="Desfazer (Ctrl+Z)"
                        onMouseDown={(e) => { e.preventDefault(); exec('undo'); }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>undo</span>
                    </ToolbarBtn>
                    <ToolbarBtn title="Refazer (Ctrl+Y)"
                        onMouseDown={(e) => { e.preventDefault(); exec('redo'); }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>redo</span>
                    </ToolbarBtn>
                </div>

                {/* ── Editor ── */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        spellCheck
                        onBlur={saveSelection}
                        className="w-full outline-none text-sm text-stone-800 leading-relaxed focus:ring-0 anamnese-editor"
                        style={{ minHeight: '280px' }}
                        data-placeholder="Digite aqui as informações da anamnese do paciente..."
                    />
                    <style>{`
                        .anamnese-editor:empty:before {
                            content: attr(data-placeholder);
                            color: #a8a29e;
                            pointer-events: none;
                            display: block;
                        }
                    `}</style>
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between px-8 py-4 border-t border-stone-100 flex-shrink-0 bg-stone-50/50">
                    <div className="flex gap-2">
                        <button type="button" onClick={exportarPDF}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                            Exportar PDF
                        </button>
                        <button type="button" onClick={exportarWord}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all">
                            <span className="material-symbols-outlined text-base">description</span>
                            Exportar Word
                        </button>
                    </div>
                    <SecondaryButton onClick={onClose}>Fechar</SecondaryButton>
                </div>

            </div>
        </Modal>
    );
}
