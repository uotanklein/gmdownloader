import fsp from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { ensureWorkspace, getAddonDownloadDirectory, getAddonSourceDirectory, saveAddon } from '@/lib/addonStore';
import { extractWorkshopId, fetchWorkshopDetails } from '@/lib/workshop';

const appId = '4000';
const steamcmdPath = path.join(process.cwd(), 'src', 'bin', 'steamcmd.exe');
const gmadPath = path.join(process.cwd(), 'src', 'bin', 'gmad.exe');

async function pathExists(targetPath: string) {
    try {
        await fsp.access(targetPath);
        return true;
    } catch {
        return false;
    }
}

async function ensureExecutable(targetPath: string, toolName: string) {
    if (!(await pathExists(targetPath))) {
        throw new Error(`Не найден ${toolName}: ${targetPath}`);
    }
}

async function collectDirectoryFiles(targetPath: string): Promise<Array<string>> {
    const entries = await fsp.readdir(targetPath, { withFileTypes: true });
    const files: Array<string> = [];

    for (const entry of entries) {
        const entryPath = path.join(targetPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await collectDirectoryFiles(entryPath)));
            continue;
        }

        files.push(entryPath);
    }

    return files;
}

async function findDownloadedGma(downloadDirectory: string, workshopId: string) {
    const workshopDirectory = path.join(downloadDirectory, 'steamapps', 'workshop', 'content', appId, workshopId);

    if (!(await pathExists(workshopDirectory))) {
        throw new Error('steamcmd завершился, но папка с загруженным аддоном не найдена.');
    }

    const files = await collectDirectoryFiles(workshopDirectory);
    const gmaFile = files.find((filePath) => path.extname(filePath).toLowerCase() === '.gma');

    if (!gmaFile) {
        throw new Error('Не удалось найти .gma файл после загрузки из Steam Workshop.');
    }

    return gmaFile;
}

function runProcess(executablePath: string, args: Array<string>, label: string) {
    return new Promise<void>((resolve, reject) => {
        const processRef = spawn(executablePath, args, {
            cwd: process.cwd(),
            windowsHide: true,
        });

        const output: Array<string> = [];

        processRef.stdout.on('data', (chunk) => {
            output.push(String(chunk));
        });

        processRef.stderr.on('data', (chunk) => {
            output.push(String(chunk));
        });

        processRef.on('error', (error) => {
            reject(error);
        });

        processRef.on('close', (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            const tail = output.join('').trim().slice(-1200);
            reject(new Error(`${label} завершился с кодом ${code}.${tail ? `\n\n${tail}` : ''}`));
        });
    });
}

export async function importAddon(query: string) {
    const workshopId = extractWorkshopId(query);

    if (!workshopId) {
        throw new Error('Не удалось извлечь ID из введённой ссылки.');
    }

    await ensureWorkspace();
    await ensureExecutable(steamcmdPath, 'steamcmd.exe');
    await ensureExecutable(gmadPath, 'gmad.exe');

    const details = await fetchWorkshopDetails(workshopId);
    const sourceDirectory = getAddonSourceDirectory(workshopId);

    if (!(await pathExists(sourceDirectory))) {
        const downloadDirectory = getAddonDownloadDirectory(workshopId);

        await fsp.rm(downloadDirectory, { recursive: true, force: true });
        await fsp.rm(sourceDirectory, { recursive: true, force: true });
        await fsp.mkdir(downloadDirectory, { recursive: true });

        try {
            await runProcess(
                steamcmdPath,
                ['+force_install_dir', path.resolve(downloadDirectory), '+login', 'anonymous', '+workshop_download_item', appId, workshopId, '+quit'],
                'steamcmd',
            );

            const gmaFilePath = await findDownloadedGma(downloadDirectory, workshopId);
            await fsp.mkdir(sourceDirectory, { recursive: true });

            await runProcess(gmadPath, ['extract', '-file', path.resolve(gmaFilePath), '-out', path.resolve(sourceDirectory)], 'gmad');
        } catch (error) {
            await fsp.rm(sourceDirectory, { recursive: true, force: true });
            throw error;
        } finally {
            await fsp.rm(downloadDirectory, { recursive: true, force: true });
        }
    }

    const timestamp = new Date().toISOString();

    return saveAddon({
        id: workshopId,
        workshopId,
        title: details.title,
        previewUrl: details.previewUrl,
        subscriptions: details.subscriptions,
        favorited: details.favorited,
        createdAt: timestamp,
        updatedAt: timestamp,
        sourcePath: sourceDirectory,
    });
}
