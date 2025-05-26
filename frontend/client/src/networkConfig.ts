import { getFullnodeUrl } from "@mysten/sui/client";
import {
  PACKAGE_ID,
  DIR_TYPE,
  FILE_TYPE,
  COLUMN_CAP_TYPE,
  GRAPHQL_URL,
  NET_WORK,
  MARKET_CONFIG_ID,
  GLOBAL_CONFIG_ID,
  MARKET_ID,
} from "@/constants.ts";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        packageId: PACKAGE_ID,
        dirType: DIR_TYPE,
        fileType: FILE_TYPE,
        columnCapType: COLUMN_CAP_TYPE,
        graphqlUrl: GRAPHQL_URL,
        netWork: NET_WORK,
        marketConfigId: MARKET_CONFIG_ID,
        globalConfigId: GLOBAL_CONFIG_ID,
        chain: "sui:devnet",
        url: getFullnodeUrl("devnet"),
        marketId: MARKET_ID,
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        packageId: PACKAGE_ID,
        dirType: DIR_TYPE,
        fileType: FILE_TYPE,
        columnCapType: COLUMN_CAP_TYPE,
        graphqlUrl: GRAPHQL_URL,
        netWork: NET_WORK,
        marketConfigId: MARKET_CONFIG_ID,
        globalConfigId: GLOBAL_CONFIG_ID,
        chain: "sui:testnet",
        url: getFullnodeUrl("testnet"),
        marketId: MARKET_ID,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        packageId: PACKAGE_ID,
        dirType: DIR_TYPE,
        fileType: FILE_TYPE,
        columnCapType: COLUMN_CAP_TYPE,
        graphqlUrl: GRAPHQL_URL,
        netWork: NET_WORK,
        marketConfigId: MARKET_CONFIG_ID,
        globalConfigId: GLOBAL_CONFIG_ID,
        chain: "sui:mainnet",
        url: getFullnodeUrl("mainnet"),
        marketId: MARKET_ID,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
