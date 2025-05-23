import React, { useState, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CyberpunkDivider } from "@/components/cyberpunk-divider";
import { Card } from "@/components/ui/card";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials, formatDate } from "@/lib/utils";
import { ArrowLeft, Clock, BookOpen, Users, Star, Heart } from "lucide-react";

interface ColumnDetailProps {
  id: number;
}

interface Column {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  creatorId: number;
  categoryId: number | null;
  articleCount: number;
  subscriberCount: number;
  rating: number;
  isHot: boolean;
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Creator {
  id: number;
  username: string;
  email: string;
  bio: string | null;
  avatar: string | null;
  isCreator: boolean;
}

interface Article {
  id: number;
  title: string;
  columnId: number;
  markdownFileId: number | null;
  order: number;
  isPublished: boolean;
  createdAt: string;
}

interface MarkdownFile {
  id: number;
  title: string;
  content: string;
  folderId: number | null;
  knowledgeBaseId: number;
  createdAt: string;
  updatedAt: string;
}

export default function ColumnDetail({ id }: ColumnDetailProps) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(
    null,
  );
  const [articleContent, setArticleContent] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiRequest("GET", "/api/auth/current-user");
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch column data
  const {
    data: column,
    isLoading: isLoadingColumn,
    isError: isErrorColumn,
  } = useQuery({
    queryKey: [`/api/columns/${id}`],
  });

  // Fetch creator data
  const { data: creator, isLoading: isLoadingCreator } = useQuery({
    queryKey: [`/api/users/${column?.creatorId}`],
    enabled: !!column?.creatorId,
  });

  // Fetch articles
  const { data: articles = [], isLoading: isLoadingArticles } = useQuery({
    queryKey: [`/api/columns/${id}/articles`],
    enabled: !!column,
  });

  // Check subscription status
  useQuery({
    queryKey: [`/api/subscriptions/check/${id}`],
    enabled: isAuthenticated && !!column,
    onSuccess: (data) => {
      setIsSubscribed(data.isSubscribed);
    },
  });

  // Load first article content when articles are loaded
  useEffect(() => {
    if (articles.length > 0 && !selectedArticleId) {
      setSelectedArticleId(articles[0].id);
    }
  }, [articles, selectedArticleId]);

  // Fetch article content when an article is selected
  useEffect(() => {
    const fetchArticleContent = async () => {
      if (!selectedArticleId) return;

      try {
        const selectedArticle = articles.find(
          (a: Article) => a.id === selectedArticleId,
        );
        if (!selectedArticle || !selectedArticle.markdownFileId) {
          setArticleContent(
            "# 内容暂未发布\n\n该文章内容正在准备中，敬请期待！",
          );
          return;
        }

        const res = await apiRequest(
          "GET",
          `/api/files/${selectedArticle.markdownFileId}`,
        );
        const markdownFile: MarkdownFile = await res.json();
        setArticleContent(markdownFile.content);
      } catch (error) {
        console.error("Error fetching article content:", error);
        setArticleContent("# 内容加载失败\n\n无法加载文章内容，请稍后重试。");
      }
    };

    fetchArticleContent();
  }, [selectedArticleId, articles]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    try {
      setIsSubscribing(true);

      if (isSubscribed) {
        await apiRequest("DELETE", `/api/subscriptions/${id}`);
        setIsSubscribed(false);
        toast({
          title: "已取消订阅",
          description: `您已成功取消订阅 ${column.title}`,
        });
      } else {
        await apiRequest("POST", "/api/subscriptions", { columnId: id });
        setIsSubscribed(true);
        toast({
          title: "订阅成功",
          description: `您已成功订阅 ${column.title}`,
        });
      }

      // Invalidate user subscriptions query
      queryClient.invalidateQueries({
        queryKey: ["/api/users/current/subscriptions"],
      });
      // Refresh column data to update subscriber count
      queryClient.invalidateQueries({ queryKey: [`/api/columns/${id}`] });
    } catch (error) {
      toast({
        title: "操作失败",
        description: "订阅操作失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  if (isLoadingColumn) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyber-purple"></div>
      </div>
    );
  }

  if (isErrorColumn || !column) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="cyber-border bg-cyber-surface p-8 rounded-lg text-center">
          <h2 className="font-rajdhani text-2xl text-cyber-magenta mb-4">
            专栏不存在或无法访问
          </h2>
          <p className="text-cyber-text mb-6">
            无法加载所请求的专栏，它可能不存在或您没有访问权限。
          </p>
          <Link href="/columns">
            <Button className="cyber-btn bg-cyber-purple hover:bg-opacity-80 text-white font-rajdhani py-2 px-6 rounded">
              返回专栏列表
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="mb-6">
        <Link href="/columns">
          <Button
            variant="ghost"
            className="text-cyber-text hover:text-cyber-purple px-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回专栏列表
          </Button>
        </Link>
      </div>

      {/* Column Header */}
      <div className="relative">
        <div className="h-64 w-full overflow-hidden rounded-lg mb-6 relative">
          <img
            src={
              column.thumbnailUrl ||
              `https://source.unsplash.com/random/1200x400/?cyberpunk,tech,${id}`
            }
            alt={`${column.title} 封面图`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cyber-dark via-cyber-dark/70 to-transparent"></div>

          <div className="absolute bottom-0 left-0 w-full p-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="font-rajdhani font-bold text-3xl md:text-4xl text-white mb-2">
                  {column.title}
                </h1>
                <p className="text-cyber-text text-lg mb-4 max-w-3xl">
                  {column.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center text-cyber-text">
                    <Clock className="mr-1 h-4 w-4 text-cyber-cyan" />
                    更新于 {formatDate(column.updatedAt)}
                  </div>
                  <div className="flex items-center text-cyber-text">
                    <BookOpen className="mr-1 h-4 w-4 text-cyber-cyan" />
                    {column.articleCount} 篇文章
                  </div>
                  <div className="flex items-center text-cyber-text">
                    <Users className="mr-1 h-4 w-4 text-cyber-cyan" />
                    {column.subscriberCount} 订阅者
                  </div>
                  {column.rating > 0 && (
                    <div className="flex items-center text-cyber-text">
                      <Star className="mr-1 h-4 w-4 text-cyber-cyan" />
                      {column.rating}% 好评
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 md:mt-0">
                <Button
                  className={`cyber-btn ${
                    isSubscribed
                      ? "bg-transparent border border-cyber-cyan text-cyber-cyan"
                      : "bg-cyber-purple text-white"
                  } hover:bg-opacity-80 font-rajdhani py-2 px-6 rounded`}
                  onClick={handleSubscribe}
                  disabled={isSubscribing}
                >
                  {isSubscribing
                    ? "处理中..."
                    : isSubscribed
                      ? "已订阅"
                      : "订阅专栏"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Creator Info */}
        <div className="cyber-border bg-cyber-surface rounded-lg p-4 md:p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex items-center mb-4 md:mb-0 md:mr-6">
              <div className="w-12 h-12 rounded-full bg-cyber-purple flex items-center justify-center mr-3">
                <span className="font-rajdhani text-lg text-white">
                  {creator ? getInitials(creator.username) : "??"}
                </span>
              </div>
              <div>
                <h3 className="font-rajdhani font-semibold text-xl text-white">
                  {isLoadingCreator
                    ? "加载中..."
                    : creator
                      ? creator.username
                      : "未知创作者"}
                </h3>
                <p className="text-cyber-text text-sm">
                  {creator?.bio || "这位创作者还没有添加个人简介"}
                </p>
              </div>
            </div>

            <div className="flex-grow"></div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                className="border-cyber-cyan text-cyber-cyan"
              >
                <Heart className="mr-2 h-4 w-4" /> 关注创作者
              </Button>
              <Link href={`/columns?creator=${column.creatorId}`}>
                <Button
                  variant="outline"
                  className="border-cyber-purple text-cyber-purple"
                >
                  查看全部专栏
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Articles List Sidebar */}
        <div className="lg:col-span-1">
          <Card className="cyber-border bg-cyber-surface rounded-lg overflow-hidden sticky top-24">
            <div className="p-4 border-b border-cyber-purple">
              <h3 className="font-rajdhani font-semibold text-xl text-white">
                文章列表
              </h3>
            </div>

            <div className="divide-y divide-cyber-purple max-h-[500px] overflow-y-auto">
              {isLoadingArticles ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyber-purple mx-auto"></div>
                  <p className="text-cyber-text mt-2">加载文章中...</p>
                </div>
              ) : articles.length === 0 ? (
                <div className="p-4 text-center text-cyber-text">暂无文章</div>
              ) : (
                articles.map((article: Article) => (
                  <button
                    key={article.id}
                    className={`w-full text-left p-4 transition-colors ${
                      selectedArticleId === article.id
                        ? "bg-cyber-purple bg-opacity-20"
                        : "hover:bg-cyber-surface hover:bg-opacity-50"
                    }`}
                    onClick={() => setSelectedArticleId(article.id)}
                  >
                    <div className="font-rajdhani font-medium text-cyber-text">
                      {article.order}. {article.title}
                    </div>
                    <div className="text-xs text-cyber-text opacity-70 mt-1">
                      {formatDate(article.createdAt)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Article Content */}
        <div className="lg:col-span-3">
          <Card className="cyber-border bg-cyber-surface rounded-lg p-6">
            {articleContent ? (
              <MarkdownViewer content={articleContent} />
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyber-purple mx-auto mb-4"></div>
                <p className="text-cyber-text">加载文章内容...</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
