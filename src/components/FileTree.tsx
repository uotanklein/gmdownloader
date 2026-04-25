'use client';

import { useState } from 'react';
import type { FileTreeNode } from '@/types/addons';

type FileTreeProps = {
    nodes: Array<FileTreeNode>;
    selectedPath: string | null;
    onSelect: (filePath: string) => void;
};

function getDefaultOpenState(node: FileTreeNode) {
    return node.path.split('/').length < 2;
}

function FileBranch(props: {
    depth: number;
    node: FileTreeNode;
    selectedPath: string | null;
    onSelect: (filePath: string) => void;
}) {
    const { depth, node, selectedPath, onSelect } = props;
    const [isOpen, setIsOpen] = useState(getDefaultOpenState(node));
    const isSelected = node.type === 'file' && selectedPath === node.path;

    if (node.type === 'directory') {
        return (
            <div className='space-y-1'>
                <button
                    type='button'
                    onClick={() => setIsOpen((current) => !current)}
                    className='flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-[var(--foreground)]/82 transition hover:bg-white/6'
                    style={{ paddingLeft: `${depth * 16 + 12}px` }}
                >
                    <span className='mono text-xs text-[var(--accent)]'>{isOpen ? '[-]' : '[+]'}</span>
                    <span className='truncate'>{node.name}</span>
                </button>
                {isOpen ? (
                    <div className='space-y-1'>
                        {node.children?.map((child) => (
                            <FileBranch key={child.path} depth={depth + 1} node={child} selectedPath={selectedPath} onSelect={onSelect} />
                        ))}
                    </div>
                ) : null}
            </div>
        );
    }

    return (
        <button
            type='button'
            onClick={() => onSelect(node.path)}
            className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition ${
                isSelected ? 'bg-[rgba(125,226,209,0.14)] text-white shadow-[0_0_0_1px_rgba(125,226,209,0.15)]' : 'text-[var(--foreground)]/74 hover:bg-white/6'
            }`}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
            <span className='mono text-xs text-[var(--accent-strong)]'>fn</span>
            <span className='truncate'>{node.name}</span>
        </button>
    );
}

export default function FileTree({ nodes, selectedPath, onSelect }: FileTreeProps) {
    if (!nodes.length) {
        return <div className='rounded-[28px] border border-dashed border-white/10 px-4 py-8 text-sm text-[var(--muted)]'>В аддоне пока нет файлов для отображения.</div>;
    }

    return (
        <div className='space-y-1'>
            {nodes.map((node) => (
                <FileBranch key={node.path} depth={0} node={node} selectedPath={selectedPath} onSelect={onSelect} />
            ))}
        </div>
    );
}
