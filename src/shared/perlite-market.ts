/**
 *        id: UID,
        update_method: ID,
        payment_method: ID,
        name: String,
        desc: String,
        all_installment: vector<ID>, //所有期
        balance: Balance<SUI>, //余额
        is_rated: bool,
        status: u64, //0: 未发布, 1: 已发布, 2: 已下架
        created_at: u64,
        updated_at: u64,
        plan_installment_number: u64, //计划期数
        subscriptions: Table<ID, u8>, //所有订阅者对象
 */

export type Series = {
  id: string;
  name: string;
  desc: string;
  thumbnailUrl: string;
  all_installments: Array<string>;
  is_rated: boolean;
  status: number;
  created_at: number;
  updated_at: number;
  plan_installment_number: number;
  subscriptions: Array<string>; //订阅者ID
  update_method: UpdateMethod;
  payment_method: PaymentMethod;
  creator: string;
}
//从since起每day_number天更新installment_number期
export type UpdateMethod = {
    id: string;
    since: number,
    day_number: number,
    installment_number: number,
}

export type PaymentMethod = {
    id: string;
    pay_type: number,//0买断，1质押, 2订阅
    coin_type: String,
    decimals: number,
    fee: number, //目前只支持sui,精度9位
    subscription_time: number, //订阅时长，用于支持质押模式和订阅模式，单位天
}

/**
 *         id: UID,
        belong_column: ID,
        no: u64,
        files: vector<ID>
 */
export type Installment = {
    id: string;
    belong_column: string;
    files: Array<string>;
}


export function getTopN() {
  let result: Array<Series> = [];
  for (let i = 0; i < 10; i++) {
    result.push({
      id: i.toString(),
      name: "name" + i,
      desc: "desc" + i,
      thumbnailUrl: "",
      all_installments: ["all_installments" + i],
      is_rated: false,
      status: 0,
      created_at: 0,
      updated_at: 0,
      plan_installment_number: 0,
      subscriptions: ["subscriptions" + i],
      update_method: {
        id: "update_method" + i,
        since: 0,
        day_number: 0,
        installment_number: 0,
      },
      payment_method: {
        id: "payment_method" + i,
        pay_type: 0,
        coin_type: "coin_type" + i,
        decimals: 0,
        fee: 0,
        subscription_time: 0,
      },
      creator: "creator" + i,
    })
  }

  return result;
}