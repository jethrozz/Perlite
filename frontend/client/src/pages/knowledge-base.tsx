import React, { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "wouter";
import { Button } from "@/components/ui/button";
import { CyberpunkDivider } from "@/components/cyberpunk-divider";
import { PerliteVault, PerliteVaultDir, File } from "@shared/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Database,
  FolderOpen,
  Folder,
  FileText,
  Calendar,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { getPerliteVaultByIdAndAddress } from "@/contract/perlite_server";
interface FileTreeItemProps {
  item: PerliteVaultDir | File;
  level: number;
  onFileSelect?: (file: File) => void;
  searchTerm?: string;
}

interface ExpandedState {
  [key: string]: boolean;
}

// 文件树项组件
const FileTreeItem: React.FC<FileTreeItemProps> = ({
  item,
  level,
  onFileSelect,
  searchTerm,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDirectory = "directories" in item;
  const isFile = "blob_id" in item;

  // 搜索高亮逻辑
  const itemName = isDirectory
    ? (item as PerliteVaultDir).name
    : (item as File).title;
  const matchesSearch = searchTerm
    ? itemName.toLowerCase().includes(searchTerm.toLowerCase())
    : true;

  if (!matchesSearch && isFile) return null;

  const handleClick = () => {
    if (isDirectory) {
      setIsExpanded(!isExpanded);
    } else if (isFile && onFileSelect) {
      onFileSelect(item as File);
    }
  };

  const paddingLeft = level * 24;

  return (
    <div className={cn("select-none", !matchesSearch && "opacity-50")}>
      <div
        className={cn(
          "flex items-center py-2 px-3 hover:bg-cyber-dark/30 cursor-pointer rounded transition-all group",
          "border-l-2 border-transparent hover:border-cyber-purple",
          isFile && "hover:bg-cyber-purple/10",
        )}
        style={{ paddingLeft: `${paddingLeft + 12}px` }}
        onClick={handleClick}
      >
        {isDirectory && (
          <div className="mr-2 text-cyber-purple">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
        )}

        <div className="mr-3 text-cyber-cyan">
          {isDirectory ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4" />
            ) : (
              <Folder className="w-4 h-4" />
            )
          ) : (
            <FileText className="w-4 h-4" />
          )}
        </div>

        <span
          className={cn(
            "text-cyber-text group-hover:text-cyber-cyan transition-colors font-mono",
            searchTerm && matchesSearch && "text-cyber-purple font-semibold",
          )}
        >
          {itemName}
        </span>

        {isFile && (
          <div className="ml-auto text-xs text-cyber-text/60 opacity-0 group-hover:opacity-100 transition-opacity">
            File
          </div>
        )}
      </div>

      {isDirectory && isExpanded && (
        <div className="ml-4">
          {/* 渲染子目录 */}
          {(item as PerliteVaultDir).directories?.map((dir) => (
            <FileTreeItem
              key={dir.id}
              item={dir}
              level={level + 1}
              onFileSelect={onFileSelect}
              searchTerm={searchTerm}
            />
          ))}

          {/* 渲染文件 */}
          {(item as PerliteVaultDir).files?.map((file) => (
            <FileTreeItem
              key={file.id}
              item={file}
              level={level + 1}
              onFileSelect={onFileSelect}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function KnowledgeBase() {
  const [location, setLocation] = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<ExpandedState>({});
  const [knowledgeBase, setKnowledgeBase] = useState<PerliteVault | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(true);
  const currentAccount = useCurrentAccount();

  // 从URL获取知识库ID
  const kbId = searchParams.get("kb");
  console.log("params", searchParams);
  console.log("kbId", kbId);
  useEffect(() => {
    const fetchVaults = async () => {
      if (currentAccount && kbId) {
        let vaults = await getPerliteVaultByIdAndAddress(
          kbId,
          currentAccount.address,
        );
        console.log("vaults", vaults);
        setKnowledgeBase(vaults);
        setIsLoading(false);
      }
    };
    fetchVaults();
  }, [currentAccount, kbId, setKnowledgeBase, setIsLoading]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleBack = () => {
    setLocation("/my-knowledge-base");
  };

  const getTotalFiles = (vault: PerliteVault): number => {
    let count = vault.files.length;

    const countInDirectory = (dir: PerliteVaultDir): number => {
      let dirCount = dir.files.length;
      dir.directories.forEach((subDir) => {
        dirCount += countInDirectory(subDir);
      });
      return dirCount;
    };

    vault.directories.forEach((dir) => {
      count += countInDirectory(dir);
    });

    return count;
  };

  const getTotalDirectories = (vault: PerliteVault): number => {
    let count = vault.directories.length;

    const countInDirectory = (dir: PerliteVaultDir): number => {
      let dirCount = dir.directories.length;
      dir.directories.forEach((subDir) => {
        dirCount += countInDirectory(subDir);
      });
      return dirCount;
    };

    vault.directories.forEach((dir) => {
      count += countInDirectory(dir);
    });

    return count;
  };

  return (
    <div className="w-full px-6 py-8 pt-24 min-h-screen">
      {/* Header */}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="cyber-border bg-cyber-surface rounded-lg overflow-hidden h-48 animate-pulse"
            >
              <div className="p-6">
                <div className="h-6 bg-cyber-dark rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-cyber-dark rounded w-full mb-4"></div>
                <div className="h-4 bg-cyber-dark rounded w-1/2 mb-6"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-cyber-dark rounded w-20"></div>
                  <div className="h-8 bg-cyber-dark rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="font-rajdhani font-bold text-3xl md:text-4xl text-cyber-text">
              <span className="text-cyber-purple">#</span> {knowledgeBase.name}
            </h1>
          </div>

          <CyberpunkDivider className="mb-8" />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="cyber-border bg-cyber-surface">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Database className="w-8 h-8 text-cyber-purple mr-3" />
                  <div>
                    <p className="text-cyber-text text-sm opacity-70">
                      Total Files
                    </p>
                    <p className="text-cyber-cyan text-2xl font-bold">
                      {getTotalFiles(knowledgeBase)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-border bg-cyber-surface">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <FolderOpen className="w-8 h-8 text-cyber-cyan mr-3" />
                  <div>
                    <p className="text-cyber-text text-sm opacity-70">
                      Directories
                    </p>
                    <p className="text-cyber-purple text-2xl font-bold">
                      {getTotalDirectories(knowledgeBase)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-border bg-cyber-surface">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-green-400 mr-3" />
                  <div>
                    <p className="text-cyber-text text-sm opacity-70">
                      Last Updated
                    </p>
                    <p className="text-green-400 text-lg font-mono">
                      {formatDate(knowledgeBase.updated_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* File Tree */}
            <div className="lg:col-span-3">
              <Card className="cyber-border bg-cyber-surface">
                <CardHeader>
                  <CardTitle className="text-cyber-cyan flex items-center justify-between">
                    <div className="flex items-center">
                      <Database className="w-5 h-5 mr-2" />
                      File Explorer
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="min-h-[400px] max-h-[calc(100vh-280px)] overflow-y-auto cyber-scrollbar">
                    {/* Root Files */}
                    {knowledgeBase.files.map((file) => (
                      <FileTreeItem
                        key={file.id}
                        item={file}
                        level={0}
                        onFileSelect={handleFileSelect}
                        searchTerm={searchTerm}
                      />
                    ))}

                    {/* Root Directories */}
                    {knowledgeBase.directories.map((dir) => (
                      <FileTreeItem
                        key={dir.id}
                        item={dir}
                        level={0}
                        onFileSelect={handleFileSelect}
                        searchTerm={searchTerm}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
