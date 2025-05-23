import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import { DIR_TYPE, FILE_TYPE, GRAPHQL_URL } from "@/constants";
import { PerliteVault, PerliteVaultDir, Directory, File } from "@shared/data";

export const queryByAddressAndType = graphql(`
    query ($address: SuiAddress!, $type: String!, $cursor: String) {
        address(address: $address) {
            objects(filter: { type: $type }, first: 50, after: $cursor) {
                edges {
                    node {
                        contents {
                            json
                        }
                    }
                }
                pageInfo {
                    hasNextPage
                    endCursor
                }
            }
        }
    }
`);
export async function getPerliteVaultByIdAndAddress(
    id: string,
    address: string,
): Promise<PerliteVault | undefined> {
    let allVaults = await getAllPerliteVaultByAddress(address);
    if (allVaults.length == 0) {
        return undefined;
    }
    // 3. 构建根目录（假设只有一个根目录）
    const vault = allVaults.find((d) => d.id == id)!;
    if (vault) {
        return vault;
    } else {
        return undefined;
    }
}
export async function getAllPerliteVaultByAddress(
    address: string,
): Promise<Array<PerliteVault>> {
    let result: Array<PerliteVault> = [];

    let dirs = await getUserOwnDirectory(address, GRAPHQL_URL);
    if (dirs.length == 0) {
        return result;
    }
    let files = await getUserOwnFile(address, GRAPHQL_URL);
    const dirMap = new Map<string, Directory>();
    const parentMap = new Map<string, Directory[]>();
    const fileMap = new Map<string, File[]>();
    // 处理目录
    dirs.forEach((dir) => {
        dirMap.set(dir.id, dir);

        if (!parentMap.has(dir.parent)) {
            parentMap.set(dir.parent, []);
        }
        parentMap.get(dir.parent)!.push(dir);
    });

    // 处理文件
    files.forEach((file) => {
        if (!fileMap.has(file.belong_dir)) {
            fileMap.set(file.belong_dir, []);
        }
        fileMap.get(file.belong_dir)!.push(file);
    });
    // 2. 递归构建目录结构
    const buildDirectory = (dirId: string): PerliteVaultDir => {
        const dir = dirMap.get(dirId)!;

        // 获取子目录（已排序）
        const childDirs = (parentMap.get(dirId) || [])
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((d) => buildDirectory(d.id));

        // 获取文件（已排序）
        const files = (fileMap.get(dirId) || []).sort((a, b) =>
            a.title.localeCompare(b.title),
        );

        return {
            ...dir,
            directories: childDirs,
            files,
        };
    };
    dirs.forEach((d) => {
        if (d.is_root) {
            const dir = buildDirectory(d.id);
            if (dir) {
                result.push({
                    id: dir.id, // 保险库自身ID
                    name: dir.name,
                    directories: dir.directories,
                    files: dir.files, // 根目录层级的文件（如果有需要可以添加对应逻辑）
                    created_at: d.created_at,
                    updated_at: d.updated_at,
                });
            }
        }
    });

    return result;
}
export async function getPerliteVaultByAddress(
    address: string,
    vaultName: string,
): Promise<PerliteVault | undefined> {
    let allVaults = await getAllPerliteVaultByAddress(address);
    if (allVaults.length == 0) {
        return undefined;
    }
    // 3. 构建根目录（假设只有一个根目录）
    const vault = allVaults.find((d) => d.name == vaultName)!;
    if (vault) {
        return vault;
    } else {
        return undefined;
    }
}
async function getUserOwnDirectory(
    address: string,
    graphqlUrl: string,
): Promise<Array<Directory>> {
    const suiGraphQLClient = new SuiGraphQLClient({ url: graphqlUrl });
    const type = DIR_TYPE;

    let endCursor: string | null | undefined = null;
    const result: Directory[] = [];

    const parseDirData = (data: any) => {
        return (
            data?.address?.objects?.edges.map((edge: any) => {
                const json = edge.node.contents?.json;
                console.log("json", json);
                return {
                    id: json.id,
                    name: json.name,
                    parent: json.parent,
                    is_root: json.is_root,
                    created_at: new Date(parseInt(json.created_at)),
                    updated_at: new Date(parseInt(json.updated_at)),
                } as Directory;
            }) || []
        );
    };

    let hasNextPage = false;
    do {
        const currentPage: any = await suiGraphQLClient.query({
            query: queryByAddressAndType,
            variables: { address, type, cursor: endCursor },
        });
        result.push(...parseDirData(currentPage.data));

        endCursor = currentPage.data?.address?.objects?.pageInfo?.endCursor;
        hasNextPage = currentPage.data?.address?.objects?.pageInfo?.hasNextPage;
    } while (hasNextPage);
    return result;
}

async function getUserOwnFile(
    address: string,
    graphqlUrl: string,
): Promise<Array<File>> {
    const suiGraphQLClient = new SuiGraphQLClient({ url: graphqlUrl });
    const type = FILE_TYPE;
    let endCursor: string | null | undefined = null;
    const result: File[] = [];

    const parseFileData = (data: any) => {
        return (
            data?.address?.objects?.edges.map((edge: any) => {
                const json = edge.node.contents?.json;
                return {
                    id: json.id,
                    title: json.title,
                    belong_dir: json.belong_dir,
                    blob_id: json.blob_id,
                    end_epoch: json.end_epoch,
                    created_at: new Date(json.created_at),
                    updated_at: new Date(json.updated_at),
                } as File;
            }) || []
        );
    };
    let hasNextPage = false;
    do {
        const currentPage: any = await suiGraphQLClient.query({
            query: queryByAddressAndType,
            variables: { address, type, cursor: endCursor },
        });

        result.push(...parseFileData(currentPage.data));

        endCursor = currentPage.data?.address?.objects?.pageInfo?.endCursor;
        hasNextPage = currentPage.data?.address?.objects?.pageInfo?.hasNextPage;
    } while (hasNextPage);

    return result;
}

