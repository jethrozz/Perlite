module perlite::perlite_event{
    use std::string::{String};
    use sui::event::{Self};


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
        new_column_name: String,
        old_column_name: String,
        new_columt_desc: String,
        old_column_desc: String,
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
        start_time: u64,
        end_time: u64,
        fee: u64,
        cut_fee: u64,
        coin_type: String,
        payment_method: ID,
    }
    //用户续费专栏
    public struct ColumnRenewEvent has copy, drop{
        user: address,
        column_id: ID,
        start_time: u64,
        end_time: u64,
        payment_method: ID,
        fee: u64,
        cut_fee: u64,
        coin_type: String,
    }

    //用户专栏每期更新
    public struct ColumnInstallmentPublishEvent has copy, drop{
        user: address,
        column_id: ID,
        installment_id: ID,
        installment_no: u64,
    }



    public(package) fun publish_column_event(user: address, column_id: ID, column_name: String, payment_method: ID, update_method: ID, is_rated: bool){
        event::emit(ColumnPublishEvent{
            user,
            column_id,
            column_name,
            payment_method,
            update_method,
            is_rated,
        })
    }

    public(package) fun update_column_event(user: address, column_id: ID, new_column_name: String, old_column_name: String, new_columt_desc: String, old_column_desc: String, is_rated: bool){
        event::emit(ColumnUpdateEvent{
            user,
            column_id,
            new_column_name,
            old_column_name,
            new_columt_desc,
            old_column_desc,
            is_rated,
        })
    }
    public(package) fun delist_column_event(user: address, column_id: ID){
        event::emit(ColumnDelistEvent{
            user,
            column_id,
        })
    }
    public(package) fun delete_column_event(user: address, column_id: ID){
        event::emit(ColumnDeleteEvent{
            user,
            column_id,
        })
    }
    public(package) fun subscribe_column_event(user: address, column_id: ID, start_time: u64, end_time: u64, payment_method: ID, fee: u64, cut_fee: u64, coin_type: String){
        event::emit(ColumnSubscribeEvent{
            user,
            column_id,
            start_time,
            end_time,
            payment_method,
            fee,
            cut_fee,
            coin_type,
        })
    }

    public(package) fun renew_column_event(user: address, column_id: ID, start_time: u64, end_time: u64, payment_method: ID, fee: u64, cut_fee: u64, coin_type: String){
        event::emit(ColumnRenewEvent{
            user,
            column_id,
            start_time,
            end_time,
            payment_method,
            fee,
            cut_fee,
            coin_type,
        })
    }

    public(package) fun installment_publish_event(user: address, column_id: ID, installment_id: ID, installment_no: u64){
        event::emit(ColumnInstallmentPublishEvent{
            user,
            column_id,
            installment_id,
            installment_no,
        })
    }

}