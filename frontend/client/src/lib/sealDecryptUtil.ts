import {
  EncryptedObject,
  getAllowlistedKeyServers,
  NoAccessError,
  SealClient,
  SessionKey,
} from "@mysten/seal";
import { fromBase64, fromHex, toBase64, toHex } from "@mysten/sui/utils";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "@/constant";
import { File as PerliteFile } from "@shared/data";
type WalrusService = {
  id: string;
  name: string;
  publisherUrl: string;
  aggregatorUrl: string;
};
export type MoveCallConstructor = (tx: Transaction, id: string) => void;

export async function downloadFile(
  file: PerliteFile,
  filePath: string,
  adapter: DataAdapter,
) {
  const TTL_MIN = 10;
  const sessionKey = new SessionKey({
    address: wallet.getAddress(),
    packageId,
    ttlMin: TTL_MIN,
  });

  try {
    const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
    const client = new SealClient({
      suiClient,
      serverObjectIds: getAllowlistedKeyServers("testnet"),
      verifyKeyServers: false,
    });
    let message = sessionKey.getPersonalMessage();
    let signature = await wallet.signPersonalMessage(message);
    const moveCallConstructor = await constructMoveCall(packageId, file.id);

    await sessionKey.setPersonalMessageSignature(signature);
    const blobs = await downloadAndDecrypt(
      adapter,
      [file.blob_id],
      sessionKey,
      suiClient,
      client,
      moveCallConstructor,
    );
    for (let i = 0; i < blobs.length; i++) {
      const blob = blobs[i];
      //
    }
  } catch (error: any) {
    console.error("Error:", error);
  }
}

async function downloadAndDecrypt(
  adapter: DataAdapter,
  blobIds: string[],
  sessionKey: SessionKey,
  suiClient: SuiClient,
  sealClient: SealClient,
  moveCallConstructor: (tx: Transaction, id: string) => void,
): Promise<Blob[]> {
  //
  const aggregators = [
    "https://aggregator.walrus-testnet.walrus.space",
    "https://wal-aggregator-testnet.staketab.org",
    "https://walrus-testnet-aggregator.bartestnet.com",
    "https://walrus-testnet.blockscope.net",
    "https://walrus-testnet-aggregator.nodes.guru",
    "https://walrus-cache-testnet.overclock.run",
    "https://sui-walrus-testnet.bwarelabs.com/aggregator",
    "https://walrus-testnet-aggregator.stakin-nodes.com",
    "https://testnet-aggregator-walrus.kiliglab.io",
    "https://walrus-cache-testnet.latitude-sui.com",
    "https://walrus-testnet-aggregator.nodeinfra.com",
    "https://walrus-tn.juicystake.io:9443",
    "https://walrus-agg-testnet.chainode.tech:9002",
    "https://walrus-testnet-aggregator.starduststaking.com:11444",
    "http://walrus-testnet-aggregator.everstake.one:9000",
    "http://walrus.testnet.pops.one:9000",
    "http://scarlet-brussels-376c2.walrus.bdnodes.net:9000",
    "http://aggregator.testnet.sui.rpcpool.com:9000",
    "http://walrus.krates.ai:9000",
    "http://walrus-testnet.stakingdefenseleague.com:9000",
    "http://walrus.sui.thepassivetrust.com:9000",
  ];
  // First, download all files in parallel (ignore errors)
  const blobs: Blob[] = [];

  const downloadResults = await Promise.all(
    blobIds.map(async (blobId) => {
      for (let aggregator of aggregators) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const aggregatorUrl = `${aggregator}/v1/blobs/${blobId}`;
          const response = await fetch(aggregatorUrl, {
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (!response.ok) {
            continue;
          }
          return await response.arrayBuffer();
        } catch (err) {
          console.error(`Blob ${blobId} cannot be retrieved from Walrus`, err);
          continue;
        }
      }
      return null;
    }),
  );

  // Filter out failed downloads
  const validDownloads = downloadResults.filter(
    (result): result is ArrayBuffer => result !== null,
  );
  console.log("validDownloads count", validDownloads.length);

  if (validDownloads.length === 0) {
    const errorMsg =
      "Cannot retrieve files from this Walrus aggregator, try again (a randomly selected aggregator will be used). Files uploaded more than 1 epoch ago have been deleted from Walrus.";
    console.error(errorMsg);
    return blobs;
  }

  // Fetch keys in batches of <=10
  for (let i = 0; i < validDownloads.length; i += 10) {
    const batch = validDownloads.slice(i, i + 10);
    const ids = batch.map(
      (enc) => EncryptedObject.parse(new Uint8Array(enc)).id,
    );
    const tx = new Transaction();
    ids.forEach((id) => moveCallConstructor(tx, id));
    const txBytes = await tx.build({
      client: suiClient,
      onlyTransactionKind: true,
    });
    try {
      await sealClient.fetchKeys({
        ids,
        txBytes,
        sessionKey,
        threshold: 2,
      });
    } catch (err) {
      console.log(err);
      const errorMsg =
        err instanceof NoAccessError
          ? "No access to decryption keys"
          : "Unable to decrypt files, try again";
      console.error(errorMsg, err);
      return blobs;
    }
  }

  // Then, decrypt files sequentially
  for (const encryptedData of validDownloads) {
    const fullId = EncryptedObject.parse(new Uint8Array(encryptedData)).id;
    const tx = new Transaction();
    moveCallConstructor(tx, fullId);
    const txBytes = await tx.build({
      client: suiClient,
      onlyTransactionKind: true,
    });
    try {
      // Note that all keys are fetched above, so this only local decryption is done
      const decryptedFile = await sealClient.decrypt({
        data: new Uint8Array(encryptedData),
        sessionKey,
        txBytes,
      });
      // 将解密后的文件内容转换为文本
      const blob = new Blob([decryptedFile], {
        type: "text/markdown",
      });
      console.log("blob", blob);
      blobs.push(blob);
    } catch (err) {
      console.log(err);
      const errorMsg =
        err instanceof NoAccessError
          ? "No access to decryption keys"
          : "Unable to decrypt files, try again";
      console.error(errorMsg, err);
      return blobs;
    }
  }
  return blobs;
}

function constructMoveCall(
  packageId: string,
  fileId: string,
): MoveCallConstructor {
  return (tx: Transaction, id: string) => {
    tx.moveCall({
      target: PACKAGE_ID + `::perlite_sync::seal_approve`,
      arguments: [tx.pure.vector("u8", fromHex(id)), tx.object(fileId)],
    });
  };
}
