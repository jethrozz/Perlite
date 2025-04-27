module perlite::perlite_version{
    use sui::object::{Self, UID, ID};
    use sui::vec_set::VecSet;
    use perlite::perlite_market::PerliteAdminCap;

    public struct GlobalConfig has key {
        id: UID,
        version: VecSet<u16>, //兼容的版本号
    }
    public const PACKAGE_VERSION: u16 = 1; //版本号，从1开始，每次更新版本号加1，用于版本回滚
    const ERR_VERSION_NOT_SUPPORT: u64 = 998; //版本不支持

    fun not_support_version() {
        abort ERR_VERSION_NOT_SUPPORT;
    }
    public fun get_version(): u16 {
        PACKAGE_VERSION
    }

    public fun add_version(_cap: &PerliteAdminCap, config: &mut GlobalConfig, version: u16) {
        config.version.insert(version);
    }

    public fun remove_version(_cap: &PerliteAdminCap, config: &mut GlobalConfig, version: u16) {
        config.version.remove(&version);
    }

    public fun(package) assert_valid_version(config: &GlobalConfig) {
        if (!config.version.contains(&version)) {
            not_support_version();
        }
    }
}