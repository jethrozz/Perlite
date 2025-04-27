module perlite::perlite_market {
    use sui::object::{Self, UID, ID};
    use sui::{clock::Clock, random::{Self, Random, RandomGenerator}, tx_context::{Self, TxContext}, transfer, vec_map::{Self, VecMap}, coin::{Self, Coin}};

    use std::string::{Self, String};
    use perlite::{perlite_sync::{File}};


    // 权限
    public struct PerliteAdminCap has key, store {
        id: UID
    }

    public struct MarketConfig has key {
        id: UID,
        support_coin: VecSet<String>, //支持的coin类型
        support_pay_type: VecSet<u8>, //支持的支付类型
    }
    public struct Column has key {
        id: UID,
        update_method: ID,
        payment_method: ID,
        name: String,
        desc: String,
        all_installment: vector<ID>, //所有期
        is_rated: bool,
        status: u64, //0: 未发布, 1: 已发布, 2: 已下架
        created_at: u64,
        updated_at: u64,
        plan_installment_number: u64, //计划期数
    }

    public struct Installment has key {
        id: UID,
        belong_column: ID,
        no: u64,
        files: vector<ID>
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
        pay_type: u8,//0买断，1质押, 2订阅
        coin_type: String,
        decimals: u64,
        fee: u64, //目前只支持sui,精度9位
        statke_people_number: u64, //满足数量人数质押才开启
    }

    const E_NOT_SUPPORT_PAY_TYPE: u64 = 1001;
    const E_NOT_SUPPORT_COIN_TYPE: u64 = 1002;
    fun init(ctx: &mut TxContext) {
        //创建管理员权限
        let admin = PerliteAdminCap { id: object::new(ctx) };
        transfer::public_transfer(admin, ctx.sender());

        //创建市场配置
        let mut market_config = MarketConfig { id: object::new(ctx), support_coin: vec_set::new(), support_pay_type: vec_set::new()};
        market_config.support_coin.insert(b"0000000000000000000000000000000000000000000000000000000000000002::sui::SUI".to_string());
        market_config.support_pay_type.insert(0);
        market_config.support_pay_type.insert(1);
        market_config.support_pay_type.insert(2);
        transfer::share_object(market_config, ctx.sender());
    }


    public fun create_payment_method(
        pay_type: u8,
        coin_type: String,
        decimals: u64,
        fee: u64,
        statke_people_number: u64,
        market_config: &MarketConfig,
        ctx: &mut TxContext
    ): PaymentMethod{
        if (!market_config.support_pay_type.contains(pay_type)) {
            abort E_NOT_SUPPORT_PAY_TYPE;
        }
        if (!market_config.support_coin.contains(coin_type)) {
            abort E_NOT_SUPPORT_COIN_TYPE;
        }
        
        PaymentMethod { id: object::new(ctx), pay_type, coin_type, decimals, fee, statke_people_number };
    }
    
    public fun create_update_method(
        since: u64,
        day_number: u64,
        installment_number: u64,
        ctx: &mut TxContext
    ): UpdateMethod{
        UpdateMethod { id: object::new(ctx), since, day_number, installment_number, fee};
    }

    public entry fun create_column(
        name: String,
        desc: String,
        update_method: &UpdateMethod,
        payment_method: &PaymentMethod,
        is_rated: bool,
        
        ctx: &mut TxContext
    ){
        let pay_method_id = object::id(payment_method);
        let update_method_id = object::id(update_method);
        let column = Column { id: object::new(ctx), update_method: update_method_id, payment_method: pay_method_id, name, desc, all_installment: vector::new(), is_rated };
        transfer::public_transfer(column, ctx.sender());
    }
    
}
