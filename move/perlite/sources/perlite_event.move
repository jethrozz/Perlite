module perlite::perlite_event{
    use sui::object::{Self, UID, ID};
    use std::string::{Self, String};


    //用户上架专栏
    public struct ColumnPublishEvent has copy, drop{
        user: address,
        column_id: ID,
        column_name: String,
        payment_method: ID,
        update_method: ID,
        is_rated: bool,
    }

    //用户更新专栏
    public struct ColumnUpdateEvent has copy, drop{
        user: address,
        column_id: ID,
        column_name: String,
        payment_method: ID,
        update_method: ID,
        is_rated: bool,
    }

    //用户下架专栏的英文是：User delist a column
    public struct ColumnDelistEvent has copy, drop{
        user: address,
        column_id: ID,
    }

    //用户删除专栏
    public struct ColumnDeleteEvent has copy, drop{
        user: address,
        column_id: ID,
    }
    //用户订阅专栏
    public struct ColumnSubscribeEvent has copy, drop{
        user: address,
        column_id: ID,
    }
    //用户结束订阅专栏
    public struct ColumnUnsubscribeEvent has copy, drop{
        user: address,
        column_id: ID,
    }
    //用户专栏每期发布
    public struct ColumnInstallmentPublishEvent has copy, drop{
        user: address,
        column_id: ID,
        installment_id: ID,
        installment_no: u64,
    }





}