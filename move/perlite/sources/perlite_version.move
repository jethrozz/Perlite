module perlite::perlite_version{
    use sui::vec_set::{Self, VecSet};
    
        // 权限
    public struct PerliteVersionAdminCap has key, store {
        id: UID
    }
    public struct GlobalConfig has key {
        id: UID,
        version: VecSet<u16>, //兼容的版本号
    }

    const PACKAGE_VERSION: u16 = 1; //版本号，从1开始，每次更新版本号加1，用于版本回滚
    const ERR_VERSION_NOT_SUPPORT: u64 = 998; //版本不支持

    fun init(ctx: &mut TxContext) {
        //创建管理员权限
        let admin = PerliteVersionAdminCap { id: object::new(ctx) };
        
        let global = GlobalConfig {
            id: object::new(ctx),
            version: vec_set::empty(),
        };
        transfer::share_object(global);
        transfer::public_transfer(admin, ctx.sender());
    }

    fun not_support_version() {
        abort ERR_VERSION_NOT_SUPPORT
    }
    public fun get_version(): u16 {
        PACKAGE_VERSION
    }

    public fun add_version(_cap: &PerliteVersionAdminCap, config: &mut GlobalConfig, version: u16) {
        config.version.insert(version);
    }

    public fun remove_version(_cap: &PerliteVersionAdminCap, config: &mut GlobalConfig, version: u16) {
        config.version.remove(&version);
    }

    public(package) fun assert_valid_version(config: &GlobalConfig) {
        if (!config.version.contains(&get_version())) {
            not_support_version();
        }
    }
}