import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Flex, Heading, Text } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";

export function Counter() {
  const counterPackageId = useNetworkVariable("counterPackageId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  let id = "";
  const { data, isPending, error, refetch } = useSuiClientQuery("getObject", {
    id,
    options: {
      showContent: true,
      showOwner: true,
    },
  });

  const [waitingForTxn, setWaitingForTxn] = useState("");

  const executeMoveCall = (method: "increment" | "reset") => {
    setWaitingForTxn(method);

    const tx = new Transaction();

    if (method === "reset") {
      tx.moveCall({
        arguments: [tx.object(id), tx.pure.u64(0)],
        target: `${counterPackageId}::counter::set_value`,
      });
    } else {
      tx.moveCall({
        arguments: [tx.object(id)],
        target: `${counterPackageId}::counter::increment`,
      });
    }

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (tx) => {
          suiClient.waitForTransaction({ digest: tx.digest }).then(async () => {
            await refetch();
            setWaitingForTxn("");
          });
        },
      },
    );
  };

    function add_dir() {
        const tx = new Transaction();
        let name = "child_dir1";
        const child_dir = tx.moveCall({
            arguments: [tx.pure.string(name), tx.object("0xd1cb5ea80b2b463d9c8faa258179397f8bff9169b7c7ff3abed8d753303d8657"), tx.object("0x6")],
            target: `0x9112ba4f2eb059499f52b84959da53f6450c0b19c8c58a2436581f88fbf2bc0e::perlite_sync::new_directory`,
        });
        tx.moveCall({
            target: `0x9112ba4f2eb059499f52b84959da53f6450c0b19c8c58a2436581f88fbf2bc0e::perlite_sync::transfer_dir`,
            arguments: [tx.object(child_dir), tx.pure.address(currentAccount?.address!)],
        });

        signAndExecute(
            {
                transaction: tx,
            },
            {
                onSuccess: async ({ digest }) => {
                    const { effects } = await suiClient.waitForTransaction({
                        digest: digest,
                        options: {
                            showEffects: true,
                        },
                    });
                    console.log("add_dir,", effects?.created?.[0]?.reference?.objectId!);
                },
            },
        );
    }

  if (isPending) return <Text>Loading...</Text>;

  if (error) return <Text>Error: {error.message}</Text>;

  if (!data.data) return <Text>Not found</Text>;

  const ownedByCurrentAccount =
    getCounterFields(data.data)?.owner === currentAccount?.address;

  return (
    <>
      <Heading size="3">Counter {id}</Heading>

      <Flex direction="column" gap="2">
        <Text>Count: {getCounterFields(data.data)?.value}</Text>
        <Flex direction="row" gap="2">
          <Button
            onClick={() => executeMoveCall("increment")}
            disabled={waitingForTxn !== ""}
          >
            {waitingForTxn === "increment" ? (
              <ClipLoader size={20} />
            ) : (
              "Increment"
            )}
          </Button>
          <Button
            onClick={() => add_dir()}
        >Add Dir</Button>
          {ownedByCurrentAccount ? (
            <Button
              onClick={() => executeMoveCall("reset")}
              disabled={waitingForTxn !== ""}
            >
              {waitingForTxn === "reset" ? <ClipLoader size={20} /> : "Reset"}
            </Button>
          ) : null}
        </Flex>
      </Flex>
    </>
  );
}
function getCounterFields(data: SuiObjectData) {
  if (data.content?.dataType !== "moveObject") {
    return null;
  }

  return data.content.fields as { value: number; owner: string };
}
