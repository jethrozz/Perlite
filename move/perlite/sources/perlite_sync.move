
module perlite::perlite_sync {
    use sui::object::{Self, UID, ID};
    use std::string::{Self, String};
    
    public struct Directory has key, store {
        id: UID,
        name: String,
        parent: ID,
        is_root: bool,
        files: vector<File>,
        directories: vector<ID>,
        created_at: u64,
        updated_at: u64,
    }

    public struct File has key, store {
        id: UID,
        title: String,
        blob_id: String,
        created_at: u64,
        updated_at: u64,
    }
}