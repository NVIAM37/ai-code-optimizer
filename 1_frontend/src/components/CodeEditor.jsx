import React from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ value, onChange, readOnly = false, language = "python" }) => {
    return (
        <div className="h-full w-full rounded-lg overflow-hidden border border-gray-800 shadow-inner bg-[#1e1e1e]">
            <Editor
                height="100%"
                defaultLanguage={language}
                language={language}
                value={value}
                onChange={onChange}
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    readOnly: readOnly,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                }}
            />
        </div>
    );
};

export default CodeEditor;
