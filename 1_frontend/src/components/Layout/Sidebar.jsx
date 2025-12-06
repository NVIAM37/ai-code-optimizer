import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, RefreshCw } from 'lucide-react';
import api from '../../api';

const FileTreeItem = ({ item, level, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleToggle = async (e) => {
        e.stopPropagation();
        if (item.isDirectory) {
            if (!isOpen && children.length === 0) {
                setLoading(true);
                try {
                    const res = await api.get(`/files?path=${item.path}`);
                    setChildren(res.data.files);
                } catch (err) {
                    console.error("Failed to load directory:", err);
                }
                setLoading(false);
            }
            setIsOpen(!isOpen);
        } else {
            // Handle Chat Session Selection
            if (item.isVirtual && item.path.startsWith('Chats/')) {
                // Redirect to chat page with ID
                window.location.href = `/chat?id=${item.id}`;
            } else {
                onSelect(item);
            }
        }
    };

    return (
        <div>
            <div
                className={`flex items-center gap-1 py-1 px-2 hover:bg-gray-800 cursor-pointer text-sm text-gray-300 select-none`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleToggle}
            >
                <span className="opacity-70">
                    {item.isDirectory ? (
                        isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : (
                        <span className="w-3.5 inline-block" />
                    )}
                </span>
                <span className="text-blue-400 opacity-80">
                    {item.isDirectory ? (
                        isOpen ? <FolderOpen size={14} /> : <Folder size={14} />
                    ) : (
                        <File size={14} className="text-gray-400" />
                    )}
                </span>
                <span className="truncate flex-1">
                    {item.displayName || item.name}
                    {item.preview && (
                        <span className="block text-[10px] text-gray-500 truncate mt-0.5">
                            {item.preview}
                        </span>
                    )}
                </span>
            </div>
            {isOpen && (
                <div>
                    {loading ? (
                        <div className="pl-8 text-xs text-gray-500 py-1">Loading...</div>
                    ) : (
                        children.map((child, idx) => (
                            <FileTreeItem key={idx} item={child} level={level + 1} onSelect={onSelect} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const Sidebar = ({ onFileSelect }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadRoot = async () => {
        setLoading(true);
        try {
            const res = await api.get('/files');
            setFiles(res.data.files);
        } catch (err) {
            console.error("Failed to load root:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadRoot();
    }, []);

    return (
        <div className="h-full bg-[#181818] border-r border-gray-800 flex flex-col text-white">
            <div className="h-9 px-4 flex items-center justify-between bg-[#1f1f1f] text-xs font-bold tracking-wider text-gray-400 uppercase">
                <span>Explorer</span>
                <button onClick={loadRoot} className="hover:text-white" title="Refresh">
                    <RefreshCw size={12} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
                {loading ? (
                    <div className="text-center text-gray-500 text-xs mt-4">Loading...</div>
                ) : (
                    files.map((file, idx) => (
                        <FileTreeItem key={idx} item={file} level={0} onSelect={onFileSelect} />
                    ))
                )}
            </div>
        </div>
    );
};

export default Sidebar;
