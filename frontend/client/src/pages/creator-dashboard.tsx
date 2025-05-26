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
  HardDriveUpload,
  X,
  Trash2,
  DollarSign,
  Newspaper,
} from "lucide-react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "@/networkConfig";
import { getUserOwnedColumns } from "@/contract/perlite_column";
import { ColumnCap } from "@shared/data";
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
  const chain = useNetworkVariable("chain");
  const packageId = useNetworkVariable("packageId");
  const globalConfigId = useNetworkVariable("globalConfigId");
  const marketConfigId = useNetworkVariable("marketConfigId");
  const currentAccount = useCurrentAccount();
  const [columns, setColumns] = useState<ColumnCap[]>([]);
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Mock data for demonstration - replace with real API calls
  useEffect(() => {
    const fetchColumns = async () => {
      if (currentAccount) {
        let userOwnedColumns = await getUserOwnedColumns(
          currentAccount.address,
        );
        console.log("userOwnedColumns", userOwnedColumns);
        setColumns(userOwnedColumns);
        setIsLoading(false);
      }
    };
    fetchColumns();
  }, [currentAccount, setColumns, setIsLoading]);

  // 专栏创建表单状态
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImageUrl: "",
    plannedEpisodes: "",
    enableRating: false,
    paymentType: "0", // 0: 买断, 1: 订阅
    price: "",
    subscriptionDays: "0",
    startDate: "",
    intervalDays: "7",
    updateEpisodes: "1",
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
      subscriptionDays: "0",
      startDate: "",
      intervalDays: "7",
      updateEpisodes: "1",
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
    if (
      formData.paymentType === "1" &&
      parseInt(formData.subscriptionDays) > 0
    ) {
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
    console.log("formData", formData);
    // 验证必填字段

    let checkFailed = checkRequiredFields();
    if (checkFailed) {
      return;
    }
    const tx = new Transaction();
    tx.setSender(currentAccount.address);
    //create_payment_method
    let payment = tx.moveCall({
      target: `${packageId}::perlite_market::create_payment_method`,
      arguments: [
        tx.pure.u8(parseInt(formData.paymentType)),
        tx.pure.string(
          "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
        ),
        tx.pure.u64(9),
        tx.pure.u64(parseInt(formData.price) * 1000000000),
        tx.pure.u64(parseInt(formData.subscriptionDays)),
        tx.object(marketConfigId),
        tx.object(globalConfigId),
      ],
    });
    //formData.startDate
    let since = new Date(formData.startDate).getTime();
    //create_update_method
    let updateMethod = tx.moveCall({
      target: `${packageId}::perlite_market::create_update_method`,
      arguments: [
        tx.pure.u64(since),
        tx.pure.u64(formData.intervalDays),
        tx.pure.u64(formData.updateEpisodes),
        tx.object(globalConfigId),
      ],
    });
    //create_column

    tx.moveCall({
      target: `${packageId}::perlite_market::create_column`,
      arguments: [
        tx.pure.string(formData.title),
        tx.pure.string(formData.description),
        tx.pure.string(formData.coverImageUrl),
        tx.object(updateMethod),
        tx.object(payment),
        tx.pure.bool(formData.enableRating),
        tx.pure.u64(formData.plannedEpisodes),
        tx.object("0x6"),
        tx.object(globalConfigId),
      ],
    });

    try {
      // 这里应该调用实际的API来创建专栏
      signAndExecuteTransaction(
        { transaction: tx, chain: chain },
        {
          onSuccess: (result) => {
            // 成功时打印结果
            alert("Create successful: " + result.digest);
            setShowCreateModal(false);
            setTimeout(() => {
              window.location.reload();
            }, 800);
          },
          onError: (error) => {
            alert("Failed to create column. " + JSON.stringify(error));
            console.error("Transaction failed:", error);
          },
        },
      );

      resetForm();
      // 刷新专栏列表
      // 实际项目中应该重新获取数据
    } catch (error) {
      alert("Failed to create column. Please try again.");
      console.error("Failed to create column:", error);
    }
  };

  const publishColumn = async (columnId: string, columnCapId: string) => {
    if (!currentAccount) {
      toast({
        title: "Error",
        description: "Please Connected Your Wallet",
        variant: "destructive",
      });
      return;
    }
    const tx = new Transaction();
    tx.setSender(currentAccount.address);
    tx.moveCall({
      target: `${packageId}::perlite_market::publish_column`,
      arguments: [
        tx.object(columnId),
        tx.object(columnCapId),
        tx.object("0x6"),
      ],
    });

    try {
      signAndExecuteTransaction(
        { transaction: tx, chain: chain },
        {
          onSuccess: (result) => {
            // 成功时打印结果
            alert("Publish Colum successful: " + result.digest);
            setTimeout(() => {
              window.location.reload();
            }, 800);
          },
          onError: (error) => {
            alert("Failed to publish column: " + JSON.stringify(error));
            console.error("Failed to publish column:", error);
          },
        },
      );
    } catch (error) {
      alert("Failed to publish column. Please try again.");
      console.error("Failed to publish column:", error);
    }
  };

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="cyber-border bg-cyber-surface rounded-lg overflow-hidden hover:border-cyber-purple transition-colors group"
                >
                  {/* 封面图片 */}
                  <div className="h-48 bg-gradient-to-br from-cyber-dark to-cyber-purple/20 relative overflow-hidden">
                    {column.image_url ? (
                      <img
                        src={column.image_url}
                        alt={column.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-cyber-purple/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <BookOpen className="h-8 w-8 text-cyber-purple" />
                          </div>
                          <div className="text-cyber-text/60 text-sm">
                            No Cover
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 价格标签 */}
                    <div className="absolute top-3 right-3">
                      <div className="bg-cyber-dark/90 border border-cyber-purple rounded-lg px-3 py-1">
                        <div className="text-cyber-purple text-sm font-medium">
                          {column.other.payment_method?.fee || 0} SUI
                        </div>
                        <div className="text-cyber-text/60 text-xs">
                          {column.other.payment_method?.pay_type === 0
                            ? "Buy Out"
                            : "Subscription"}
                        </div>
                      </div>
                    </div>

                    {/* 状态标签 */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {column.other.status === 1 && (
                        <span className="px-2 py-1 text-xs rounded-full font-rajdhani bg-cyber-purple text-white font-bold">
                          🔥 HOT
                        </span>
                      )}
                      {column.other.status === 0 && (
                        <span className="px-2 py-1 text-xs rounded-full font-rajdhani bg-cyber-cyan text-black font-bold">
                          ✨ NEW
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-rajdhani font-bold ${
                          column.isPublished
                            ? "bg-green-500 text-white"
                            : "bg-gray-600 text-white"
                        }`}
                      >
                        {column.other.status === 1
                          ? "📢 PUBLISHED"
                          : "📝 DRAFT"}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-rajdhani text-xl text-cyber-text group-hover:text-cyber-cyan transition-colors font-semibold">
                        {column.name}
                      </h3>
                      <div className="flex space-x-2">
                        <Link
                          href={`/creator/column/episodes/${column.column_id}/${column.id}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-cyber-cyan hover:bg-cyber-dark"
                            title="Manage Episodes"
                          >
                            <Newspaper className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-cyber-purple hover:bg-cyber-dark"
                          onClick={() =>
                            publishColumn(column.id, column.column_id)
                          }
                          disabled={
                            column.other.status === 1 ||
                            column.other.status === 2
                          }
                          title="Publish Column"
                        >
                          <HardDriveUpload className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-cyber-purple hover:bg-cyber-dark"
                          title="Edit Column Base Info"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-400/10"
                          title="Delete Column"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-cyber-text/80 text-sm mb-4 line-clamp-3">
                      {column.description}
                    </p>

                    {/* 收益信息 */}
                    <div className="bg-cyber-dark/50 rounded-lg p-3 mb-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-cyber-purple text-lg font-bold">
                            {column.other.balance || 0}
                          </div>
                          <div className="text-cyber-text/60 text-xs">
                            Total Earnings
                          </div>
                        </div>
                        <div>
                          <div className="text-cyber-cyan text-lg font-bold">
                            {column.other.balance || 0}
                          </div>
                          <div className="text-cyber-text/60 text-xs">
                            Available
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 提取奖励按钮 */}
                    <Button
                      className="w-full mb-4 bg-gradient-to-r from-cyber-purple to-cyber-cyan hover:from-cyber-purple/80 hover:to-cyber-cyan/80 text-white"
                      disabled={(column.other.balance || 0) === 0}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Withdraw Rewards (
                      {column.other.balance / 1000_000_000 || 0} SUI)
                    </Button>

                    <div className="flex justify-between items-center">
                      <div className="text-cyber-text/60 text-xs">
                        {column.other.subscriptions} subscribers •{" "}
                        {column.other.all_installment.length} installments
                      </div>
                      <div className="text-cyber-purple text-sm font-medium">
                        Updated {formatDate(column.other.update_at)}
                      </div>
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
