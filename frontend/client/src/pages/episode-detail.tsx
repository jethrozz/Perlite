import React, { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CyberpunkDivider } from "@/components/cyberpunk-divider";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { ArrowLeft, FileText, Hash, Calendar, Clock, Eye } from "lucide-react";
import { getOneInstallment } from "@/contract/perlite_column";
import { File, InstallmentWithFiles } from "@shared/data";
import { useSignPersonalMessage } from "@mysten/dapp-kit";
import { fromHex } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { getAllowlistedKeyServers, SealClient, SessionKey } from "@mysten/seal";
import { downloadAndDecrypt, MoveCallConstructor } from "@/lib/sealUtil";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/networkConfig";
interface MarkdownFile {
  id: string;
  title: string;
  content: string;
  knowledgeBaseId: number;
  folderId?: number;
  createdAt: string;
  updatedAt: string;
}
function constructCreatorMoveCall(
  packageId: string,
  colCapId: string,
  columnId: string,
): MoveCallConstructor {
  return (tx: Transaction, id: string) => {
    tx.moveCall({
      target: `${packageId}::perlite_market::seal_approve_creator`,
      arguments: [
        tx.pure.vector("u8", fromHex(id)),
        tx.object(colCapId),
        tx.object(columnId),
      ],
    });
  };
}

function constructSubscribeMoveCall(
  packageId: string,
  subCapId: string,
  columnId: string,
  paymentMethodId: string,
): MoveCallConstructor {
  return (tx: Transaction, id: string) => {
    tx.moveCall({
      target: `${packageId}::perlite_market::seal_approve_sub`,
      arguments: [
        tx.pure.vector("u8", fromHex(id)),
        tx.object(subCapId),
        tx.object(columnId),
        tx.object(paymentMethodId),
        tx.object("0x6"),
      ],
    });
  };
}

export default function EpisodeDetail() {
  const [match, params] = useRoute(
    "/creator/columns/:id/:cap_id/episodes/:episodeId",
  );
  const [subMatch, subParams] = useRoute(
    "/sub/col/:id/:subId/:payId/e/:episodeId/",
  );
  const [episode, setEpisode] = useState<InstallmentWithFiles | null>(null);
  const [markdownFiles, setMarkdownFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decrypted, setDecrypted] = useState(false);

  const columnId = match ? params?.id : subParams?.id;
  const episodeId = match ? params?.episodeId : subParams?.episodeId;
  const columnCapId = match ? params?.cap_id : "";
  const subId = subParams?.subId;
  const payId = subParams?.payId;

  const [error, setError] = useState<string | null>(null);
  const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(
    null,
  );
  const [reloadKey, setReloadKey] = useState(0);

  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const currentAccount = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const TTL_MIN = 10;

  useEffect(() => {
    if (columnId && episodeId) {
      loadEpisodeDetail(episodeId);
    }
  }, [columnId, episodeId]);

  const loadEpisodeDetail = async (episodeId: string) => {
    try {
      setIsLoading(true);
      const mockEpisode: InstallmentWithFiles | null =
        await getOneInstallment(episodeId);
      if (mockEpisode) {
        setEpisode(mockEpisode);
      }
      // 加载期数基本信息
      // 这里应该调用真实API，暂时使用模拟数据

      // 加载期数包含的markdown文件内容
      const mockFiles: File[] = mockEpisode.files;

      setMarkdownFiles(mockFiles);
      // 默认选择第一个文件
      if (mockFiles.length > 0) {
        setSelectedFile(mockFiles[0]);
      }
    } catch (error) {
      console.error("Error loading episode detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: MarkdownFile) => {
    setSelectedFile(file);
  };

  const handleDecrypt = () => {
    if (markdownFiles.length == 0) {
      alert("no file to decrypt");
      return;
    }

    //let blobIds = markdownFiles.map((file) => file.blob_id);
    let moveCallConstructor = null;
    if (match) {
      //创作者
      console.log("creator");
      const columnId = params?.id;
      const capId = params?.cap_id;
      moveCallConstructor = constructCreatorMoveCall(
        packageId,
        capId,
        columnId,
      );
    } else {
      console.log("Subscribe");
      //订阅者function constructSubscribeMoveCall(
      //packageId: string,
      // subCapId: string,
      // columnId: string,
      // paymentMethodId: string,

      moveCallConstructor = constructSubscribeMoveCall(
        packageId,
        subId,
        columnId,
        payId,
      );
    }

    if (
      currentSessionKey &&
      !currentSessionKey.isExpired() &&
      currentSessionKey.getAddress() === currentAccount.address
    ) {
      downloadAndDecrypt(
        markdownFiles,
        currentSessionKey,
        moveCallConstructor,
        setError,
        setReloadKey,
        setMarkdownFiles,
      );
      return;
    }

    setCurrentSessionKey(null);

    const sessionKey = new SessionKey({
      address: currentAccount.address,
      packageId,
      ttlMin: TTL_MIN,
    });

    try {
      signPersonalMessage(
        {
          message: sessionKey.getPersonalMessage(),
        },
        {
          onSuccess: async (result) => {
            await sessionKey.setPersonalMessageSignature(result.signature);
            downloadAndDecrypt(
              markdownFiles,
              currentSessionKey,
              moveCallConstructor,
              setError,
              setReloadKey,
              setMarkdownFiles,
            );
            setCurrentSessionKey(sessionKey);
          },
        },
      );
    } catch (error: any) {
      console.error("Error:", error);
    }

    setDecrypted(true);
    // 这里应该调用解密API，暂时使用模拟数据
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cyber-dark text-cyber-text flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyber-purple mx-auto mb-6"></div>
          <p className="text-cyber-text text-lg">Loading episode content...</p>
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-cyber-dark text-cyber-text flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-rajdhani text-2xl text-cyber-text mb-4">
            Episode Not Found
          </h2>
          <Link href={`/creator/column/episodes/${columnId}/${columnCapId}`}>
            <Button className="bg-cyber-purple hover:bg-cyber-purple/80 text-white">
              Back to Episodes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-dark text-cyber-text">
      {/* Header */}
      <div className="sticky top-0 bg-cyber-dark/95 backdrop-blur-sm border-b border-cyber-purple/20 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/creator/column/episodes/${columnId}/${columnCapId}`}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cyber-cyan hover:bg-cyber-dark"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Episodes
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cyber-purple/20 rounded-full flex items-center justify-center">
                  <Hash className="h-5 w-5 text-cyber-purple" />
                </div>
                <div>
                  <h1 className="font-rajdhani text-2xl font-bold text-cyber-cyan">
                    Episode {episode.no}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-cyber-text/70">
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{episode.files.length} files</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleDecrypt();
                }}
                className="border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-white"
              >
                <Eye className="mr-2 h-4 w-4" />
                Decrypt
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Left Right Layout */}
      <div className="flex h-screen">
        {/* Left Sidebar - File List */}
        <div className="w-80 bg-cyber-surface border-r border-cyber-purple/20 flex flex-col">
          <div className="p-6 border-b border-cyber-purple/20">
            <h2 className="font-rajdhani text-lg font-bold text-cyber-cyan mb-2">
              Episode Files
            </h2>
            <p className="text-cyber-text/60 text-sm">
              {markdownFiles.length} files in this episode
            </p>
          </div>

          <div className="flex-1 overflow-y-auto cyber-scrollbar">
            {markdownFiles.length === 0 ? (
              <div className="p-6 text-center">
                <FileText className="h-12 w-12 text-cyber-purple mx-auto mb-4 opacity-50" />
                <p className="text-cyber-text/60 text-sm">No files available</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {markdownFiles.map((file, index) => (
                  <div
                    key={file.id}
                    onClick={() => handleFileSelect(file)}
                    className={`cyber-border rounded-lg p-4 cursor-pointer transition-all hover:border-cyber-purple ${
                      selectedFile?.id === file.id
                        ? "bg-cyber-purple/10 border-cyber-purple"
                        : "bg-cyber-dark hover:bg-cyber-dark/80"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selectedFile?.id === file.id
                            ? "bg-cyber-purple text-white"
                            : "bg-cyber-purple/20 text-cyber-purple"
                        }`}
                      >
                        <span className="font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium text-sm mb-1 leading-tight ${
                            selectedFile?.id === file.id
                              ? "text-cyber-purple"
                              : "text-cyber-text"
                          }`}
                        >
                          {file.title}
                        </h3>
                        <div className="flex items-center space-x-2 text-xs text-cyber-text/60">
                          <Clock className="h-3 w-3" />
                          <span>
                            Updated{" "}
                            {selectedFile.updated_at.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Content Area - Markdown Viewer */}
        <div className="flex-1 flex flex-col">
          {selectedFile ? (
            <>
              {/* Content Header */}
              <div className="p-6 border-b border-cyber-purple/20 bg-cyber-surface/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-rajdhani text-2xl font-bold text-cyber-cyan mb-1">
                      {selectedFile.title}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-cyber-text/60">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          Updated {selectedFile.updated_at.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Markdown Content */}
              <div className="flex-1 overflow-y-auto cyber-scrollbar">
                <div className="p-8">
                  <div className="prose prose-invert max-w-none">
                    {decrypted ? (
                      <MarkdownViewer content={selectedFile.content} />
                    ) : (
                      <span>
                        please click decrypt button to preview content
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-20 w-20 text-cyber-purple mx-auto mb-6 opacity-50" />
                <h3 className="font-rajdhani text-2xl text-cyber-text mb-4">
                  Select a File
                </h3>
                <p className="text-cyber-text opacity-70 mb-8 max-w-md mx-auto">
                  Choose a file from the left sidebar to view its content
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
