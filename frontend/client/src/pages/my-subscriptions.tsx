import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { ColumnCard } from "@/components/column-card";
import { getMySubscriptions } from "@/contract/perlite_column";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { getAllColumns } from "@/contract/perlite_column";
import {
  ColumnOtherInfo,
  Installment,
  UpdateMethod,
  PaymentMethod,
  Subscription,
} from "@shared/data";

export default function MySubscriptions() {
  // Fetch user subscriptions
  const [isLoading, setIsLoading] = React.useState(true);
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const currentAccount = useCurrentAccount();
  useEffect(() => {
    // 加载知识库列表
    const fetchMySubscription = async () => {
      if (currentAccount) {
        let cols = await getMySubscriptions(currentAccount.address);
        console.log("subs", cols);
        setSubscriptions(cols);
        setIsLoading(false);
      }
    };
    fetchMySubscription();
  }, [currentAccount, setSubscriptions, setIsLoading]);
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyber-purple"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="font-rajdhani font-bold text-3xl md:text-4xl text-cyber-text">
          <span className="text-cyber-purple">#</span> My Subscriptions
        </h1>
      </div>

      <div className="border-b border-cyber-purple mb-8"></div>

      {subscriptions.length === 0 ? (
        <Card className="cyber-border bg-cyber-surface p-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-cyber-purple mx-auto mb-4 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h3 className="font-rajdhani text-xl text-white mb-2">
            You haven't subscribed to any columns yet
          </h3>
          <p className="text-cyber-text mb-6">
            Browse and subscribe to columns that interest you to start your
            learning journey
          </p>
          <Link href="/columns">
            <Button className="cyber-btn bg-cyber-purple hover:bg-opacity-80 text-white font-rajdhani">
              Browse Columns <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((sub: Subscription) => (
            <ColumnCard
              key={sub.id}
              id={sub.column?.id || ""}
              title={sub.column?.name || ""}
              description={sub.column?.desc || ""}
              thumbnailUrl={sub.column?.cover_img_url || undefined}
              creatorName={sub.column?.creator || ""}
              isSubscribed={true}
              createdAt={sub.column?.update_at.toLocaleDateString()}
              paymentId={sub.column?.payment_method?.id}
              subId={sub.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
