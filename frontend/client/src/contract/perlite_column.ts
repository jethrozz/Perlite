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
import { queryByAddressAndType } from "@/contract/perlite_server";

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
        const json = edge.node.contents?.json;
        console.log("json", json);
        return {
          id: json.id,
          name: json.name,
          parent: json.parent,
          is_root: json.is_root,
          created_at: new Date(parseInt(json.created_at)),
          updated_at: new Date(parseInt(json.updated_at)),
        } as Directory;
      }) || []
    );
  };

  let hasNextPage = false;
  do {
    const currentPage: any = await suiGraphQLClient.query({
      query: queryByAddressAndType,
      variables: { address, type, cursor: endCursor },
    });
    result.push(...parseColumnData(currentPage.data));

    endCursor = currentPage.data?.address?.objects?.pageInfo?.endCursor;
    hasNextPage = currentPage.data?.address?.objects?.pageInfo?.hasNextPage;
  } while (hasNextPage);
  return result;
}
