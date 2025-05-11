
module perlite::perlite_sync {
    use sui::object::{Self, UID, ID};
    use sui::{clock::Clock, tx_context::{TxContext}, transfer};
    use std::string::{Self, String};
    
    public struct Directory has key, store {
        id: UID,
        name: String,
        parent: ID,
        is_root: bool,
        created_at: u64,
        updated_at: u64,
    }

    public struct File has key, store {
        id: UID,
        title: String,
        belong_dir: ID,
        blob_id: String,
        end_epoch: u64,
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
            created_at: now,
            updated_at: now,
        }
    }

    public fun new_file(title: String, blob_id: String, end_epoch: u64, dir : &mut Directory,clock: &Clock, ctx: &mut TxContext): File {
        let now = clock.timestamp_ms();
        let  dir_id = object::id(dir);
        File {
            id: object::new(ctx),
            title,
            blob_id,
            end_epoch,
            belong_dir: dir_id,
            created_at: now,
            updated_at: now,
        }
    }

    public entry fun transfer_file(file: File, recipient: address, _ctx: &mut TxContext) {
        transfer::public_transfer(file, recipient);
    }

    public entry fun transfer_dir(dir: Directory, recipient: address, _ctx: &mut TxContext) {
        transfer::public_transfer(dir, recipient);
    }

    public fun new_directory(name: String, parent_dir: & Directory, clock: &Clock, ctx: &mut TxContext): Directory {
        let parent_id = object::id(parent_dir);
        let now = clock.timestamp_ms();
        Directory {
            id: object::new(ctx),
            name,
            parent: parent_id,
            is_root: false,
            created_at: now,
            updated_at: now,
        }
    }

    public fun update_directory(name: String, is_root: bool, dir: &mut Directory, clock: &Clock, ctx: &mut TxContext) {
        let now = clock.timestamp_ms();
        dir.updated_at = now;
        dir.name = name;
        dir.is_root = is_root;
    }

    public fun update_file(title: String, blob_id: String, file: &mut File, clock: &Clock, _ctx: &mut TxContext) {
        let now = clock.timestamp_ms();
        file.updated_at = now;
        file.title = title;
        file.blob_id = blob_id;
    }
    public fun delete_file(file: File, _ctx: &mut TxContext) {
        let File{
            id,
            blob_id,
            end_epoch,
            belong_dir,
            title,
            created_at,
            updated_at,
        } = file;
        object::delete(id);
    }

    public fun delete_directory(dir: Directory, _ctx: &mut TxContext) {
         let Directory {
            id,
            name,
            parent,
            is_root,
            created_at,
            updated_at,
        } = dir;
        object::delete(id);
    }

    public fun move_file(file: &mut File, new_dir: &Directory, clock: &Clock, _ctx: &mut TxContext) {
        let now = clock.timestamp_ms();
        let id = object::id(new_dir);
        file.belong_dir = id;
        file.updated_at = now;
    }

    public fun move_directory(dir: &mut Directory, new_parent_dir: &Directory, clock: &Clock, _ctx: &mut TxContext) {
        let now = clock.timestamp_ms();
        let id = object::id(new_parent_dir);
        dir.parent = id;
        dir.updated_at = now;
    }

    entry fun seal_approve(id: vector<u8>, file: &File, ctx: &TxContext) {
    }
}