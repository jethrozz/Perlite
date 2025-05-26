//定义各种数据对象
export type Directory = {
  id: string;
  name: string;
  parent: string;
  is_root: boolean;
  created_at: Date;
  updated_at: Date;
};
export type PerliteVault = {
  id: string;
  name: string;
  directories: Array<PerliteVaultDir>;
  files: Array<File>;
  created_at: Date;
  updated_at: Date;
};
export type PerliteVaultDir = {
  id: string;
  name: string;
  directories: Array<PerliteVaultDir>;
  files: Array<File>;
  created_at: Date;
  updated_at: Date;
};

export type File = {
  id: string;
  title: string;
  belong_dir: string;
  blob_id: string;
  end_epoch: number;
  created_at: Date;
  updated_at: Date;
  content: string;
};

export type ColumnCap = {
  id: string;
  created_at: Date;
  column_id: string;
  name: string;
  description: string;
  link: string;
  image_url: string;
  project_url: string;
  creator: string;
  other: ColumnOtherInfo;
};
export type ColumnOtherInfo = {
  id: string;
  name: string;
  desc: string;
  cover_img_url: string;
  update_method: UpdateMethod | null;
  payment_method: PaymentMethod | null;
  plan_installment_number: number; //计划期数
  all_installment: Array<Installment>;
  all_installment_ids: Array<string>;
  balance: number;
  is_rated: boolean;
  status: number;
  subscriptions: number; //订阅者数量
  update_at: Date;
  creator: string;
};
export type UpdateMethod = {
  id: string;
  since: Date;
  day_number: number;
  installment_number: number;
};
export type PaymentMethod = {
  id: string;
  pay_type: number; //0买断，1质押, 2订阅
  coin_type: string;
  decimals: number;
  fee: number; //目前只支持sui,精度9位
  subscription_time: number; //订阅时长，用于支持质押模式和订阅模式，单位天
};

export type Installment = {
  id: string;
  belong_column: string;
  no: number;
  files: Array<string>;
};
export type InstallmentWithFiles = {
  id: string;
  belong_column: string;
  no: number;
  files: Array<File>;
};

export type Subscription = {
  id: string;
  column_id: string;
  created_at: Date;
  sub_start_time: Date;
  column: ColumnOtherInfo|null;
};