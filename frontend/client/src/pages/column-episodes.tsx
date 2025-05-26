import React, { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CyberpunkDivider } from "@/components/cyberpunk-divider";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Plus,
  ArrowLeft,
  FileText,
  Hash,
  FolderOpen,
} from "lucide-react";
import {
  PerliteVault,
  PerliteVaultDir,
  Directory,
  File,
  Installment,
} from "@shared/data";
import { getAllPerliteVaultByAddress } from "@/contract/perlite_server";
import { getUserOwnedInstallments } from "@/contract/perlite_column";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "@/networkConfig";

export default function ColumnEpisodes() {
  const chain = useNetworkVariable("chain");
  const packageId = useNetworkVariable("packageId");
  const globalConfigId = useNetworkVariable("globalConfigId");
  const [match, params] = useRoute("/creator/column/episodes/:id/:cap_id");
  const [subscribeMatch, subscribeParams] = useRoute(
    "/sub/col/e/:id/:subId/:payId",
  );
  console.log("match:", match);
  console.log("sub match:", subscribeMatch);
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const { toast } = useToast();
  const [episodes, setEpisodes] = useState<Installment[]>([]);
  const [markdownFiles, setMarkdownFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] =
    useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [vaults, setVaults] = useState<PerliteVault[]>([]);

  const columnId = match ? params?.id : subscribeParams?.id;
  const capId = params?.cap_id;

  const subId = subscribeParams?.subId;
  const payId = subscribeParams?.payId;
  // 加载页面数据
  useEffect(() => {
    if (columnId) {
      loadEpisodes(columnId);
    }

    // 加载知识库列表
    const fetchVaults = async () => {
      if (currentAccount) {
        let vaults = await getAllPerliteVaultByAddress(currentAccount.address);
        setVaults(vaults);
      }
    };
    fetchVaults();
  }, [currentAccount, columnId, setVaults]);

  // 加载专栏期数
  const loadEpisodes = async (colId: string) => {
    try {
      setIsLoading(true);
      // 这里应该调用API获取真实数据
      // 暂时使用模拟数据
      const mockEpisodes: Installment[] = await getUserOwnedInstallments(colId);
      mockEpisodes.reverse();
      setEpisodes(mockEpisodes);
    } catch (error) {
      console.error("Error loading episodes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 根据选择的知识库加载markdown文件
  const loadMarkdownFiles = async (kbId: string) => {
    try {
      let vault = vaults.find((vault) => vault.id === kbId);
      let files = new Array<File>();
      if (vault) {
        files.push(...vault.files);
        let waitScanDirs = new Array<PerliteVaultDir>();
        waitScanDirs.push(...vault.directories);

        while (waitScanDirs.length > 0) {
          let dir = waitScanDirs.pop();
          if (dir) {
            waitScanDirs.push(...dir.directories);
            files.push(...dir.files);
          }
        }
      }
      setMarkdownFiles(files);
    } catch (error) {
      console.error("Error loading markdown files:", error);
    }
  };

  // 处理知识库选择
  const handleKnowledgeBaseChange = (value: string) => {
    setSelectedKnowledgeBase(value);
    setSelectedFiles([]);
    if (value) {
      loadMarkdownFiles(value);
    } else {
      setMarkdownFiles([]);
    }
  };

  // 处理文件选择
  const handleFileToggle = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  // 创建新期数
  const handleCreateEpisode = async () => {
    if (!currentAccount) {
      toast({
        title: "Error",
        description: "Please Connected Your Wallet",
        variant: "destructive",
      });
      return;
    }

    if (!columnId || !capId) {
      console.log("no column id ");
      return;
    }
    if (!selectedKnowledgeBase) {
      toast({
        title: "Error",
        description: "Please select a knowledge base",
        variant: "destructive",
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one markdown file",
        variant: "destructive",
      });
      return;
    }

    try {
      // 这里应该调用API创建新期数
      const tx = new Transaction();
      tx.setSender(currentAccount.address);
      tx.moveCall({
        target: `${packageId}::perlite_market::add_installment`,
        arguments: [
          tx.object(capId), //column_cap
          tx.object(columnId), //column
          tx.object(selectedFiles[0]), //file
          tx.object("0x6"), //clock
          tx.object(globalConfigId), //global_config
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx, chain: chain },
        {
          onSuccess: (result) => {
            // 成功时打印结果
            alert("New episode created successfully! digest:" + result.digest);
            setShowCreateModal(false);
            setSelectedKnowledgeBase("");
            setSelectedFiles([]);
            setMarkdownFiles([]);
            //刷新当前页面
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          },
          onError: (error) => {
            alert("Transaction successful: " + JSON.stringify(error));
            console.error("Transaction failed:", error);
            setShowCreateModal(false);
            setSelectedKnowledgeBase("");
            setSelectedFiles([]);
            setMarkdownFiles([]);
          },
        },
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create episode",
        variant: "destructive",
      });
    }
  };
  //
  const getHref = (episodeId: string) => {
    if (match) {
      return `/creator/columns/${columnId}/${capId}/episodes/${episodeId}`;
    } else {
      return `/sub/col/${columnId}/${subId}/${payId}/e/${episodeId}`;
    }
  };
  return (
    <div className="min-h-screen bg-cyber-dark text-cyber-text p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/creator/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="text-cyber-cyan hover:bg-cyber-dark"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="font-rajdhani text-3xl font-bold text-cyber-cyan">
            Column Episodes Management
          </h1>
        </div>

        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="bg-cyber-purple hover:bg-cyber-purple/80 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Create New Episode
            </Button>
          </DialogTrigger>
          <DialogContent
            className="cyber-border bg-cyber-surface p-6"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 9999,
              width: "90vw",
              maxWidth: "42rem",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 0 30px rgba(138, 43, 226, 0.5)",
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-cyber-cyan font-rajdhani text-2xl">
                Create New Episode
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* 选择知识库 */}
              <div className="space-y-2">
                <label className="text-cyber-text font-medium">
                  Select Knowledge Base *
                </label>
                <Select
                  value={selectedKnowledgeBase}
                  onValueChange={handleKnowledgeBaseChange}
                >
                  <SelectTrigger className="cyber-border bg-cyber-dark text-cyber-text">
                    <SelectValue placeholder="Choose a knowledge base" />
                  </SelectTrigger>
                  <SelectContent className="cyber-border bg-cyber-surface border-cyber-purple z-[9999]">
                    {vaults.map((kb) => (
                      <SelectItem key={kb.id} value={kb.id.toString()}>
                        <div className="flex items-center">
                          <FolderOpen className="mr-2 h-4 w-4 text-cyber-purple" />
                          {kb.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <CyberpunkDivider />

              {/* 选择markdown文件 */}
              {selectedKnowledgeBase && (
                <div className="space-y-4">
                  <label className="text-cyber-text font-medium">
                    Select Markdown Files *
                  </label>
                  <div className="max-h-60 overflow-y-auto cyber-scrollbar">
                    {markdownFiles.length === 0 ? (
                      <p className="text-cyber-text/60 text-center py-8">
                        No markdown files found in this knowledge base
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {markdownFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center space-x-3 p-3 rounded-lg border border-cyber-dark hover:border-cyber-purple transition-colors"
                          >
                            <Checkbox
                              id={`file-${file.id}`}
                              checked={selectedFiles.includes(
                                file.id.toString(),
                              )}
                              onCheckedChange={() =>
                                handleFileToggle(file.id.toString())
                              }
                              className="border-cyber-purple"
                            />
                            <label
                              htmlFor={`file-${file.id}`}
                              className="flex items-center cursor-pointer flex-1"
                            >
                              <FileText className="mr-2 h-4 w-4 text-cyber-cyan" />
                              <span className="text-cyber-text">
                                {file.title}
                              </span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedFiles.length > 0 && (
                    <p className="text-cyber-purple text-sm">
                      {selectedFiles.length} file(s) selected
                    </p>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedKnowledgeBase("");
                    setSelectedFiles([]);
                    setMarkdownFiles([]);
                  }}
                  className="border-cyber-text text-cyber-text hover:bg-cyber-dark"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateEpisode}
                  className="bg-cyber-purple hover:bg-cyber-purple/80 text-white"
                  disabled={
                    !selectedKnowledgeBase || selectedFiles.length === 0
                  }
                >
                  Create Episode
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <CyberpunkDivider className="mb-8" />

      {/* Episodes Grid */}
      <Card className="cyber-border bg-cyber-surface">
        <CardHeader>
          <CardTitle className="text-cyber-cyan flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Episodes Management
            </div>
            <span className="text-sm font-normal text-cyber-text opacity-70">
              {episodes.length} total episodes
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyber-purple mx-auto mb-6"></div>
              <p className="text-cyber-text text-lg">Loading episodes...</p>
            </div>
          ) : episodes.length === 0 ? (
            <div className="text-center py-16">
              <Hash className="h-20 w-20 text-cyber-purple mx-auto mb-6 opacity-50" />
              <h3 className="font-rajdhani text-2xl text-cyber-text mb-4">
                No Episodes Yet
              </h3>
              <p className="text-cyber-text opacity-70 mb-8 max-w-md mx-auto">
                Create your first episode by selecting markdown files from your
                knowledge base
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-cyber-purple hover:bg-cyber-purple/80 text-white font-rajdhani text-lg px-8 py-3"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create First Episode
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {episodes.map((episode) => (
                <Link key={episode.id} href={getHref(episode.id)}>
                  <div className="cyber-border bg-cyber-dark rounded-lg p-6 hover:border-cyber-purple transition-colors group cursor-pointer transform hover:scale-105">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-cyber-purple/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-cyber-purple/30 transition-colors">
                        <h2>#{episode.no}</h2>
                      </div>

                      <h3 className="font-rajdhani text-xl font-bold text-cyber-cyan mb-2 group-hover:text-cyber-purple transition-colors">
                        Episode {episode.no}
                      </h3>

                      <div className="flex items-center justify-center space-x-2 text-cyber-text/80 mb-4">
                        <FileText className="h-4 w-4" />
                        <span>{episode.files.length} files</span>
                      </div>

                      <div className="text-cyber-text/60 text-xs">
                        Created {}
                      </div>

                      <div className="mt-4 text-cyber-cyan text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to view content →
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
