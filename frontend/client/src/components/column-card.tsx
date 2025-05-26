import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, Calendar } from "lucide-react";
import { showAddress } from "@/lib/utils";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "@/networkConfig";
interface ColumnCardProps {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  price?: number;
  paymentType?: number; // 0: 买断, 1: 订阅
  creatorName?: string;
  createdAt?: string;
  isSubscribed?: boolean;
  paymentId?: string;
  subId?: string;
}

export function ColumnCard({
  id,
  title,
  description,
  thumbnailUrl,
  price = 0,
  paymentType = 0,
  creatorName = "Unknown Creator",
  createdAt = "",
  isSubscribed = false,
  paymentId = "",
  subId = "",
}: ColumnCardProps) {
  const chain = useNetworkVariable("chain");
  const packageId = useNetworkVariable("packageId");
  const globalConfigId = useNetworkVariable("globalConfigId");
  const marketId = useNetworkVariable("marketId");
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  // 格式化创建时间
  const formatDate = (dateString: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const doSubscribe = () => {
    if (isSubscribed) {
      alert("you have already subscribed this column");
      return;
    }
    if (!currentAccount) {
      alert("please connect your wallet");
      return;
    }

    try {
      // 这里应该调用API创建新期数
      const tx = new Transaction();
      tx.setSender(currentAccount.address);
      let amount = price * 1000_000_000;
      let cut_fee = amount * 0.0015;
      let fee = amount - cut_fee;
      const [feeCoin, cutFeeCoin] = tx.splitCoins(tx.gas, [fee, cut_fee]); // 分割 SUI 代币
      tx.moveCall({
        target: `${packageId}::perlite_market::subscription_column`,
        arguments: [
          tx.object(marketId), //market
          tx.object(id), //column
          tx.object(paymentId), //payment
          feeCoin,
          cutFeeCoin,
          tx.object("0x6"), //clock
          tx.object(globalConfigId), //global_config
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx, chain: chain },
        {
          onSuccess: (result) => {
            // 成功时打印结果
            alert("subscripe column successfully! digest:" + result.digest);
            //刷新当前页面
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          },
          onError: (error) => {
            alert("subscripe column failed: " + JSON.stringify(error));
            console.error("Transaction failed:", error);
          },
        },
      );
    } catch (error) {
      alert("Failed to subscripe column");
    }
  };

  return (
    <Card className="relative cyber-border bg-gradient-to-br from-cyber-surface to-cyber-dark/80 hover:border-cyber-cyan transition-all duration-500 group overflow-hidden transform hover:scale-105 hover:shadow-2xl hover:shadow-cyber-purple/20">
      {/* Cover Image with Overlay */}
      <div className="relative h-52 overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyber-purple/20 via-cyber-cyan/10 to-cyber-dark/40 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-cyber-purple/30 to-cyber-cyan/30 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <BookOpen className="w-10 h-10 text-cyber-cyan" />
              </div>
              <span className="text-cyber-text/70 text-sm font-medium">
                Content Preview
              </span>
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-cyber-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Price Badge - Redesigned */}
        <div className="absolute top-4 right-4">
          <div className="backdrop-blur-md bg-cyber-dark/70 border border-cyber-cyan/50 rounded-xl px-4 py-2 shadow-lg">
            <div className="text-cyber-cyan text-lg font-bold font-rajdhani">
              {price} SUI
            </div>
            <div className="text-cyber-text/80 text-xs text-center font-medium">
              {paymentType === 0 ? "💎 Buy Out" : "🔄 Subscription"}
            </div>
          </div>
        </div>

        {/* Floating Create Date */}
        <div className="absolute bottom-4 left-4 flex items-center space-x-2 backdrop-blur-md bg-cyber-dark/60 rounded-lg px-3 py-1.5">
          <Calendar className="h-3 w-3 text-cyber-cyan" />
          <span className="text-cyber-text/90 text-xs font-medium">
            {formatDate(createdAt)}
          </span>
        </div>
      </div>

      {/* Content Section - Redesigned */}
      <div className="p-6 relative">
        {/* Title */}
        <Link href={`/columns/${id}`}>
          <h3 className="font-rajdhani text-2xl font-bold text-transparent bg-gradient-to-r from-cyber-cyan to-cyber-purple bg-clip-text mb-3 hover:from-cyber-purple hover:to-cyber-cyan transition-all duration-300 cursor-pointer line-clamp-2 leading-tight">
            {title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-cyber-text/85 text-sm mb-5 line-clamp-3 leading-relaxed">
          {description}
        </p>

        {/* Creator Info - Simplified */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-cyber-text/70 text-xs">
            Created by{" "}
            <span className="text-cyber-cyan font-medium">
              {showAddress(creatorName)}
            </span>
          </p>

          {/* Status Indicator */}
          <div className="w-2 h-2 bg-gradient-to-r from-cyber-cyan to-cyber-purple rounded-full animate-pulse"></div>
        </div>

        {/* Subscribe Button - Enhanced */}
        {isSubscribed ? (
          <Link href={`/sub/col/e/${id}/${subId}/${paymentId}`}>
            <Button className="w-full h-12 bg-gradient-to-r from-cyber-purple via-cyber-cyan to-cyber-purple bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-rajdhani font-bold text-lg tracking-wide transition-all duration-500 shadow-lg hover:shadow-cyber-purple/50 transform active:scale-95 border border-cyber-cyan/30">
              <span className="flex items-center justify-center space-x-2">
                <span>View</span>
                <div className="w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </span>
            </Button>
          </Link>
        ) : (
          <Button
            className="w-full h-12 bg-gradient-to-r from-cyber-purple via-cyber-cyan to-cyber-purple bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-rajdhani font-bold text-lg tracking-wide transition-all duration-500 shadow-lg hover:shadow-cyber-purple/50 transform active:scale-95 border border-cyber-cyan/30"
            disabled={isSubscribed}
            onClick={() => doSubscribe()}
          >
            <span className="flex items-center justify-center space-x-2">
              <span>Subscribe Now</span>
              <div className="w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </span>
          </Button>
        )}
      </div>

      {/* Animated Border Effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyber-purple via-cyber-cyan to-cyber-purple opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"></div>
    </Card>
  );
}
