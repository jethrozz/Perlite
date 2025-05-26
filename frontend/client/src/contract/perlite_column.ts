import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import {
  DIR_TYPE,
  FILE_TYPE,
  COLUMN_CAP_TYPE,
  INSTALLMENT_TYPE,
  UPDATE_TYPE,
  PAYMENT_TYPE,
  SUBSCRIPTION_TYPE,
  GRAPHQL_URL,
  COLUMN_TYPE,
} from "@/constants";
import {
  PerliteVault,
  PerliteVaultDir,
  Directory,
  File,
  ColumnCap,
  ColumnOtherInfo,
  Installment,
  UpdateMethod,
  PaymentMethod,
  InstallmentWithFiles,
  Subscription,
} from "@shared/data";
import {
  queryByAddressAndType,
  queryByAddress,
  getObjectsByType,
} from "@/contract/perlite_server";

export async function getMySubscriptions(
  address: string,
): Promise<Array<Subscription>> {
  const suiGraphQLClient = new SuiGraphQLClient({ url: GRAPHQL_URL });
  const type = SUBSCRIPTION_TYPE;
  let endCursor: string | null | undefined = null;
  const parseSubscriptionData = (data: any) => {
    return (
      data?.address?.objects?.edges.map((edge: any) => {
        const json = edge.node.contents?.json;
        /**  id: string;
  column_id: string;
  created_at: number;
  sub_start_time: number;
  column: ColumnOtherInfo; */
        return {
          id: json.id,
          column_id: json.column_id,
          created_at: new Date(parseInt(json.created_at)),
          sub_start_time: new Date(parseInt(json.sub_start_time)),
          column: {},
        } as Subscription;
      }) || []
    );
  };

  const result: Subscription[] = [];
  let hasNextPage = false;
  do {
    const currentPage: any = await suiGraphQLClient.query({
      query: queryByAddressAndType,
      variables: { address, type, cursor: endCursor },
    });
    let subCap = parseSubscriptionData(currentPage.data);
    result.push(...subCap);
    const columnIds = subCap.map((c) => c.column_id);
    const otherInfos = await getColumnsByIds(columnIds);
    for (const otherInfo of otherInfos) {
      const subscription = result.find((c) => c.column_id === otherInfo.id);
      if (subscription) {
        subscription.column = otherInfo;
      }
    }
    endCursor = currentPage.data?.address?.objects?.pageInfo?.endCursor;
    hasNextPage = currentPage.data?.address?.objects?.pageInfo?.hasNextPage;
  } while (hasNextPage);

  return result;
}

export async function getAllColumns(): Promise<Array<ColumnOtherInfo>> {
  const suiGraphQLClient = new SuiGraphQLClient({ url: GRAPHQL_URL });
  const { data } = await suiGraphQLClient.query({
    query: getObjectsByType,
    variables: { type: COLUMN_TYPE, limit: 20, endCorsur: null },
  });

  let nodes = data?.objects?.nodes as any[];
  let ids = [];
  if (nodes.length > 0) {
    for (let i = 0; i < nodes.length; i++) {
      const json = nodes[i].asMoveObject?.contents?.json;
      ids.push(json.id);
    }
    return getColumnsByIds(ids);
  }
  return [];
}

export async function getOneInstallment(
  id: string,
): Promise<InstallmentWithFiles | null> {
  const suiGraphQLClient = new SuiGraphQLClient({ url: GRAPHQL_URL });
  const { data } = await suiGraphQLClient.query({
    query: queryByAddress,
    variables: { ids: new Array(id) },
  });
  let edges = data?.objects?.edges as any[];
  let fileIds = [];
  if (edges.length > 0) {
    const json = edges[0].node.asMoveObject?.contents?.json;
    fileIds.push(...json.files);
    let installment: InstallmentWithFiles = {
      id: json.id,
      belong_column: json.belong_column,
      no: json.no,
      files: [],
    } as InstallmentWithFiles;
    const { data: fileData } = await suiGraphQLClient.query({
      query: queryByAddress,
      variables: { ids: fileIds },
    });
    let fileEdges = fileData?.objects?.edges as any[];
    for (const edge of fileEdges) {
      const fileJson = edge.node.asMoveObject?.contents?.json;
      /**  id: string;
  title: string;
  belong_dir: string;
  blob_id: string;
  end_epoch: number;
  created_at: Date;
  updated_at: Date; */
      installment.files.push({
        id: fileJson.id,
        title: fileJson.title,
        belong_dir: fileJson.belong_dir,
        blob_id: fileJson.blob_id,
        end_epoch: fileJson.end_epoch,
        created_at: new Date(parseInt(fileJson.created_at)),
        updated_at: new Date(parseInt(fileJson.updated_at)),
        content: "",
      });

      return installment;
    }
  }
  return null;
}

export async function getUserOwnedInstallments(
  columnId: string,
): Promise<Array<Installment>> {
  let result: Installment[] = [];
  const suiGraphQLClient = new SuiGraphQLClient({ url: GRAPHQL_URL });
  const type = INSTALLMENT_TYPE;
  const { data } = await suiGraphQLClient.query({
    query: queryByAddress,
    variables: { ids: new Array(columnId) },
  });
  let edges = data?.objects?.edges as any[];
  let installmentIds = [];
  if (edges.length > 0) {
    const json = edges[0].node.asMoveObject?.contents?.json;
    installmentIds.push(...json.all_installment);
    const { data: installmentData } = await suiGraphQLClient.query({
      query: queryByAddress,
      variables: { ids: installmentIds },
    });
    let installmentEdges = installmentData?.objects?.edges as any[];
    for (const edge of installmentEdges) {
      const installmentJson = edge.node.asMoveObject?.contents?.json;
      result.push({
        id: installmentJson.id,
        belong_column: installmentJson.belong_column,
        no: installmentJson.no,
        files: installmentJson.files,
      });
    }
  }
  return result;
}

export async function getUserOwnedColumns(
  address: string,
): Promise<Array<ColumnCap>> {
  const suiGraphQLClient = new SuiGraphQLClient({ url: GRAPHQL_URL });
  const type = COLUMN_CAP_TYPE;

  let endCursor: string | null | undefined = null;
  const result: ColumnCap[] = [];
  const parseColumnData = (data: any) => {
    return (
      data?.address?.objects?.edges.map((edge: any) => {
        /**
         *   id: string;
  created_at: Date;
  column_id: string;
  name: string;
  description: string;
  link: string;
  image_url: string;
  project_url: string;
  creator: string;
  other: ColumnOtherInfo;
         */
        /**
         *   update_method: UpdateMethod;
  payment_method: PaymentMethod;
  plan_installment_number: number; //计划期数
  all_installment: Array<Installment>;
  balance: number;
  is_rated: boolean;
  status: number;
  subscriptions: number; //订阅者数量
         */
        const json = edge.node.contents?.json;
        return {
          id: json.id,
          name: json.name,
          description: json.parent,
          column_id: json.column_id,
          link: json.link,
          image_url: json.image_url,
          project_url: json.project_url,
          creator: json.creator,
          other: {
            update_method: {},
            payment_method: {},
          },
          created_at: new Date(parseInt(json.created_at)),
        } as ColumnCap;
      }) || []
    );
  };

  let hasNextPage = false;
  do {
    const currentPage: any = await suiGraphQLClient.query({
      query: queryByAddressAndType,
      variables: { address, type, cursor: endCursor },
    });
    let columCap = parseColumnData(currentPage.data);
    result.push(...columCap);
    const columnIds = columCap.map((c) => c.column_id);
    const otherInfos = await getColumnsByIds(columnIds);
    for (const otherInfo of otherInfos) {
      const columnCap = result.find((c) => c.column_id === otherInfo.id);
      if (columnCap) {
        columnCap.other = otherInfo;
      }
    }
    endCursor = currentPage.data?.address?.objects?.pageInfo?.endCursor;
    hasNextPage = currentPage.data?.address?.objects?.pageInfo?.hasNextPage;
  } while (hasNextPage);
  return result;
}

async function getColumnsByIds(ids: string[]): Promise<ColumnOtherInfo[]> {
  const suiGraphQLClient = new SuiGraphQLClient({ url: GRAPHQL_URL });
  let result: ColumnOtherInfo[] = [];
  try {
    const { data } = await suiGraphQLClient.query({
      query: queryByAddress,
      variables: { ids },
    });
    /**
     *   id: string;
  update_method: UpdateMethod;
  payment_method: PaymentMethod;
  plan_installment_number: number; //计划期数
  all_installment: Array<Installment>;
  balance: number;
  is_rated: boolean;
  status: number;
  subscriptions: number; //订阅者数量
     */
    let waitQueryIds: string[] = [];
    let colOtherInfoMap = new Map<string, ColumnOtherInfo>();
    // 第一次封装，拿到基本信息
    for (const edge of data?.objects?.edges as any[]) {
      const json = edge.node.asMoveObject?.contents?.json;

      let colOtherInfo = {
        id: json.id,
        name: json.name,
        desc: json.desc,
        cover_img_url: json.cover_img_url,
        update_method: null,
        payment_method: null,
        plan_installment_number: parseInt(json.plan_installment_number) || 0,
        all_installment: json.all_installment,
        all_installment_ids: json.all_installment,
        balance: parseInt(json.balance.value) || 0,
        is_rated: json.is_rated || false,
        status: parseInt(json.status) || 0,
        subscriptions: json.subscriptions
          ? parseInt(json.subscriptions?.size)
          : 0,
        update_at: new Date(parseInt(json.updated_at)),
        creator: json.creator,
      } as ColumnOtherInfo;

      result.push(colOtherInfo);
      colOtherInfoMap.set(json.update_method, colOtherInfo);
      waitQueryIds.push(json.update_method);
      colOtherInfoMap.set(json.payment_method, colOtherInfo);
      waitQueryIds.push(json.payment_method);
      json.all_installment?.forEach((i: any) => {
        colOtherInfoMap.set(i, colOtherInfo);
        waitQueryIds.push(i);
      });
    }
    // 第二次封装，拿到update_method和payment_method
    if (waitQueryIds.length > 0) {
      const { data: otherDatas } = await suiGraphQLClient.query({
        query: queryByAddress,
        variables: { ids: waitQueryIds },
      });
      for (const edge of otherDatas?.objects?.edges as any[]) {
        const type = edge.node.asMoveObject?.contents?.type.repr;
        const json = edge.node.asMoveObject?.contents?.json;
        if (type == UPDATE_TYPE) {
          let otherInfo = colOtherInfoMap.get(json.id);
          if (otherInfo) {
            /**
             *   id: string;
  since: Date;
  day_number: number;
  installment_number: number;
             */
            otherInfo.update_method = {
              id: json.id,
              since: new Date(parseInt(json.since)),
              day_number: json.day_number,
              installment_number: json.installment_number,
            };
          }
        } else if (type == PAYMENT_TYPE) {
          /**  id: string;
  pay_type: number; //0买断，1质押, 2订阅
  coin_type: String;
  decimals: number;
  fee: number; //目前只支持sui,精度9位
  subscription_time: number; //订阅时长，用于支持质押模式和订阅模式，单位天 */
          let otherInfo = colOtherInfoMap.get(json.id);
          if (otherInfo) {
            otherInfo.payment_method = {
              id: json.id,
              pay_type: json.pay_type,
              coin_type: json.coin_type,
              decimals: json.decimals,
              fee: json.fee / 1000000000,
              subscription_time: json.subscription_time,
            };
          }
        } else if (type == INSTALLMENT_TYPE) {
          let otherInfo = colOtherInfoMap.get(json.id);
          if (otherInfo) {
            /**
             *   id: string;
             *   id: string;
  belong_column: string;
  no: number;
  files: Array<File>;*/
            otherInfo.all_installment.push({
              id: json.id,
              belong_column: json.belong_column,
              no: json.no,
              files: json.files,
            });
          }
        }
      }
    }
    return result;
  } catch (error) {
    console.error("Failed to fetch columns:", error);
    return [];
  }
}
