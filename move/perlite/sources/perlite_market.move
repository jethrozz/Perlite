module perlite::perlite_market {
    use sui::object::{Self, UID, ID};
    use sui::{clock::Clock, random::{Self, Random, RandomGenerator}, tx_context::{Self, TxContext}, transfer, vec_map::{Self, VecMap}, coin::{Self, Coin}};
    use perlite::perlite_version::{Self, GlobalConfig};
    use std::string::{Self, String};
    use perlite::{perlite_sync::{File}};
    use sui::table::{Self, Table};


    // 权限
    public struct PerliteAdminCap has key, store {
        id: UID
    }

    public struct Market has key, store{
        id: UID,
        cut: u64, //非买断手续费 10000 = 100% 
        buyout_cut_fee: u64, //买断手续费: 10000 = 100%
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
        balance: u64, //余额
        is_rated: bool,
        status: u64, //0: 未发布, 1: 已发布, 2: 已下架
        created_at: u64,
        updated_at: u64,
        plan_installment_number: u64, //计划期数
        subscriptions: Table<ID, u8>, //所有订阅者对象
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

    public struct SubscriptionCap has key, store  {
        id: UID,
        column_id: ID,
        payment_method: ID,
        created_at: u64,
    }

    const E_NOT_SUPPORT_PAY_TYPE: u64 = 1001;
    const E_NOT_SUPPORT_COIN_TYPE: u64 = 1002;
    const E_NOT_COLUMN_PAY_NOT_MATCH: u64 = 1003;
    const E_NOT_FEE_NOT_ENOUGH: u64 = 1004;

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

        //买断抽成千分之3，非买断抽成千分之1 
        let market = Market { id: object::new(ctx), cut: 10, buyout_cut_fee: 30};
        transfer::public_transfer(market, ctx.sender());
    }


    public fun create_payment_method(
        pay_type: u8,
        coin_type: String,
        decimals: u64,
        fee: u64,
        statke_people_number: u64,
        market_config: &MarketConfig,
        global_config: &GlobalConfig,
        ctx: &mut TxContext
    ): PaymentMethod{
        //版本检查
        perlite_version::assert_valid_version(global_config);

        if (!market_config.support_pay_type.contains(pay_type)) {
            abort E_NOT_SUPPORT_PAY_TYPE;
        }
        if (!market_config.support_coin.contains(coin_type)) {
            abort E_NOT_SUPPORT_COIN_TYPE;
        }
        
        let pay = PaymentMethod { id: object::new(ctx), pay_type, coin_type, decimals, fee, statke_people_number };
        transfer::public_transfer(pay, ctx.sender());
        return pay;
    }
    
    public fun create_update_method(
        since: u64,
        day_number: u64,
        installment_number: u64,
        global_config: &GlobalConfig,
        ctx: &mut TxContext
    ): UpdateMethod{
                //版本检查
        perlite_version::assert_valid_version(global_config);
        let update = UpdateMethod { id: object::new(ctx), since, day_number, installment_number, fee};
        transfer::public_transfer(update, ctx.sender());
        return update;
    }

    public entry fun create_column(
        name: String,
        desc: String,
        update_method: &UpdateMethod,
        payment_method: &PaymentMethod,
        is_rated: bool,
        plan_installment_number: u64,
        clock: &Clock, 
        global_config: &GlobalConfig,
        ctx: &mut TxContext
    ){
                        //版本检查
        perlite_version::assert_valid_version(global_config);

        let pay_method_id = object::id(payment_method);
        let update_method_id = object::id(update_method);
        let now = clock.timestamp_ms();
        let column = Column { 
            id: object::new(ctx),
            update_method: update_method_id,
            payment_method: pay_method_id,
            name, 
            desc, 
            all_installment: vector::new(), 
            is_rated 
            plan_installment_number,
            status: 0,
            created_at: now,
            updated_at: now,
            subscriptions: table::new(ctx),
        };
        
        transfer::public_transfer(column, ctx.sender());
    }
    //修改基本信息
    public fun edit_column_base_info(
        column: &mut Column,
        new_name: String,
        new_desc: String,
        new_plan_installment_number: u64,
        clock: &Clock,
        ctx: &mut TxContext){
            column.name = new_name;
            column.desc = new_desc;
            column.plan_installment_number = new_plan_installment_number;
            column.updated_at = clock.timestamp_ms();
    }

    public fun publish_column(
        column: &mut Column,
        clock: &Clock,
        ctx: &mut TxContext){
            column.status = 1;
            column.updated_at = clock.timestamp_ms();
    }

    public fun off_shelf_column(
        column: &mut Column,
        clock: &Clock,
        ctx: &mut TxContext){
            column.status = 2;
            column.updated_at = clock.timestamp_ms();
    }

    public fun add_installment(
        column: &mut Column,
        files: vector<File>,
        clock: &Clock,
        global_config: &GlobalConfig,
        ctx: &mut TxContext){
                        //版本检查
            perlite_version::assert_valid_version(global_config);               
            let col_id = object::id(column);
            let file_ids = vector::new();
            for file in files {
                let file_id = object::id(file);
                file_ids.push(file_id);
            }
            
            let installment = Installment{
                id: object::new(ctx),
                belong_column: col_id,
                no: column.all_installment.len() + 1,
                files: file_ids,
            }
            column.all_installment.push(object::id(&installment));
            column.updated_at = clock.timestamp_ms();
            transfer::public_transfer(installment, ctx.sender());
        }

    public fun del_installment(
        column: &mut Column,
        installment: &mut Installment,
        clock: &Clock,
        ctx: &mut TxContext){
            let col_id = object::id(column);
            let installment_id = object::id(installment);
            column.all_installment.remove(installment_id);
                
            //删除installment

            object::destroy(installment, ctx);
            column.updated_at = clock.timestamp_ms();
        }

    public fun subscription_column<coin_type>(
        market: &Market,
        column: &mut Column,
        payment_method: &PaymentMethod,
        fee: Coin<coin_type>, //支付费用
        clock: &Clock,
        global_config: &GlobalConfig,
        ctx: &mut TxContext){
            //版本检查
            perlite_version::assert_valid_version(global_config);
            //检查支付方式是否匹配
            assert!(object::id(payment_method) == column.payment_method, E_NOT_COLUMN_PAY_NOT_MATCH);
            //检查支付金额是否足够
            assert!(fee.balance >= payment_method.fee, E_NOT_FEE_NOT_ENOUGH);
            


            let sub = SubscriptionCap{
                id: object::new(ctx),
                column_id: object::id(column),
                payment_method: object::id(payment_method),
                created_at: clock.timestamp_ms(),
            }
            let sub_id = object::id(&sub);
            column.subscriptions.add(sub_id, 0);
            column.updated_at = clock.timestamp_ms();
            transfer::public_transfer(sub, ctx.sender());
        }

    fun approve_internal(id: vector<u8>, sub: &SubscriptionCap, column: &Column, payment_method: &PaymentMethod): bool {
        let sub_id = object::id(sub);
        let col_id = object::id(column);
        let pay_method_id = object::id(payment_method);
        
        if(pay_method_id != sub.payment_method) {
            return false
        };
        
        if (pay_method_id != column.payment_method) {
            return false
        };
        //已存在的订阅者中没有这个订阅者
        if(!column.subscriptions.contains(sub_id)){
            return false
        };
        // Check if the id has the right prefix
        is_prefix(column.id.to_bytes(), id)
    }

    entry fun seal_approve(id: vector<u8>, sub: &SubscriptionCap, column: &Column, payment_method: &PaymentMethod) {
        assert!(approve_internal(id, sub, column, c), ENoAccess);
    }
}
