import AdmZip from 'adm-zip';
import fsp from 'fs/promises';
import path from 'path';
import type { Addon, AddonDetailsPayload, AddonFilePayload, FileTreeNode } from '@/types/addons';

type StoredAddon = Addon & {
    sourcePath: string;
};

type TreeWalkResult = {
    nodes: Array<FileTreeNode>;
    files: number;
    folders: number;
};

const storageRoot = path.join(process.cwd(), 'storage');
const downloadsRoot = path.join(storageRoot, 'downloads');
const addonsRoot = path.join(storageRoot, 'addons');
const storePath = path.join(storageRoot, 'addons.json');

const textExtensions = new Set([
    '.cfg',
    '.css',
    '.csv',
    '.html',
    '.ini',
    '.js',
    '.json',
    '.lua',
    '.md',
    '.txt',
    '.toml',
    '.ts',
    '.tsx',
    '.vdf',
    '.vmt',
    '.vmf',
    '.xml',
    '.yaml',
    '.yml',
]);

const mimeByExtension: Record<string, string> = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.json': 'application/json; charset=utf-8',
    '.lua': 'text/plain; charset=utf-8',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.wav': 'audio/wav',
    '.webp': 'image/webp',
    '.xml': 'application/xml; charset=utf-8',
};

function normalizeRelativePath(filePath: string) {
    return filePath.split(path.sep).join('/');
}

function isStoredAddon(value: unknown): value is StoredAddon {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const addon = value as Partial<StoredAddon>;
    return (
        typeof addon.id === 'string' &&
        typeof addon.workshopId === 'string' &&
        typeof addon.title === 'string' &&
        typeof addon.previewUrl === 'string' &&
        typeof addon.subscriptions === 'number' &&
        typeof addon.favorited === 'number' &&
        typeof addon.createdAt === 'string' &&
        typeof addon.updatedAt === 'string' &&
        typeof addon.sourcePath === 'string'
    );
}

function toPublicAddon(addon: StoredAddon): Addon {
    return {
        id: addon.id,
        workshopId: addon.workshopId,
        title: addon.title,
        previewUrl: addon.previewUrl,
        subscriptions: addon.subscriptions,
        favorited: addon.favorited,
        createdAt: addon.createdAt,
        updatedAt: addon.updatedAt,
    };
}

async function pathExists(targetPath: string) {
    try {
        await fsp.access(targetPath);
        return true;
    } catch {
        return false;
    }
}

function assertWithinRoot(rootPath: string, targetPath: string) {
    const normalizedRoot = path.resolve(rootPath);
    const normalizedTarget = path.resolve(targetPath);
    const relative = path.relative(normalizedRoot, normalizedTarget);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error('Попытка обратиться к файлу вне рабочей директории аддона.');
    }
}

async function readStore() {
    await ensureWorkspace();
    const raw = await fsp.readFile(storePath, 'utf8');

    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) {
            return [] as Array<StoredAddon>;
        }

        return parsed.filter(isStoredAddon);
    } catch {
        return [] as Array<StoredAddon>;
    }
}

async function writeStore(addons: Array<StoredAddon>) {
    await fsp.writeFile(storePath, JSON.stringify(addons, null, 2), 'utf8');
}

async function getStoredAddon(addonId: string) {
    const addons = await readStore();
    return addons.find((addon) => addon.id === addonId) ?? null;
}

async function getStoredAddonOrThrow(addonId: string) {
    const addon = await getStoredAddon(addonId);

    if (!addon) {
        throw new Error('Аддон не найден в локальном хранилище.');
    }

    if (!(await pathExists(addon.sourcePath))) {
        throw new Error('Файлы аддона отсутствуют на диске. Попробуйте скачать его заново.');
    }

    return addon;
}

function resolveAddonFilePath(addon: StoredAddon, relativePath: string) {
    const normalizedRelativePath = relativePath.replaceAll('\\', '/').replace(/^\/+/, '');

    if (!normalizedRelativePath) {
        throw new Error('Путь к файлу не может быть пустым.');
    }

    const absolutePath = path.resolve(addon.sourcePath, normalizedRelativePath);
    assertWithinRoot(addon.sourcePath, absolutePath);
    return absolutePath;
}

function detectTextFile(extension: string, buffer: Buffer) {
    if (textExtensions.has(extension)) {
        return true;
    }

    const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
    let suspiciousBytes = 0;

    for (const byte of sample) {
        if (byte === 0) {
            return false;
        }

        const isControlCharacter = byte < 7 || (byte > 13 && byte < 32);
        if (isControlCharacter) {
            suspiciousBytes += 1;
        }
    }

    return suspiciousBytes / Math.max(sample.length, 1) < 0.02;
}

async function walkDirectory(currentPath: string, rootPath: string): Promise<TreeWalkResult> {
    const entries = await fsp.readdir(currentPath, { withFileTypes: true });
    const sortedEntries = [...entries].sort((left, right) => {
        if (left.isDirectory() && !right.isDirectory()) {
            return -1;
        }

        if (!left.isDirectory() && right.isDirectory()) {
            return 1;
        }

        return left.name.localeCompare(right.name, 'ru');
    });

    const nodes: Array<FileTreeNode> = [];
    let files = 0;
    let folders = 0;

    for (const entry of sortedEntries) {
        const absolutePath = path.join(currentPath, entry.name);
        const relativePath = normalizeRelativePath(path.relative(rootPath, absolutePath));

        if (entry.isDirectory()) {
            const child = await walkDirectory(absolutePath, rootPath);
            nodes.push({
                name: entry.name,
                path: relativePath,
                type: 'directory',
                children: child.nodes,
            });
            files += child.files;
            folders += child.folders + 1;
            continue;
        }

        files += 1;
        nodes.push({
            name: entry.name,
            path: relativePath,
            type: 'file',
            extension: path.extname(entry.name).replace(/^\./, '').toLowerCase(),
        });
    }

    return { nodes, files, folders };
}

function sanitizeFileName(name: string) {
    return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim() || 'addon';
}

export async function ensureWorkspace() {
    await fsp.mkdir(downloadsRoot, { recursive: true });
    await fsp.mkdir(addonsRoot, { recursive: true });

    if (!(await pathExists(storePath))) {
        await fsp.writeFile(storePath, '[]', 'utf8');
    }
}

export async function listAddons() {
    const addons = await readStore();
    return addons.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).map(toPublicAddon);
}

export function getAddonDownloadDirectory(addonId: string) {
    return path.join(downloadsRoot, addonId);
}

export function getAddonSourceDirectory(addonId: string) {
    return path.join(addonsRoot, addonId);
}

export async function saveAddon(addon: StoredAddon) {
    const addons = await readStore();
    const index = addons.findIndex((entry) => entry.id === addon.id);

    if (index === -1) {
        addons.push(addon);
    } else {
        addons[index] = addon;
    }

    await writeStore(addons);
    return toPublicAddon(addon);
}

export async function getAddonDetails(addonId: string): Promise<AddonDetailsPayload> {
    const addon = await getStoredAddonOrThrow(addonId);
    const tree = await walkDirectory(addon.sourcePath, addon.sourcePath);

    return {
        addon: toPublicAddon(addon),
        tree: tree.nodes,
        stats: {
            files: tree.files,
            folders: tree.folders,
        },
    };
}

export async function readAddonFile(addonId: string, relativePath: string): Promise<AddonFilePayload> {
    const addon = await getStoredAddonOrThrow(addonId);
    const absolutePath = resolveAddonFilePath(addon, relativePath);
    const stats = await fsp.stat(absolutePath);

    if (!stats.isFile()) {
        throw new Error('Указанный путь не является файлом.');
    }

    const buffer = await fsp.readFile(absolutePath);
    const extension = path.extname(absolutePath).toLowerCase();
    const isText = detectTextFile(extension, buffer);

    return {
        path: normalizeRelativePath(relativePath),
        name: path.basename(absolutePath),
        extension: extension.replace(/^\./, ''),
        isText,
        content: isText ? buffer.toString('utf8') : null,
        size: stats.size,
        updatedAt: stats.mtime.toISOString(),
    };
}

export async function readAddonFileRaw(addonId: string, relativePath: string) {
    const addon = await getStoredAddonOrThrow(addonId);
    const absolutePath = resolveAddonFilePath(addon, relativePath);
    const extension = path.extname(absolutePath).toLowerCase();
    const buffer = await fsp.readFile(absolutePath);

    return {
        buffer,
        fileName: path.basename(absolutePath),
        mimeType: mimeByExtension[extension] ?? 'application/octet-stream',
    };
}

export async function writeAddonFile(addonId: string, relativePath: string, content: string): Promise<AddonFilePayload> {
    const addon = await getStoredAddonOrThrow(addonId);
    const absolutePath = resolveAddonFilePath(addon, relativePath);
    const currentFile = await readAddonFile(addonId, relativePath);

    if (!currentFile.isText) {
        throw new Error('Бинарные файлы нельзя редактировать во встроенном редакторе.');
    }

    await fsp.writeFile(absolutePath, content, 'utf8');

    const updatedAddon: StoredAddon = {
        ...addon,
        updatedAt: new Date().toISOString(),
    };
    await saveAddon(updatedAddon);

    return readAddonFile(addonId, relativePath);
}

export async function createAddonArchive(addonId: string) {
    const addon = await getStoredAddonOrThrow(addonId);
    const zip = new AdmZip();
    const archiveRoot = sanitizeFileName(`${addon.title}-${addon.workshopId}`);

    zip.addLocalFolder(addon.sourcePath, archiveRoot);

    return {
        buffer: zip.toBuffer(),
        fileName: `${archiveRoot}.zip`,
    };
}

export async function removeAddon(addonId: string) {
    const addon = await getStoredAddonOrThrow(addonId);
    const addons = await readStore();

    assertWithinRoot(addonsRoot, addon.sourcePath);
    await fsp.rm(addon.sourcePath, { recursive: true, force: true });

    const downloadDirectory = getAddonDownloadDirectory(addonId);
    assertWithinRoot(storageRoot, downloadDirectory);
    await fsp.rm(downloadDirectory, { recursive: true, force: true });

    await writeStore(addons.filter((entry) => entry.id !== addonId));
}
