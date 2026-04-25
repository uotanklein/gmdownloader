'use client';

/* eslint-disable @next/next/no-img-element */

import Editor from '@monaco-editor/react';
import Link from 'next/link';
import { useCallback, useDeferredValue, useEffect, useState, useTransition } from 'react';
import FileTree from '@/components/FileTree';
import type { Addon, AddonDetailsPayload, AddonFilePayload, FileTreeNode } from '@/types/addons';

type WorkshopLookup = {
    workshopId: string;
    title: string;
    previewUrl: string;
    subscriptions: number;
    favorited: number;
};

type StatusTone = 'neutral' | 'success' | 'error';

function formatNumber(value: number) {
    return new Intl.NumberFormat('ru-RU').format(value);
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function getLanguageFromFilePath(filePath: string | null) {
    const extension = filePath?.split('.').pop()?.toLowerCase() ?? '';

    switch (extension) {
        case 'css':
            return 'css';
        case 'html':
        case 'htm':
            return 'html';
        case 'js':
            return 'javascript';
        case 'json':
        case 'vdf':
            return 'json';
        case 'lua':
            return 'lua';
        case 'md':
            return 'markdown';
        case 'ts':
        case 'tsx':
            return 'typescript';
        case 'xml':
        case 'vmf':
            return 'xml';
        case 'yml':
        case 'yaml':
            return 'yaml';
        default:
            return 'plaintext';
    }
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    return 'Произошла непредвиденная ошибка.';
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit) {
    const response = await fetch(input, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
        cache: 'no-store',
    });

    const data = (await response.json().catch(() => null)) as T | { message?: string } | null;

    if (!response.ok) {
        const message = typeof data === 'object' && data && 'message' in data && typeof data.message === 'string' ? data.message : 'Запрос завершился с ошибкой.';
        throw new Error(message);
    }

    return data as T;
}

export default function GMDownloaderApp() {
    const [addons, setAddons] = useState<Array<Addon>>([]);
    const [selectedAddonId, setSelectedAddonId] = useState<string | null>(null);
    const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
    const [tree, setTree] = useState<Array<FileTreeNode>>([]);
    const [stats, setStats] = useState({ files: 0, folders: 0 });
    const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
    const [fileData, setFileData] = useState<AddonFilePayload | null>(null);
    const [draft, setDraft] = useState('');
    const [query, setQuery] = useState('');
    const [lookup, setLookup] = useState<WorkshopLookup | null>(null);
    const [booting, setBooting] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingAddon, setIsLoadingAddon] = useState(false);
    const [status, setStatus] = useState<{ tone: StatusTone; message: string } | null>(null);
    const [isPending, startTransition] = useTransition();
    const deferredQuery = useDeferredValue(query);
    const isDirty = fileData?.isText ? draft !== (fileData.content ?? '') : false;

    const setStatusMessage = (tone: StatusTone, message: string) => {
        setStatus({ tone, message });
    };

    const resetFileSelection = useCallback(() => {
        setSelectedFilePath(null);
        setFileData(null);
        setDraft('');
    }, []);

    const loadFile = useCallback(async (addonId: string, filePath: string) => {
        const payload = await fetchJson<AddonFilePayload>(`/api/addons/${addonId}/file?path=${encodeURIComponent(filePath)}`, { method: 'GET' });
        setSelectedFilePath(filePath);
        setFileData(payload);
        setDraft(payload.content ?? '');
    }, []);

    const loadAddonDetails = useCallback(
        async (addonId: string, preferredFilePath?: string | null) => {
            setIsLoadingAddon(true);

            try {
                const payload = await fetchJson<AddonDetailsPayload>(`/api/addons/${addonId}`);
                setSelectedAddon(payload.addon);
                setTree(payload.tree);
                setStats(payload.stats);
                setSelectedAddonId(payload.addon.id);

                const nextFilePath =
                    preferredFilePath && treeContainsPath(payload.tree, preferredFilePath) ? preferredFilePath : findFirstFile(payload.tree)?.path ?? null;

                if (nextFilePath) {
                    await loadFile(payload.addon.id, nextFilePath);
                } else {
                    resetFileSelection();
                }
            } finally {
                setIsLoadingAddon(false);
            }
        },
        [loadFile, resetFileSelection],
    );

    const refreshAddons = useCallback(
        async (preferredAddonId?: string | null, preferredFilePath?: string | null) => {
            const addonList = await fetchJson<Array<Addon>>('/api/addons', { method: 'GET' });
            setAddons(addonList);

            const nextAddonId = preferredAddonId && addonList.some((addon) => addon.id === preferredAddonId) ? preferredAddonId : addonList[0]?.id ?? null;

            if (!nextAddonId) {
                setSelectedAddon(null);
                setTree([]);
                setStats({ files: 0, folders: 0 });
                resetFileSelection();
                setSelectedAddonId(null);
                return;
            }

            await loadAddonDetails(nextAddonId, preferredFilePath);
        },
        [loadAddonDetails, resetFileSelection],
    );

    const openFile = useCallback(
        async (addonId: string, filePath: string) => {
            if (isDirty) {
                const shouldContinue = window.confirm('В текущем файле есть несохранённые изменения. Открыть другой файл и потерять их?');
                if (!shouldContinue) {
                    return;
                }
            }

            await loadFile(addonId, filePath);
        },
        [isDirty, loadFile],
    );

    useEffect(() => {
        let isActive = true;

        const boot = async () => {
            try {
                await fetchJson<{ ok: boolean }>('/api/init', { method: 'POST', body: JSON.stringify({}) });
                if (!isActive) {
                    return;
                }

                await refreshAddons();
            } catch (error) {
                if (isActive) {
                    setStatusMessage('error', getErrorMessage(error));
                }
            } finally {
                if (isActive) {
                    setBooting(false);
                }
            }
        };

        void boot();

        return () => {
            isActive = false;
        };
    }, [refreshAddons]);

    useEffect(() => {
        if (!deferredQuery.trim()) {
            setLookup(null);
            return;
        }

        const timeoutId = window.setTimeout(async () => {
            try {
                const data = await fetchJson<WorkshopLookup>('/api/search', {
                    method: 'POST',
                    body: JSON.stringify({ query: deferredQuery }),
                });
                setLookup(data);
            } catch {
                setLookup(null);
            }
        }, 320);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [deferredQuery]);

    const handleDownloadAddon = async () => {
        if (!query.trim()) {
            setStatusMessage('error', 'Сначала вставьте ссылку на Workshop или numeric ID.');
            return;
        }

        setIsDownloading(true);
        setStatusMessage('neutral', 'Скачиваю и распаковываю аддон. Это может занять немного времени.');

        try {
            const addon = await fetchJson<Addon>('/api/addons', {
                method: 'POST',
                body: JSON.stringify({ query }),
            });

            setQuery('');
            setLookup(null);
            startTransition(() => {
                setSelectedAddonId(addon.id);
            });
            await refreshAddons(addon.id);
            setStatusMessage('success', `Аддон «${addon.title}» готов к просмотру и редактированию.`);
        } catch (error) {
            setStatusMessage('error', getErrorMessage(error));
        } finally {
            setIsDownloading(false);
        }
    };

    const handleSelectAddon = async (addonId: string) => {
        if (selectedAddonId === addonId) {
            return;
        }

        if (isDirty) {
            const shouldContinue = window.confirm('В текущем файле есть несохранённые изменения. Переключиться на другой аддон?');
            if (!shouldContinue) {
                return;
            }
        }

        try {
            startTransition(() => {
                setSelectedAddonId(addonId);
            });
            await loadAddonDetails(addonId);
        } catch (error) {
            setStatusMessage('error', getErrorMessage(error));
        }
    };

    const handleSaveFile = async () => {
        if (!selectedAddonId || !fileData || !fileData.isText) {
            return;
        }

        setIsSaving(true);

        try {
            const updated = await fetchJson<AddonFilePayload>(`/api/addons/${selectedAddonId}/file`, {
                method: 'PUT',
                body: JSON.stringify({
                    path: fileData.path,
                    content: draft,
                }),
            });

            setFileData(updated);
            setDraft(updated.content ?? '');
            await refreshAddons(selectedAddonId, updated.path);
            setStatusMessage('success', `Файл «${updated.name}» сохранён.`);
        } catch (error) {
            setStatusMessage('error', getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAddon = async () => {
        if (!selectedAddon) {
            return;
        }

        const shouldDelete = window.confirm(`Удалить локальную копию «${selectedAddon.title}»?`);
        if (!shouldDelete) {
            return;
        }

        try {
            await fetchJson<{ ok: boolean }>(`/api/addons/${selectedAddon.id}`, {
                method: 'DELETE',
            });
            await refreshAddons();
            setStatusMessage('success', `Аддон «${selectedAddon.title}» удалён из локального хранилища.`);
        } catch (error) {
            setStatusMessage('error', getErrorMessage(error));
        }
    };

    const selectedFileRawUrl = selectedAddonId && fileData ? `/api/addons/${selectedAddonId}/file?path=${encodeURIComponent(fileData.path)}&raw=1` : null;

    return (
        <main className='min-h-screen px-4 py-5 text-white sm:px-6 lg:px-8'>
            <div className='mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1600px] flex-col gap-5'>
                <section className='panel-strong relative overflow-hidden rounded-[34px] p-5 sm:p-7'>
                    <div className='absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,rgba(125,226,209,0.18),transparent_58%)] lg:block' />
                    <div className='relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
                        <div className='max-w-3xl space-y-4'>
                            <div className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-[var(--accent)]'>
                                GMDownloader
                            </div>
                            <div className='space-y-3'>
                                <h1 className='text-4xl leading-tight font-semibold sm:text-5xl'>Workshop-аддоны Garry&apos;s Mod в одном рабочем окне.</h1>
                                <p className='max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base'>
                                    Вставьте ссылку на Steam Workshop, скачайте `.gma`, распакуйте её через `gmad.exe`, откройте любые файлы внутри аддона и правьте их прямо в браузере.
                                </p>
                            </div>
                        </div>
                        <div className='w-full max-w-xl space-y-3'>
                            <div className='flex flex-col gap-3 sm:flex-row'>
                                <label className='panel flex flex-1 items-center gap-3 rounded-[24px] px-4 py-3'>
                                    <span className='mono text-xs uppercase tracking-[0.22em] text-[var(--accent)]'>URL</span>
                                    <input
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder='https://steamcommunity.com/sharedfiles/filedetails/?id=...'
                                        className='w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35'
                                    />
                                </label>
                                <button
                                    type='button'
                                    onClick={() => void handleDownloadAddon()}
                                    disabled={isDownloading}
                                    className='rounded-[24px] bg-[linear-gradient(135deg,#ffb55c,#ff7b54)] px-5 py-3 text-sm font-medium text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-65'
                                >
                                    {isDownloading ? 'Скачивание...' : 'Скачать аддон'}
                                </button>
                            </div>
                            {lookup ? (
                                <div className='panel flex items-center gap-4 rounded-[28px] p-3'>
                                    <img src={lookup.previewUrl} alt={lookup.title} className='h-16 w-28 rounded-2xl object-cover' />
                                    <div className='min-w-0 flex-1'>
                                        <p className='truncate text-base font-medium'>{lookup.title}</p>
                                        <div className='mt-1 flex flex-wrap gap-3 text-xs text-[var(--muted)]'>
                                            <span>{formatNumber(lookup.subscriptions)} подписок</span>
                                            <span>{formatNumber(lookup.favorited)} в избранном</span>
                                            <span>ID {lookup.workshopId}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className='text-xs text-[var(--muted)]'>Поддерживаются полные ссылки Workshop и просто numeric ID.</p>
                            )}
                            {status ? (
                                <div
                                    className={`rounded-[20px] px-4 py-3 text-sm ${
                                        status.tone === 'error'
                                            ? 'bg-[rgba(255,92,92,0.12)] text-[rgb(255,188,188)]'
                                            : status.tone === 'success'
                                              ? 'bg-[rgba(125,226,209,0.12)] text-[rgb(203,255,245)]'
                                              : 'bg-white/6 text-[var(--foreground)]/82'
                                    }`}
                                >
                                    {status.message}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className='grid flex-1 grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]'>
                    <aside className='panel rounded-[30px] p-4 sm:p-5'>
                        <div className='mb-4 flex items-end justify-between gap-3'>
                            <div>
                                <p className='mono text-xs uppercase tracking-[0.22em] text-[var(--accent)]'>Library</p>
                                <h2 className='mt-2 text-2xl font-semibold'>Скачанные аддоны</h2>
                            </div>
                            <div className='rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--muted)]'>{addons.length}</div>
                        </div>

                        <div className='space-y-3'>
                            {booting ? <div className='rounded-[24px] border border-dashed border-white/10 px-4 py-10 text-sm text-[var(--muted)]'>Инициализация рабочего пространства...</div> : null}
                            {!booting && !addons.length ? (
                                <div className='rounded-[24px] border border-dashed border-white/10 px-4 py-10 text-sm leading-6 text-[var(--muted)]'>
                                    Локальная библиотека пока пуста. Добавьте первый аддон через Steam Workshop URL выше.
                                </div>
                            ) : null}
                            {addons.map((addon) => {
                                const isActive = addon.id === selectedAddonId;
                                return (
                                    <button
                                        key={addon.id}
                                        type='button'
                                        onClick={() => void handleSelectAddon(addon.id)}
                                        className={`panel w-full rounded-[24px] p-3 text-left transition ${
                                            isActive ? 'border-[rgba(125,226,209,0.3)] bg-[rgba(125,226,209,0.12)]' : 'hover:bg-white/7'
                                        }`}
                                    >
                                        <div className='flex items-center gap-3'>
                                            <img src={addon.previewUrl} alt={addon.title} className='h-16 w-24 rounded-[18px] object-cover' />
                                            <div className='min-w-0 flex-1'>
                                                <p className='truncate text-sm font-medium'>{addon.title}</p>
                                                <p className='mt-1 text-xs text-[var(--muted)]'>Workshop ID {addon.workshopId}</p>
                                                <div className='mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted)]'>
                                                    <span>{formatNumber(addon.subscriptions)} загрузок</span>
                                                    <span>{formatDate(addon.updatedAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    <section className='grid min-h-[620px] grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]'>
                        <div className='panel rounded-[30px] p-4 sm:p-5'>
                            <div className='mb-4 flex items-center justify-between gap-3'>
                                <div>
                                    <p className='mono text-xs uppercase tracking-[0.22em] text-[var(--accent)]'>Explorer</p>
                                    <h2 className='mt-2 text-2xl font-semibold'>Файлы аддона</h2>
                                </div>
                                {(isLoadingAddon || isPending) && <span className='text-xs text-[var(--muted)]'>Обновление...</span>}
                            </div>
                            <div className='max-h-[calc(100vh-24rem)] overflow-auto pr-1'>
                                <FileTree nodes={tree} selectedPath={selectedFilePath} onSelect={(filePath) => void (selectedAddonId ? openFile(selectedAddonId, filePath) : Promise.resolve())} />
                            </div>
                        </div>

                        <div className='panel-strong flex min-h-[620px] flex-col rounded-[30px] p-4 sm:p-5'>
                            <div className='mb-5 flex flex-col gap-4 border-b border-white/8 pb-5 xl:flex-row xl:items-center xl:justify-between'>
                                <div className='min-w-0 flex items-center gap-4'>
                                    <div className='hidden overflow-hidden rounded-[22px] border border-white/8 bg-white/4 sm:block'>
                                        {selectedAddon ? <img src={selectedAddon.previewUrl} alt={selectedAddon.title} className='h-24 w-40 object-cover' /> : <div className='h-24 w-40 bg-white/4' />}
                                    </div>
                                    <div className='min-w-0'>
                                        <p className='mono text-xs uppercase tracking-[0.22em] text-[var(--accent)]'>Workspace</p>
                                        <h2 className='mt-2 truncate text-2xl font-semibold sm:text-3xl'>{selectedAddon?.title ?? 'Выберите аддон из библиотеки'}</h2>
                                        <div className='mt-3 flex flex-wrap gap-3 text-xs text-[var(--muted)]'>
                                            {selectedAddon ? (
                                                <>
                                                    <span>{formatNumber(selectedAddon.subscriptions)} подписок</span>
                                                    <span>{formatNumber(selectedAddon.favorited)} в избранном</span>
                                                    <span>{stats.folders} папок</span>
                                                    <span>{stats.files} файлов</span>
                                                </>
                                            ) : (
                                                <span>После выбора аддона здесь появятся его файлы, редактор и экспорт в zip.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {selectedAddon ? (
                                    <div className='flex flex-wrap gap-3'>
                                        <Link
                                            href={`/api/addons/${selectedAddon.id}/download`}
                                            className='rounded-[20px] border border-[rgba(125,226,209,0.3)] bg-[rgba(125,226,209,0.12)] px-4 py-2 text-sm text-[rgb(210,255,246)] transition hover:bg-[rgba(125,226,209,0.18)]'
                                        >
                                            Скачать zip
                                        </Link>
                                        <button
                                            type='button'
                                            onClick={() => void handleDeleteAddon()}
                                            className='rounded-[20px] border border-[rgba(255,121,121,0.25)] bg-[rgba(255,121,121,0.08)] px-4 py-2 text-sm text-[rgb(255,192,192)] transition hover:bg-[rgba(255,121,121,0.14)]'
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                ) : null}
                            </div>

                            {selectedAddon ? (
                                <div className='flex min-h-0 flex-1 flex-col'>
                                    <div className='mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/8 bg-black/16 px-4 py-3'>
                                        <div className='min-w-0'>
                                            <p className='truncate text-sm font-medium'>{fileData?.name ?? 'Файл не выбран'}</p>
                                            <p className='mt-1 text-xs text-[var(--muted)]'>{fileData ? `${fileData.path} • ${formatNumber(fileData.size)} B` : 'Выберите любой файл в дереве слева'}</p>
                                        </div>
                                        <div className='flex flex-wrap items-center gap-3'>
                                            {fileData?.isText ? (
                                                <button
                                                    type='button'
                                                    disabled={!isDirty || isSaving}
                                                    onClick={() => void handleSaveFile()}
                                                    className='rounded-[18px] bg-[linear-gradient(135deg,#7de2d1,#6cbcff)] px-4 py-2 text-sm font-medium text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55'
                                                >
                                                    {isSaving ? 'Сохраняю...' : isDirty ? 'Сохранить' : 'Сохранено'}
                                                </button>
                                            ) : null}
                                            {selectedFileRawUrl ? (
                                                <Link href={selectedFileRawUrl} className='rounded-[18px] border border-white/12 px-4 py-2 text-sm text-[var(--foreground)]/82 transition hover:bg-white/6'>
                                                    Открыть raw
                                                </Link>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className='min-h-0 flex-1 overflow-hidden rounded-[26px] border border-white/8 bg-[#070b12]'>
                                        {fileData ? (
                                            fileData.isText ? (
                                                <Editor
                                                    height='100%'
                                                    defaultLanguage='plaintext'
                                                    language={getLanguageFromFilePath(fileData.path)}
                                                    value={draft}
                                                    onChange={(value) => setDraft(value ?? '')}
                                                    theme='vs-dark'
                                                    options={{
                                                        automaticLayout: true,
                                                        fontFamily: 'var(--font-mono)',
                                                        fontLigatures: true,
                                                        fontSize: 14,
                                                        minimap: { enabled: false },
                                                        padding: { top: 18, bottom: 18 },
                                                        scrollBeyondLastLine: false,
                                                        wordWrap: 'on',
                                                    }}
                                                />
                                            ) : (
                                                <div className='flex h-full flex-col items-center justify-center gap-5 p-6 text-center'>
                                                    <div className='max-w-md space-y-3'>
                                                        <p className='text-lg font-medium'>Бинарный файл</p>
                                                        <p className='text-sm leading-6 text-[var(--muted)]'>Этот файл нельзя показать в Monaco как текст. Но его можно открыть в raw-режиме, а изображения и аудио мы попробуем отрисовать ниже.</p>
                                                    </div>
                                                    {selectedFileRawUrl && isImageFile(fileData.path) ? <img src={selectedFileRawUrl} alt={fileData.name} className='max-h-[420px] max-w-full rounded-[24px] object-contain shadow-2xl' /> : null}
                                                    {selectedFileRawUrl && isAudioFile(fileData.path) ? <audio controls src={selectedFileRawUrl} className='w-full max-w-lg' /> : null}
                                                </div>
                                            )
                                        ) : (
                                            <div className='flex h-full items-center justify-center p-6 text-center text-sm leading-6 text-[var(--muted)]'>
                                                Выберите файл в дереве слева, чтобы открыть его содержимое. Текстовые файлы доступны для редактирования и сохранения прямо из интерфейса.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className='flex flex-1 items-center justify-center rounded-[26px] border border-dashed border-white/10 p-8 text-center text-sm leading-6 text-[var(--muted)]'>
                                    Локальная библиотека ждёт первый аддон. После скачивания здесь появятся файлы, редактор кода и экспорт в zip.
                                </div>
                            )}
                        </div>
                    </section>
                </section>
            </div>
        </main>
    );
}

function isImageFile(filePath: string) {
    return /\.(gif|jpe?g|png|svg|webp)$/i.test(filePath);
}

function isAudioFile(filePath: string) {
    return /\.(mp3|ogg|wav)$/i.test(filePath);
}

function findFirstFile(nodes: Array<FileTreeNode>): FileTreeNode | null {
    for (const node of nodes) {
        if (node.type === 'file') {
            return node;
        }

        if (node.children?.length) {
            const childFile = findFirstFile(node.children);
            if (childFile) {
                return childFile;
            }
        }
    }

    return null;
}

function treeContainsPath(nodes: Array<FileTreeNode>, targetPath: string) {
    for (const node of nodes) {
        if (node.path === targetPath && node.type === 'file') {
            return true;
        }

        if (node.children?.length && treeContainsPath(node.children, targetPath)) {
            return true;
        }
    }

    return false;
}
