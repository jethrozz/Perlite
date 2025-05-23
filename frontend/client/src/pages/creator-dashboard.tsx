import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CyberpunkDivider } from "@/components/cyberpunk-divider";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Users,
  Plus,
  Edit,
  Calendar,
  Eye,
  ChevronRight,
  X,
} from "lucide-react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/networkConfig";
interface ColumnCardProps {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  creatorId: string;
  creatorName: string;
  updateMethod: string;
  payMethod: string;
  planInstallmentNumber: number;
  totalInstallmentNumber: number;
  status?: number;
  isSubscribed?: boolean;
  isAuthenticated?: boolean;
}

export default function CreatorDashboard() {
  const packageId = useNetworkVariable("packageId");
  const globalConfigId = useNetworkVariable("globalConfigId");
  const marketConfigId = useNetworkVariable("marketConfigId");
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [columns, setColumns] = useState<Column[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 专栏创建表单状态
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImageUrl: "",
    plannedEpisodes: "",
    enableRating: false,
    paymentType: "0", // 0: 买断, 1: 订阅
    price: "",
    subscriptionDays: "",
    startDate: "",
    intervalDays: "",
    updateEpisodes: "",
  });

  // 处理表单输入变化
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      coverImageUrl: "",
      plannedEpisodes: "",
      enableRating: false,
      paymentType: "0",
      price: "",
      subscriptionDays: "",
      startDate: "",
      intervalDays: "",
      updateEpisodes: "",
    });
  };
  // 验证必填字段
  const checkRequiredFields = () => {
    let checkFailed = false;
    if (!formData.title) {
      toast({
        title: "Error",
        description: "Column title is required",
        variant: "destructive",
      });
      checkFailed = true;
    }
    if (!formData.coverImageUrl) {
      toast({
        title: "Error",
        description: "Cover image URL is required",
        variant: "destructive",
      });
      checkFailed = true;
    }
    if (!formData.price) {
      toast({
        title: "Error",
        description: "Price is required",
        variant: "destructive",
      });
      checkFailed = true;
    }
    if (formData.paymentType === "1" && !formData.subscriptionDays) {
      toast({
        title: "Error",
        description: "Subscription days is required for subscription type",
        variant: "destructive",
      });
      checkFailed = true;
    }
    if (!formData.startDate) {
      toast({
        title: "Error",
        description: "Start date is required",
        variant: "destructive",
      });
      checkFailed = true;
    }
    if (!formData.intervalDays) {
      toast({
        title: "Error",
        description: "Interval days is required",
        variant: "destructive",
      });
      checkFailed = true;
    }
    if (!formData.updateEpisodes) {
      toast({
        title: "Error",
        description: "Update episodes is required",
        variant: "destructive",
      });
      checkFailed = true;
    }
    return checkFailed;
  };
  // 提交创建专栏
  const handleCreateColumn = async () => {
    if (!currentAccount) {
      toast({
        title: "Error",
        description: "Please Connected Your Wallet",
        variant: "destructive",
      });
      return;
    }
    // 验证必填字段
    let checkFailed = checkRequiredFields();
    if (checkFailed) {
      return;
    }
    const tx = new Transaction();
    tx.setSender(currentAccount.address);
    //create_payment_method
    tx.moveCall({
      target: `${packageId}::perlite_market::create_payment_method`,
      arguments: [
        tx.pure,
        tx.object(lotteryPoolId),
        tx.object(ticketPoolId),
        suiCoin,
        tx.object(storageId),
        tx.object(incentiveV3Id),
        tx.object(incentiveV2Id),
        tx.object(poolSuiId),
        tx.object(clockId),
        tx.object(randomId),
      ],
      typeArguments: [balance.coinType],
    });
    //create_update_method

    //create_column
    try {
      // 这里应该调用实际的API来创建专栏
      toast({
        title: "Success",
        description: "Column created successfully!",
      });

      setShowCreateModal(false);
      resetForm();

      // 刷新专栏列表
      // 实际项目中应该重新获取数据
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create column. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Mock data for demonstration - replace with real API calls
  useEffect(() => {
    if (currentAccount) {
      // Simulate loading
      setTimeout(() => {
        const mockColumns: Column[] = [
          {
            id: 1,
            title: "Blockchain Development Guide",
            description:
              "Complete guide to building decentralized applications with practical examples and best practices",
            thumbnailUrl: null,
            articleCount: 15,
            subscriberCount: 234,
            isPublished: true,
            isHot: true,
            isNew: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 2,
            title: "Web3 Security Best Practices",
            description:
              "Essential security patterns for Web3 development, including smart contract auditing and vulnerability prevention",
            thumbnailUrl: null,
            articleCount: 8,
            subscriberCount: 156,
            isPublished: true,
            isHot: false,
            isNew: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 3,
            title: "DeFi Protocols Deep Dive",
            description:
              "Understanding decentralized finance protocols, yield farming, and liquidity mining strategies",
            thumbnailUrl: null,
            articleCount: 12,
            subscriberCount: 89,
            isPublished: false,
            isHot: false,
            isNew: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 4,
            title: "NFT Development Workshop",
            description:
              "Step-by-step guide to creating, deploying, and marketing NFT collections on various blockchains",
            thumbnailUrl: null,
            articleCount: 6,
            subscriberCount: 45,
            isPublished: true,
            isHot: false,
            isNew: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        setColumns(mockColumns);
        setIsLoading(false);
      }, 1000);
    }
  }, [currentAccount]);

  if (!currentAccount) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyber-purple"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-8 pt-24 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="font-rajdhani font-bold text-3xl md:text-4xl text-cyber-text">
          <span className="text-cyber-purple">#</span> My Columns
        </h1>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="cyber-btn bg-cyber-purple hover:bg-opacity-80 text-white font-rajdhani">
              <Plus className="mr-2 h-4 w-4" />
              Create New Column
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
                Create New Column
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-cyber-purple font-rajdhani text-lg font-semibold">
                  Basic Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-cyber-text">
                    Column Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter column title"
                    className="cyber-border bg-cyber-dark text-cyber-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-cyber-text">
                    Description{" "}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe your column content and target audience"
                    className="cyber-border bg-cyber-dark text-cyber-text min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverImage" className="text-cyber-text">
                    Cover Image URL *
                  </Label>
                  <Input
                    id="coverImage"
                    value={formData.coverImageUrl}
                    onChange={(e) =>
                      handleInputChange("coverImageUrl", e.target.value)
                    }
                    placeholder="https://example.com/image.jpg"
                    className="cyber-border bg-cyber-dark text-cyber-text"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="episodes" className="text-cyber-text">
                      Planned Episodes
                    </Label>
                    <Input
                      id="episodes"
                      type="number"
                      value={formData.plannedEpisodes}
                      onChange={(e) =>
                        handleInputChange("plannedEpisodes", e.target.value)
                      }
                      placeholder="10"
                      className="cyber-border bg-cyber-dark text-cyber-text"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="rating"
                      checked={formData.enableRating}
                      onCheckedChange={(checked) =>
                        handleInputChange("enableRating", checked)
                      }
                    />
                    <Label htmlFor="rating" className="text-cyber-text">
                      Enable Rating
                    </Label>
                  </div>
                </div>
              </div>

              <CyberpunkDivider />

              {/* 支付方式 */}
              <div className="space-y-4">
                <h3 className="text-cyber-purple font-rajdhani text-lg font-semibold">
                  Payment Settings
                </h3>

                <div className="space-y-2">
                  <Label className="text-cyber-text">Payment Type *</Label>
                  <Select
                    value={formData.paymentType}
                    onValueChange={(value) =>
                      handleInputChange("paymentType", value)
                    }
                  >
                    <SelectTrigger className="cyber-border bg-cyber-dark text-cyber-text focus:border-cyber-purple">
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent className="cyber-border bg-cyber-surface border-cyber-purple z-[9999]">
                      <SelectItem
                        value="0"
                        className="text-cyber-text hover:bg-cyber-dark focus:bg-cyber-dark"
                      >
                        Buy Out (One-time purchase)
                      </SelectItem>
                      <SelectItem
                        value="1"
                        className="text-cyber-text hover:bg-cyber-dark focus:bg-cyber-dark"
                      >
                        Subscription (Recurring)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-cyber-text">
                      Price (SUI) *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        handleInputChange("price", e.target.value)
                      }
                      placeholder="10.00"
                      className="cyber-border bg-cyber-dark text-cyber-text"
                    />
                  </div>

                  {formData.paymentType === "1" && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="subscriptionDays"
                        className="text-cyber-text"
                      >
                        Subscription Days *
                      </Label>
                      <Input
                        id="subscriptionDays"
                        type="number"
                        value={formData.subscriptionDays}
                        onChange={(e) =>
                          handleInputChange("subscriptionDays", e.target.value)
                        }
                        placeholder="30"
                        className="cyber-border bg-cyber-dark text-cyber-text"
                      />
                    </div>
                  )}
                </div>
              </div>

              <CyberpunkDivider />

              {/* 更新计划 */}
              <div className="space-y-4">
                <h3 className="text-cyber-purple font-rajdhani text-lg font-semibold">
                  Update Schedule
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-cyber-text">
                      Start Date *
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleInputChange("startDate", e.target.value)
                      }
                      className="cyber-border bg-cyber-dark text-cyber-text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="intervalDays" className="text-cyber-text">
                      Interval (Days) *
                    </Label>
                    <Input
                      id="intervalDays"
                      type="number"
                      value={formData.intervalDays}
                      onChange={(e) =>
                        handleInputChange("intervalDays", e.target.value)
                      }
                      placeholder="7"
                      className="cyber-border bg-cyber-dark text-cyber-text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="updateEpisodes" className="text-cyber-text">
                      Episodes to Update *
                    </Label>
                    <Input
                      id="updateEpisodes"
                      type="number"
                      value={formData.updateEpisodes}
                      onChange={(e) =>
                        handleInputChange("updateEpisodes", e.target.value)
                      }
                      placeholder="1"
                      className="cyber-border bg-cyber-dark text-cyber-text"
                    />
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="border-cyber-text text-cyber-text hover:bg-cyber-dark"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateColumn}
                  className="bg-cyber-purple hover:bg-cyber-purple/80 text-white"
                >
                  Create Column
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <CyberpunkDivider className="mb-8" />

      {/* Columns List */}
      <Card className="cyber-border bg-cyber-surface">
        <CardHeader>
          <CardTitle className="text-cyber-cyan flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Column Management
            </div>
            <span className="text-sm font-normal text-cyber-text opacity-70">
              {columns.length} total columns
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyber-purple mx-auto mb-6"></div>
              <p className="text-cyber-text text-lg">Loading your columns...</p>
            </div>
          ) : columns.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-20 w-20 text-cyber-purple mx-auto mb-6 opacity-50" />
              <h3 className="font-rajdhani text-2xl text-cyber-text mb-4">
                No Columns Yet
              </h3>
              <p className="text-cyber-text opacity-70 mb-8 max-w-md mx-auto">
                Start creating your first column to share your expertise with
                the community
              </p>
              <Button className="cyber-btn bg-cyber-purple hover:bg-opacity-80 text-white font-rajdhani text-lg px-8 py-3">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Column
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-cyber-dark/50">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="p-6 hover:bg-cyber-dark/20 transition-all group cursor-pointer border-l-4 border-transparent hover:border-cyber-purple"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-6">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-rajdhani text-xl text-cyber-text group-hover:text-cyber-cyan transition-colors font-semibold">
                          {column.title}
                        </h3>
                        <div className="flex gap-2">
                          {column.isHot && (
                            <span className="px-3 py-1 text-xs rounded-full font-rajdhani bg-cyber-purple text-white font-bold">
                              🔥 HOT
                            </span>
                          )}
                          {column.isNew && (
                            <span className="px-3 py-1 text-xs rounded-full font-rajdhani bg-cyber-cyan text-black font-bold">
                              ✨ NEW
                            </span>
                          )}
                          <span
                            className={`px-3 py-1 text-xs rounded-full font-rajdhani font-bold ${
                              column.isPublished
                                ? "bg-green-500 text-white"
                                : "bg-gray-600 text-white"
                            }`}
                          >
                            {column.isPublished ? "📢 PUBLISHED" : "📝 DRAFT"}
                          </span>
                        </div>
                      </div>

                      <p className="text-cyber-text opacity-80 mb-4 text-base leading-relaxed">
                        {column.description}
                      </p>

                      <div className="flex items-center gap-8 text-sm text-cyber-text opacity-70">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-cyber-cyan" />
                          <span className="font-medium">
                            {column.articleCount} articles
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyber-purple" />
                          <span className="font-medium">
                            {column.subscriberCount} subscribers
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-400" />
                          <span className="font-medium">
                            Updated {formatDate(column.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-white transition-all"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan hover:text-black transition-all"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <ChevronRight className="w-6 h-6 text-cyber-text opacity-40 group-hover:opacity-100 group-hover:text-cyber-purple transition-all" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
