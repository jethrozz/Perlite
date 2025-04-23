module perlite::perlite_market {
    use sui::object::{Self, UID, ID};
    use std::string::{Self, String};
    use perlite::{perlite_sync::{File}};


    public struct Column has key {
        id: UID,
        payment_method: ID,
        update_method: ID,
        name: String,
        desc: String,
        is_rated: bool,
    }

    public struct Installment has key, store {
        id: UID,
        belong_column: ID,
        no: u64,
        files: vector<File>
    }

    /*
    * 更新方式
    * 从since起每day_number天更新installment_number期
    */
    public struct UpdateMethod has key {
        id: UID,
        since: u64,
        day_number: u64,
        installment_number: u64,
    }

    /*  *
    * 支付方式
    */
    public struct PaymentMethod has key {
        id: UID,
        pay_type: u8,//0买断，1质押
        coin_type: String,
        fee: u64, //目前只支持sui,精度9位
        statke_people_number: u64, //满足数量人数质押才开启
    }


    
}
