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
} from "@shared/data";
import { queryByAddressAndType,queryByAddress } from "@/contract/perlite_server";

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
            update_method:{},
            payment_method:{},
          },
          created_at: new Date(parseInt(json.created_at)),
        } as   ColumnCap
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
    const columnIds = columCap.map(c => c.column_id);
    const otherInfos = await getColumnsByIds(columnIds);
    for (const otherInfo of otherInfos) {
      const columnCap = result.find(c => c.column_id === otherInfo.id);
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
      variables: { ids }
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
    let colOtherInfoMap = new Map<string,ColumnOtherInfo>();
    // 第一次封装，拿到基本信息
    for (const edge of data?.objects?.edges as any[]) {
      const json = edge.node.asMoveObject?.contents?.json;

      let colOtherInfo = {
        id: json.id,
        update_method:null,
        payment_method:null,
        plan_installment_number: parseInt(json.plan_installment_number) || 0,
        all_installment: json.all_installment,
        balance: parseInt(json.balance.value) || 0,
        is_rated: json.is_rated || false,
        status: parseInt(json.status) || 0,
        subscriptions: json.subscriptions ? parseInt(json.subscriptions?.size) : 0,
        update_at: new Date(parseInt(json.updated_at)),
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
    if(waitQueryIds.length > 0){
      const { data: otherDatas } = await suiGraphQLClient.query({
        query: queryByAddress,
        variables: { ids: waitQueryIds }
      });
      for (const edge of otherDatas?.objects?.edges as any[]) {
        const type = edge.node.asMoveObject?.contents?.type.repr;
        const json = edge.node.asMoveObject?.contents?.json;
        if(type == UPDATE_TYPE){
          let otherInfo = colOtherInfoMap.get(json.id);
          if(otherInfo){
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
            }
          }
        }else if(type == PAYMENT_TYPE){
          /**  id: string;
  pay_type: number; //0买断，1质押, 2订阅
  coin_type: String;
  decimals: number;
  fee: number; //目前只支持sui,精度9位
  subscription_time: number; //订阅时长，用于支持质押模式和订阅模式，单位天 */
          let otherInfo = colOtherInfoMap.get(json.id);
          if(otherInfo){
            otherInfo.payment_method = {
              id: json.id,
              pay_type: json.pay_type,
              coin_type: json.coin_type,
              decimals: json.decimals,
              fee: json.fee / 1000000000,
              subscription_time: json.subscription_time,
            }
          }
        }else if(type == INSTALLMENT_TYPE){
          let otherInfo = colOtherInfoMap.get(json.id);
          if(otherInfo){
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
            })
          }
        }
      }
    }
    return result;
  } catch (error) {
    console.error('Failed to fetch columns:', error);
    return [];
  }
}
