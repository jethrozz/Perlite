import React from "react";
import { Button } from "@/components/ui/button";

/**
 * 简化版钱包连接组件 - 不依赖SUI库，避免导入问题
 */
export const WalletConnection = () => {
  const handleWalletInstall = () => {
    window.open("https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil", "_blank");
    
    alert("请按照以下步骤连接钱包:\n1. 安装Sui钱包浏览器扩展\n2. 设置或导入您的钱包\n3. 刷新本页面后使用");
  };
  
  return (
    <Button
      className="bg-cyber-purple hover:bg-opacity-80 text-white font-rajdhani py-1.5 px-4 rounded flex items-center shadow-neon border-2 border-[#9333EA] dark:border-[#6b21a8] animate-pulse-slow"
      onClick={handleWalletInstall}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4 mr-2" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" 
        />
      </svg>
      连接钱包
    </Button>
  );
};
