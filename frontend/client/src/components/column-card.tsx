import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { getInitials, showStatus } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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

export function ColumnCard({
  id,
  title,
  description,
  thumbnailUrl,
  creatorId,
  creatorName,
  updateMethod,
  payMethod,
  planInstallmentNumber,
  totalInstallmentNumber,
  status = 0,
  isSubscribed = false,
  isAuthenticated = false,
}: ColumnCardProps) {
  const { toast } = useToast();
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(isSubscribed);

  const handleSubscribe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    try {
      setSubscribing(true);

      if (subscribed) {
        await apiRequest("DELETE", `/api/subscriptions/${id}`);
        setSubscribed(false);
        toast({
          title: "已取消订阅",
          description: `您已成功取消订阅 ${title}`,
        });
      } else {
        await apiRequest("POST", "/api/subscriptions", { columnId: id });
        setSubscribed(true);
        toast({
          title: "订阅成功",
          description: `您已成功订阅 ${title}`,
        });
      }

      // Invalidate user subscriptions query
      queryClient.invalidateQueries({
        queryKey: ["/api/users/current/subscriptions"],
      });
    } catch (error) {
      toast({
        title: "操作失败",
        description: "订阅操作失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <Link href={`/columns/${id}`}>
      <Card className="cyber-card cursor-pointer h-full flex flex-col">
        <div className="relative h-40 overflow-hidden">
          <img
            src={
              thumbnailUrl ||
              `https://source.unsplash.com/random/600x300/?cyberpunk,tech,${id}`
            }
            alt={`${title} 缩略图`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cyber-dark to-transparent"></div>
          <div className="absolute top-2 right-2 cyber-badge cyber-badge-hot">
            {showStatus(status)}
          </div>
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-rajdhani font-semibold text-xl text-white mb-2">
            {title}
          </h3>
          <p className="font-barlow text-cyber-text text-sm mb-3 line-clamp-2">
            {description}
          </p>

          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-cyber-purple flex items-center justify-center mr-2">
              <span className="font-rajdhani text-xs text-white">
                {getInitials(creatorName)}
              </span>
            </div>
            <span className="text-cyber-text text-sm">{creatorName}</span>
          </div>

          <div className="flex justify-between items-center mt-auto">
            <div>
              <span className="text-cyber-cyan font-mono">{articleCount}</span>
              <span className="text-cyber-text text-sm ml-1">文章</span>
            </div>
            <Button
              variant={subscribed ? "outline" : "default"}
              size="sm"
              className={`cyber-btn ${
                subscribed
                  ? "bg-cyber-dark border border-cyber-cyan text-cyber-cyan"
                  : "bg-cyber-dark border border-cyber-purple text-cyber-purple"
              } hover:bg-cyber-purple hover:bg-opacity-20 font-rajdhani py-1 px-3 rounded-sm text-sm`}
              onClick={handleSubscribe}
              disabled={subscribing}
            >
              {subscribing ? "处理中..." : subscribed ? "已订阅" : "订阅"}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
