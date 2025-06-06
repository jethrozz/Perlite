module perlite::perlite_market {
    use sui::sui::SUI;
    use sui::{package, display, clock::Clock, coin::{Self, Coin}};
    use perlite::perlite_version::{Self, GlobalConfig};
    use perlite::perlite_util::{ is_prefix};
    use perlite::perlite_event::{Self};
    use std::string::{String};
    use perlite::{perlite_sync::{File}};
    use sui::table::{Self, Table};
    use sui::balance::{Self,Balance};
    use std::string::{Self};
    use std::string::append;
    use sui::coin::split;
    use sui::coin::destroy_zero;
    use sui::sui;
    //彩票的一次性见证者
    public struct PERLITE_MARKET has drop {}
    // 权限
    public struct PerliteAdminCap has key, store {
        id: UID
    }

    public struct Market has key, store{
        id: UID,
        cut: u64, //非买断手续费 10000 = 100% 
        balance: Balance<SUI>, //余额
    }

    public struct MarketConfig has key {
        id: UID,
        support_coin: vector<String>, //支持的coin类型
        support_pay_type: vector<u8>, //支持的支付类型
    }

    public struct ColumnCap has key, store{
        id: UID,
        created_at: u64,
        column_id: ID,
        name: String,
        description: String,
        link: String,
        image_url: String,
        project_url: String,
        creator: String,
    }

    public struct Column has key {
        id: UID,
        update_method: ID,
        payment_method: ID,
        name: String,
        desc: String,
        cover_img_url: String,
        all_installment: vector<ID>, //所有期
        balance: Balance<SUI>, //余额
        is_rated: bool,
        status: u64, //0: 未发布, 1: 已发布, 2: 已下架
        created_at: u64,
        updated_at: u64,
        plan_installment_number: u64, //计划期数
        subscriptions: Table<ID, u8>, //所有订阅者对象
        creator: address,
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
    public struct PaymentMethod has  key {
        id: UID,
        pay_type: u8,//0买断，1质押, 2订阅
        coin_type: String,
        decimals: u64,
        fee: u64, //目前只支持sui,精度9位
        subscription_time: u64, //订阅时长，用于支持质押模式和订阅模式，单位天
    }

    public struct SubscriptionCap has key, store  {
        id: UID,
        column_id: ID,
        created_at: u64,
        sub_start_time: u64,
    }

    const E_NOT_SUPPORT_PAY_TYPE: u64 = 1001;
    const E_NOT_SUPPORT_COIN_TYPE: u64 = 1002;
    const E_NOT_COLUMN_PAY_NOT_MATCH: u64 = 1003;

    const E_NOT_FEE_NOT_ENOUGH: u64 = 1004;
    const E_NO_COLUMN_CAP: u64 = 1005;
    const ENoAccess: u64 = 1007;
    const E_COLUMN_SUBSCRIPTION_NOT_EXIST: u64 = 1008;
    const E_NOT_OVER_TIME: u64 = 1009;
    const E_NOT_PUBLISH: u64 = 1010;
    const E_STATUS_ERROR: u64 = 1011;
    const E_CUT_FEE_NOT_ENOUGH: u64 = 1012;
    fun init(otw: PERLITE_MARKET, ctx: &mut TxContext) {
        //创建管理员权限
        let admin = PerliteAdminCap { id: object::new(ctx) };
        transfer::public_transfer(admin, ctx.sender());

        //创建市场配置
        let mut market_config = MarketConfig { id: object::new(ctx), support_coin: vector::empty(), support_pay_type: vector::empty()};
        market_config.support_coin.push_back(b"0000000000000000000000000000000000000000000000000000000000000002::sui::SUI".to_string());
        market_config.support_pay_type.push_back(0);
        market_config.support_pay_type.push_back(1);
        market_config.support_pay_type.push_back(2);
        transfer::share_object(market_config);

        //创建nft
            let keys = vector[
                b"name".to_string(),
                b"link".to_string(),
                b"image_url".to_string(),
                b"description".to_string(),
                b"project_url".to_string(),
                b"creator".to_string(),
            ];

            let values = vector[
                // For `name` one can use the `Hero.name` property
                b"{name}".to_string(),
                // For `link` one can build a URL using an `id` property
                b"{link}".to_string(),
                // For `image_url` use an IPFS template + `image_url` property.
                b"{image_url}".to_string(),
                // Description is static for all `Hero` objects.
                b"{description}".to_string(),
                // Project URL is usually static
                b"https://perlite.walrus.site".to_string(),
                // Creator field can be any
                b"{creator}".to_string(),
            ];

            // Claim the `Publisher` for the package!
            let publisher = package::claim(otw, ctx);

            // Get a new `Display` object for the `Ticket` type.
            let mut display = display::new_with_fields<ColumnCap>(
                &publisher, keys, values, ctx
            );

            // Commit first version of `Display` to apply changes.
            display.update_version();
            transfer::public_transfer(publisher, ctx.sender());
            transfer::public_transfer(display, ctx.sender());
        //千分之1.5%
        let market = Market { id: object::new(ctx), cut: 15, balance: balance::zero()};
        transfer::share_object(market);
    }


    public fun create_payment_method(
        pay_type: u8,
        coin_type: String,
        decimals: u64,
        fee: u64,
        subscription_time: u64,
        market_config: &MarketConfig,
        global_config: &GlobalConfig,
        ctx: &mut TxContext
    ): PaymentMethod{
        //版本检查
        perlite_version::assert_valid_version(global_config);

        if (!market_config.support_pay_type.contains(&pay_type)) {
            abort E_NOT_SUPPORT_PAY_TYPE
        };
        if (!market_config.support_coin.contains(&coin_type)) {
            abort E_NOT_SUPPORT_COIN_TYPE
        };
        
        return PaymentMethod { id: object::new(ctx), pay_type, coin_type, decimals, fee, subscription_time }
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
        return UpdateMethod {id: object::new(ctx), since, day_number, installment_number}
    }

    public entry fun create_column(
        name: String,
        desc: String,
        cover_img_url: String,
        update_method: UpdateMethod,
        payment_method: PaymentMethod,
        is_rated: bool,
        plan_installment_number: u64,
        clock: &Clock, 
        global_config: &GlobalConfig,
        ctx: &mut TxContext
    ){
                        //版本检查
        perlite_version::assert_valid_version(global_config);
        let now = clock.timestamp_ms();
        
        let pay_method_id = object::id(&payment_method);
        let update_method_id = object::id(&update_method);
        
        transfer::share_object(payment_method);
        transfer::share_object(update_method);
        let column = Column { 
            id: object::new(ctx),
            update_method: update_method_id,
            payment_method: pay_method_id,
            name, 
            desc, 
            cover_img_url,
            all_installment: vector::empty(),
            balance: balance::zero(),
            is_rated,
            plan_installment_number,
            status: 0,
            created_at: now,
            updated_at: now,
            subscriptions: table::new(ctx),
            creator: ctx.sender(),
        };

        let column_id = object::id(&column);

        let col_cap = ColumnCap{
            id: object::new(ctx),
            created_at: now,
            column_id,
            name,
            description: desc,
            link: b"https://perlite.walrus.site".to_string(),
            image_url: cover_img_url,
            project_url: b"".to_string(),
            creator: ctx.sender().to_string(),
        };

        transfer::public_transfer(col_cap, ctx.sender());
        transfer::share_object(column);
    }
    //修改基本信息
    public fun edit_column_base_info(
        column_cap: &ColumnCap,
        column: &mut Column,
        new_name: String,
        new_desc: String,
        new_plan_installment_number: u64,
        clock: &Clock,
        ctx: &mut TxContext){
            assert!(object::id(column) == column_cap.column_id, E_NO_COLUMN_CAP);
            let old_name = column.name;
            let old_desc = column.desc;
            column.name = new_name;
            column.desc = new_desc;
            column.plan_installment_number = new_plan_installment_number;
            column.updated_at = clock.timestamp_ms();

            if(column.status == 1){
                perlite_event::update_column_event(ctx.sender(), object::id(column), column.name, old_name, column.desc, old_desc, column.is_rated);
            }
    }

    public entry fun publish_column(
        column_cap: &ColumnCap,
        column: &mut Column,
        clock: &Clock,
        _ctx: &mut TxContext){
            assert!(object::id(column) == column_cap.column_id, E_NO_COLUMN_CAP);
            column.status = 1;
            column.updated_at = clock.timestamp_ms();
        //专栏发布事件
        perlite_event::publish_column_event(_ctx.sender(), object::id(column), column.name, column.payment_method, column.update_method, column.is_rated)
    }

    public entry fun off_shelf_column(
        column_cap: &ColumnCap,
        column: &mut Column,
        clock: &Clock,
        _ctx: &mut TxContext){
            assert!(object::id(column) == column_cap.column_id, E_NO_COLUMN_CAP);
            //有人订阅，不能下架
            assert!(column.subscriptions.length() > 0, E_STATUS_ERROR);
            column.status = 2;
            column.updated_at = clock.timestamp_ms();
            //专栏下架事件
            perlite_event::delist_column_event(_ctx.sender(), object::id(column));
    }

    public entry fun add_installment(
        column_cap: &ColumnCap,
        column: &mut Column,
        file: &File,
        clock: &Clock,
        global_config: &GlobalConfig,
        ctx: &mut TxContext){
                        //版本检查
            perlite_version::assert_valid_version(global_config); 
            assert!(object::id(column) == column_cap.column_id, E_NO_COLUMN_CAP);   
            let col_id = object::id(column);
            let mut file_ids: vector<ID> = vector::empty();
            file_ids.push_back(object::id(file));
            
            let installment = Installment{
                id: object::new(ctx),
                belong_column: col_id,
                no: column.all_installment.length() + 1,
                files: file_ids,
            };
           let installment_id =  object::id(&installment);
            column.all_installment.push_back(installment_id);
            column.updated_at = clock.timestamp_ms();

            //专栏每期更新事件
            perlite_event::installment_publish_event(ctx.sender(), object::id(column), installment_id, installment.no);
            transfer::share_object(installment);
    }

    public fun add_file_to_installment(
        file: &File,
        installment: &mut Installment,
        _ctx: &mut TxContext){
        let file_id = object::id(file);
        installment.files.push_back(file_id);
    }

    public fun del_installment(
        column_cap: &ColumnCap,
        column: &mut Column,
        installment: &mut Installment,
        clock: &Clock,
        _ctx: &mut TxContext){
            assert!(object::id(column) == column_cap.column_id, E_NO_COLUMN_CAP);
            //已发布的专栏不能删除
            assert!(column.status == 0, E_STATUS_ERROR);
            //let col_id = object::id(column);
            let installment_id = object::id(installment);
            let (exist, index) = column.all_installment.index_of(&installment_id);
            if (!exist) {
                abort 1006
            };
            column.all_installment.remove(index);
            //删除installment
            //todo 
   
            column.updated_at = clock.timestamp_ms();
        }
    //订阅
    public entry fun subscription_column(
        market: &mut Market,
        column: &mut Column,
        payment_method: &PaymentMethod,
        fee: Coin<SUI>, //支付费用
        cut_fee: Coin<SUI>, //手续费
        clock: &Clock,
        global_config: &GlobalConfig,
        ctx: &mut TxContext){
            //版本检查
            perlite_version::assert_valid_version(global_config); 
            //检查是否发布
            assert!(column.status == 1, E_NOT_PUBLISH);
            //检查支付方式是否匹配
            assert!(object::id(payment_method) == column.payment_method, E_NOT_COLUMN_PAY_NOT_MATCH);

            let cut_fee_amount = payment_method.fee * market.cut / 10000;
            assert!(cut_fee.value() >= cut_fee_amount, E_CUT_FEE_NOT_ENOUGH);
            //检查支付金额是否足够
            let sub_fee_amount = payment_method.fee - cut_fee_amount;
            assert!(fee.value() >= sub_fee_amount, E_NOT_FEE_NOT_ENOUGH);
            

            //计算手续费
            
            //扣除手续费
            let cut_fee_balance = coin::into_balance(cut_fee);
            let cut_fee_value = cut_fee_balance.value();
            market.balance.join(cut_fee_balance);
   
            let sub_fee_balance = coin::into_balance(fee);
            let sub_fee_value = sub_fee_balance.value();
            //扣除支付金额
            column.balance.join(sub_fee_balance);
            //生成订阅
            let now = clock.timestamp_ms();
            let sub = SubscriptionCap{
                id: object::new(ctx),
                column_id: object::id(column),
                created_at: now,
                sub_start_time: now,
            };
            let sub_id = object::id(&sub);
            transfer::public_transfer(sub, ctx.sender());
            column.subscriptions.add(sub_id, 0);
            //订阅事件
            let ent_time = now + payment_method.subscription_time;
            perlite_event::subscribe_column_event(ctx.sender(), object::id(column), now, ent_time, column.payment_method, sub_fee_value, cut_fee_value, payment_method.coin_type);
    }

    public entry fun renew_subscription(
        sub: &mut SubscriptionCap,
        market: &mut Market,
        column: &mut Column,
        payment_method: &PaymentMethod,
        fee: Coin<SUI>, //支付费用
        cut_fee: Coin<SUI>, //手续费
        clock: &Clock,
        global_config: &GlobalConfig,
        ctx: &mut TxContext){
            //版本检查
            perlite_version::assert_valid_version(global_config);
                        //检查支付方式是否匹配
            assert!(object::id(payment_method) == column.payment_method, E_NOT_COLUMN_PAY_NOT_MATCH);
            let cut_fee_amount = payment_method.fee * market.cut / 10000;
            assert!(cut_fee.value() >= cut_fee_amount, E_CUT_FEE_NOT_ENOUGH);
            //检查支付金额是否足够
            let sub_fee_amount = payment_method.fee - cut_fee_amount;
            assert!(fee.value() >= sub_fee_amount, E_NOT_FEE_NOT_ENOUGH);

            //检查是否是这个专栏的订阅者
            let sub_id = object::id(sub);
            assert!(column.subscriptions.contains(sub_id), E_COLUMN_SUBSCRIPTION_NOT_EXIST);
            //检查是否过期
            let now = clock.timestamp_ms();
            if(payment_method.pay_type!= 0){
                let sub_start_time = sub.sub_start_time;
                let limit_time = payment_method.subscription_time;
                //未超过订阅时长了
                if(now - sub_start_time <= limit_time){
                    abort E_NOT_OVER_TIME
                };
            };

            //计算手续费
            
            //扣除手续费
            let cut_fee_balance = coin::into_balance(cut_fee);
            let cut_fee_value = cut_fee_balance.value();
            market.balance.join(cut_fee_balance);
   
            let sub_fee_balance = coin::into_balance(fee);
            let sub_fee_value = sub_fee_balance.value();
            //扣除支付金额
            column.balance.join(sub_fee_balance);
            //更新订阅时间
            sub.sub_start_time = clock.timestamp_ms();

            //续费事件
            let ent_time = now + payment_method.subscription_time;
            perlite_event::renew_column_event(ctx.sender(), object::id(column), now, ent_time, column.payment_method, sub_fee_value, cut_fee_value, payment_method.coin_type);
    }

    //专栏管理员提取余额
    public entry fun column_admin_withdraw(
        column_cap: &ColumnCap,
        column: &mut Column,
        ctx: &mut TxContext){
            assert!(object::id(column) == column_cap.column_id, E_NO_COLUMN_CAP);
            let balance = column.balance.withdraw_all();
            let coin  = coin::from_balance(balance, ctx);
            transfer::public_transfer(coin, ctx.sender());
    }

    
    public entry fun admin_withdraw(
        _admin: &PerliteAdminCap,
        market: &mut Market,
        ctx: &mut TxContext){
            let balance = market.balance.withdraw_all();
            let coin  = coin::from_balance(balance, ctx);
            transfer::public_transfer(coin, ctx.sender());
    }
    

    fun approve_internal(id: vector<u8>, sub: &SubscriptionCap, column: &Column, payment_method: &PaymentMethod, clock: &Clock): bool {
        let sub_id = object::id(sub);
        let pay_method_id = object::id(payment_method);
        //已存在的订阅者中没有这个订阅者
        if(!column.subscriptions.contains(sub_id)) {
            return false
        };
        
        if (pay_method_id != column.payment_method) {
            return false
        };
        //检查是否过期
        let now = clock.timestamp_ms();
        if(payment_method.pay_type != 0){
            let sub_start_time = sub.sub_start_time;
            let limit_time = payment_method.subscription_time;
            //超过订阅时长了
            if(now - sub_start_time > limit_time){
                return false
            }
        };
        return true
        // Check if the id has the right prefix
        //is_prefix(column.pay_method_id.to_bytes(), id)
    }

    //订阅者权限校验
    entry fun seal_approve_sub(id: vector<u8>, sub: &SubscriptionCap, column: &Column, payment_method: &PaymentMethod, clock: &Clock, _ctx: &TxContext) {
        assert!(approve_internal(id, sub, column, payment_method, clock), ENoAccess);
    }

    //作者权限校验
    entry fun seal_approve_creator(id: vector<u8>, col_cap: &ColumnCap, column: &Column, _ctx: &TxContext) {
        assert!(col_cap.column_id == object::id(column), ENoAccess);
    }
}
