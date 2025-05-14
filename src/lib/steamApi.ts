'use server';

import axios from 'axios';
import fsp from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';
import * as dbApi from '@/lib/db';

export const search = async (addon_id: number) => {
    try {
        const params = new URLSearchParams();
        params.append('itemcount', '1');
        params.append('publishedfileids[0]', addon_id.toString());

        const response = await axios.post('https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const details = response.data?.response?.publishedfiledetails?.[0];

        if (!details) {
            throw new Error('Steam API returned invalid data');
        }

        const { title, preview_url, subscriptions, favorited, creator_app_id } = details;
        return { title, preview_url, subscriptions, favorited, creator_app_id };
    } catch (err) {
        console.log('Steam API error:', err);
        throw err;
    }
};

const app_id = 4000;
const output_dir = 'src/data';
const output_source_dir = 'src/data/source';
const gmad_exe = 'src/bin/gmad.exe';
const scmd_exe = 'src/bin/steamcmd.exe';

class AddonDownloader {
    id?: number;
    user_id: number;
    addon_id: number;
    gma_path?: string;
    source_path?: string;

    constructor(user_id: number, addon_id: number, gma_path?: string, source_path?: string, id?: number) {
        this.id = id;
        this.user_id = user_id;
        this.addon_id = addon_id;
        this.gma_path = gma_path;
        this.source_path = source_path;
    }

    async download() {
        const download_dir = path.join(output_dir, this.user_id.toString());
        await fsp.mkdir(download_dir, { recursive: true });
        const commands = ['+force_install_dir', path.resolve(download_dir), '+login', 'anonymous', '+workshop_download_item', app_id.toString(), this.addon_id.toString(), '+quit'];

        return new Promise<void>((resolve, reject) => {
            const scmd = spawn(scmd_exe, commands);

            scmd.stdout.on('data', (data) => {
                console.log(`[steamcmd stdout]: ${data}`);
            });

            scmd.stderr.on('data', (data) => {
                console.log(`[steamcmd stderr]: ${data}`);
            });

            scmd.on('close', async (code) => {
                if (code === 0) {
                    try {
                        const gmaPath = path.join(output_dir, this.user_id.toString(), 'steamapps', 'workshop', 'content', app_id.toString(), this.addon_id.toString());
                        const files = (await fsp.readdir(gmaPath)).filter((file_name) => path.extname(file_name) === '.gma');
                        const firstFile = files[0];

                        if (firstFile) {
                            this.gma_path = path.join(gmaPath, firstFile);
                            resolve();
                        } else {
                            reject(new Error(`Не удалось найти gma файл по пути ${gmaPath}`));
                        }
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    reject(new Error(`steamcmd exited with code ${code}`));
                }
            });

            scmd.on('error', (err) => {
                reject(err);
            });
        });
    }

    async decompile() {
        if (!this.gma_path) return;

        const outputPath = path.join(output_source_dir, this.user_id.toString(), path.basename(this.gma_path, path.extname(this.gma_path)));
        const args = ['extract', '-file', path.resolve(this.gma_path), '-out', path.resolve(outputPath)];

        return new Promise<void>((resolve, reject) => {
            const process = spawn(gmad_exe, args);

            process.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
            });

            process.stderr.on('data', (data) => {
                console.log(`stderr: ${data}`);
            });

            process.on('close', async (code) => {
                try {
                    await this.remove_gma();
                    if (code === 0) {
                        this.source_path = outputPath;
                        try {
                            await this.save();
                        } catch (err) {
                            try {
                                await this.remove_source();
                                reject(err);
                            } catch (err2) {
                                reject(new Error(`Ошибка 1: ${err}, Ошибка 2: ${err2}`));
                            }
                        }
                        resolve();
                    } else {
                        reject(new Error(`${code}: Не удалось декомпилировать .gma файл`));
                    }
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    async do() {
        try {
            await this.download();
            await this.decompile();
        } catch (err) {
            throw err;
        }
    }

    async save() {
        if (!this.id && this.source_path) {
            try {
                this.id = await dbApi.save_addon(this.user_id, this.addon_id, this.source_path);
            } catch (err) {
                throw err;
            }
        }
    }

    async remove_gma() {
        if (this.gma_path) {
            try {
                await fsp.rm(this.gma_path, { recursive: true });
            } catch (err) {
                throw err;
            }
        }
    }

    async remove_source() {
        if (this.source_path) {
            try {
                await fsp.rm(this.source_path, { recursive: true });
            } catch (err) {
                throw err;
            }
        }
    }
}

export const get_addon_downloader = async (user_id: number, addon_id: number) => new AddonDownloader(user_id, addon_id);
