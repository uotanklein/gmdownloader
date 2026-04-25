export type Addon = {
    id: string;
    workshopId: string;
    title: string;
    previewUrl: string;
    subscriptions: number;
    favorited: number;
    createdAt: string;
    updatedAt: string;
};

export type FileTreeNode = {
    name: string;
    path: string;
    type: 'file' | 'directory';
    extension?: string;
    children?: Array<FileTreeNode>;
};

export type AddonDetailsPayload = {
    addon: Addon;
    tree: Array<FileTreeNode>;
    stats: {
        files: number;
        folders: number;
    };
};

export type AddonFilePayload = {
    path: string;
    name: string;
    extension: string;
    isText: boolean;
    content: string | null;
    size: number;
    updatedAt: string;
};
