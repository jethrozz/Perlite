import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CyberpunkDivider } from "@/components/cyberpunk-divider";
import { ColumnCard } from "@/components/column-card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Pencil, User, LogOut, BookText, ChevronRight } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  isCreator: boolean;
  avatar: string | null;
  bio: string | null;
}

interface Column {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  creatorId: number;
  articleCount: number;
  isHot: boolean;
  isNew: boolean;
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  
  // Fetch user profile
  const { 
    data: user,
    isLoading: isLoadingUser,
    isError: isErrorUser,
  } = useQuery({
    queryKey: ["/api/auth/current-user"],
    onError: () => {
      // Redirect to login if not authenticated
      setLocation("/login");
    },
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setBio(user.bio || "");
      setAvatar(user.avatar || "");
    }
  }, [user]);

  // Fetch user subscriptions
  const { 
    data: subscriptions = [],
    isLoading: isLoadingSubscriptions,
  } = useQuery({
    queryKey: ["/api/users/current/subscriptions"],
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { bio?: string; avatar?: string }) => {
      return apiRequest("PATCH", `/api/users/${user.id}`, profileData);
    },
    onSuccess: () => {
      toast({
        title: "更新成功",
        description: "您的个人资料已更新",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/current-user"] });
    },
    onError: () => {
      toast({
        title: "更新失败",
        description: "无法更新您的个人资料，请稍后重试",
        variant: "destructive",
      });
    },
  });

  const handleUpdateProfile = () => {
    if (!user) return;
    
    updateProfileMutation.mutate({
      bio,
      avatar
    });
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "登出成功",
        description: "您已成功登出账户",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "登出失败",
        description: "无法登出账户，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleBecomeCreator = async () => {
    try {
      await apiRequest("POST", "/api/users/become-creator");
      toast({
        title: "成功",
        description: "您已成功成为创作者！",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/current-user"] });
    } catch (error) {
      toast({
        title: "错误",
        description: "无法完成操作，请稍后重试",
        variant: "destructive",
      });
    }
  };

  if (isLoadingUser) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyber-purple"></div>
      </div>
    );
  }

  if (isErrorUser) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="cyber-border bg-cyber-surface p-8 rounded-lg text-center">
          <h2 className="font-rajdhani text-2xl text-cyber-magenta mb-4">无法加载个人资料</h2>
          <p className="text-cyber-text mb-6">请尝试重新登录</p>
          <Link href="/login">
            <Button className="cyber-btn bg-cyber-purple hover:bg-opacity-80 text-white font-rajdhani py-2 px-6 rounded">
              登录
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="font-rajdhani font-bold text-3xl md:text-4xl text-cyber-text">
          <span className="text-cyber-purple">#</span> My Space
        </h1>
        
        {user?.isCreator && (
          <div className="flex space-x-3">
            <Link href="/creator/dashboard">
              <Button className="cyber-btn bg-cyber-purple hover:bg-opacity-80 text-white font-rajdhani">
                <BookText className="mr-2 h-4 w-4" /> Creator Center
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      <CyberpunkDivider className="mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1">
          <Card className="cyber-border bg-cyber-surface rounded-lg overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-cyber-text font-rajdhani">Profile</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-cyber-purple"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-4 border-2 border-cyber-purple">
                  <AvatarImage src={user.avatar || ""} />
                  <AvatarFallback className="bg-cyber-purple text-white text-xl font-rajdhani">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
                
                {isEditing ? (
                  <div className="space-y-4 w-full">
                    <div className="space-y-2">
                      <label className="text-sm text-cyber-text">Avatar URL</label>
                      <Input 
                        placeholder="Enter avatar image URL" 
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        className="cyber-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-cyber-text">Bio</label>
                      <textarea
                        placeholder="Tell about yourself..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="w-full p-3 rounded bg-cyber-surface border border-cyber-purple text-cyber-text focus:outline-none focus:ring-1 focus:ring-cyber-glow"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        className="border-cyber-magenta text-cyber-magenta"
                        onClick={() => {
                          setIsEditing(false);
                          setBio(user.bio || "");
                          setAvatar(user.avatar || "");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="bg-cyber-purple text-white"
                        onClick={handleUpdateProfile}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-rajdhani font-semibold text-white">{user.username}</h2>
                    <p className="text-sm text-cyber-text opacity-70 mb-4">{user.email}</p>
                    <div className={`px-3 py-1 rounded mb-4 ${user.isCreator ? 'bg-cyber-purple bg-opacity-20 text-cyber-purple' : 'bg-cyber-cyan bg-opacity-20 text-cyber-cyan'}`}>
                      {user.isCreator ? 'Creator' : 'Subscriber'}
                    </div>
                    {user.bio ? (
                      <p className="text-cyber-text text-sm text-center">{user.bio}</p>
                    ) : (
                      <p className="text-cyber-text text-sm text-center opacity-50">No bio available</p>
                    )}
                  </>
                )}
              </div>
              
              <div className="space-y-4 pt-4 border-t border-cyber-purple">
                {!user.isCreator && (
                  <Button 
                    variant="outline" 
                    className="w-full border-cyber-cyan text-cyber-cyan"
                    onClick={handleBecomeCreator}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Become Creator
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full border-cyber-magenta text-cyber-magenta"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="subscriptions">
            <div className="border-b border-cyber-purple mb-6">
              <TabsList className="bg-transparent">
                <TabsTrigger 
                  value="subscriptions" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-cyber-purple data-[state=active]:text-cyber-cyan bg-transparent"
                >
                  My Subscriptions
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-cyber-purple data-[state=active]:text-cyber-cyan bg-transparent"
                >
                  Account Settings
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="subscriptions">
              <h2 className="font-rajdhani font-bold text-2xl text-cyber-text mb-4">My Subscriptions</h2>
              
              {isLoadingSubscriptions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="cyber-border bg-cyber-surface rounded-lg overflow-hidden h-64 animate-pulse">
                      <div className="h-40 bg-cyber-dark"></div>
                      <div className="p-4">
                        <div className="h-5 bg-cyber-dark rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-cyber-dark rounded w-full mb-3"></div>
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 rounded-full bg-cyber-dark mr-2"></div>
                          <div className="h-4 bg-cyber-dark rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : subscriptions.length === 0 ? (
                <Card className="cyber-border bg-cyber-surface p-8 text-center">
                  <BookText className="h-12 w-12 text-cyber-purple mx-auto mb-4 opacity-50" />
                  <h3 className="font-rajdhani text-xl text-white mb-2">You haven't subscribed to any columns yet</h3>
                  <p className="text-cyber-text mb-6">Browse and subscribe to columns that interest you to start your learning journey</p>
                  <Link href="/columns">
                    <Button className="cyber-btn bg-cyber-purple hover:bg-opacity-80 text-white font-rajdhani">
                      Browse Columns <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subscriptions.map((column: Column) => (
                    <ColumnCard
                      key={column.id}
                      id={column.id}
                      title={column.title}
                      description={column.description}
                      thumbnailUrl={column.thumbnailUrl || undefined}
                      creatorId={column.creatorId}
                      creatorName=""
                      articleCount={column.articleCount}
                      isHot={column.isHot}
                      isNew={column.isNew}
                      isSubscribed={true}
                      isAuthenticated={true}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="settings">
              <h2 className="font-rajdhani font-bold text-2xl text-cyber-text mb-4">Account Settings</h2>
              
              <Card className="cyber-border bg-cyber-surface">
                <CardHeader>
                  <CardTitle className="text-cyber-text font-rajdhani">Personal Information</CardTitle>
                  <CardDescription className="text-cyber-text opacity-70">
                    Manage your personal information and account settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-cyber-text">Username</label>
                      <Input 
                        value={user.username}
                        disabled
                        className="cyber-input bg-cyber-dark border-cyber-surface focus:border-cyber-purple"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-cyber-text">Email</label>
                      <Input 
                        value={user.email}
                        disabled
                        className="cyber-input bg-cyber-dark border-cyber-surface focus:border-cyber-purple"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-cyber-text">Change Password</label>
                    <div className="flex space-x-2">
                      <Input 
                        type="password"
                        placeholder="Current password"
                        className="cyber-input"
                      />
                      <Input 
                        type="password"
                        placeholder="New password"
                        className="cyber-input"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button className="cyber-btn bg-cyber-purple hover:bg-opacity-80 text-white font-rajdhani">
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="cyber-border bg-cyber-surface mt-6">
                <CardHeader>
                  <CardTitle className="text-cyber-text font-rajdhani">隐私设置</CardTitle>
                  <CardDescription className="text-cyber-text opacity-70">
                    管理您的隐私和通知设置
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-cyber-text font-medium">电子邮件通知</h3>
                        <p className="text-cyber-text opacity-70 text-sm">接收关于您订阅的专栏更新的通知</p>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked
                          className="rounded border-cyber-purple bg-cyber-dark text-cyber-purple"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-cyber-text font-medium">公开个人资料</h3>
                        <p className="text-cyber-text opacity-70 text-sm">允许其他用户查看您的个人资料</p>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked
                          className="rounded border-cyber-purple bg-cyber-dark text-cyber-purple"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="cyber-border bg-cyber-surface mt-6">
                <CardHeader>
                  <CardTitle className="text-cyber-text font-rajdhani text-red-500">危险区域</CardTitle>
                  <CardDescription className="text-cyber-text opacity-70">
                    这些操作无法撤销，请谨慎操作
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="border-red-500 text-red-500">
                    删除账户
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
