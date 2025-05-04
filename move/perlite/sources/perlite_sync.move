
module perlite::perlite_sync {
    use sui::object::{Self, UID, ID};
    use sui::{clock::Clock, tx_context::{TxContext}, transfer};
    use std::string::{Self, String};
    
    public struct Directory has key, store {
        id: UID,
        name: String,
        parent: ID,
        is_root: bool,
        files: vector<ID>,
        directories: vector<ID>,
        created_at: u64,
        updated_at: u64,
    }

    public struct File has key, store {
        id: UID,
        title: String,
        belong_dir: ID,
        blob_id: String,
        created_at: u64,
        updated_at: u64,
    }

    public fun new_root_directory(name: String, clock: &Clock, ctx: &mut TxContext): Directory {
        let now = clock.timestamp_ms();
        let parent_id = @0x0.to_id();
        Directory {
            id: object::new(ctx),
            name,
            parent: parent_id,
            is_root: true,
            files: vector::empty(),
            directories: vector::empty(),
            created_at: now,
            updated_at: now,
        }
    }

    public fun new_file(title: String, blob_id: String, dir : &mut Directory,clock: &Clock, ctx: &mut TxContext): File {
        let now = clock.timestamp_ms();
        let  dir_id = object::id(dir);
        File {
            id: object::new(ctx),
            title,
            blob_id,
            belong_dir: dir_id,
            created_at: now,
            updated_at: now,
        }
    }

    public entry fun transfer_file(file: File, recipient: address, ctx: &mut TxContext) {
        transfer::public_transfer(file, recipient);
    }

    public entry fun transfer_dir(dir: Directory, recipient: address, ctx: &mut TxContext) {
        transfer::public_transfer(dir, recipient);
    }

    public fun new_directory(name: String, parent_dir: & Directory, clock: &Clock, ctx: &mut TxContext): Directory {
        let parent_id = object::id(parent_dir);
        let now = clock.timestamp_ms();
        Directory {
            id: object::new(ctx),
            name,
            parent: parent_id,
            is_root: true,
            files: vector::empty(),
            directories: vector::empty(),
            created_at: now,
            updated_at: now,
        }
    }
}