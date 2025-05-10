import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import { Transaction } from "@mysten/sui/transactions";
import { Button } from "@radix-ui/themes";

import ClipLoader from "react-spinners/ClipLoader";
function App() {
    const currentAccount = useCurrentAccount();
    console.log("currentAccount", currentAccount);
    const address = currentAccount?.address;
    const counterPackageId = useNetworkVariable("counterPackageId");
    const suiClient = useSuiClient();
    const {
        mutate: signAndExecute,
        isSuccess,
        isPending,
    } = useSignAndExecuteTransaction();

    function createVault() {
        if (!address) {
            return;
        }
        const tx = new Transaction();
        let name = "MyVault";
        const rootdir = tx.moveCall({
            arguments: [tx.pure.string(name), tx.object("0x6")],
            target: `${counterPackageId}::perlite_sync::new_root_directory`,
        });
        tx.moveCall({
            target: `${counterPackageId}::perlite_sync::transfer_dir`,
            arguments: [tx.object(rootdir), tx.pure.address(address)],
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

                    console.log("createVault,", effects?.created?.[0]?.reference?.objectId!);
                },
            },
        );
    }

    function createChild() {
        if (!address) {
            return;
        }
        const tx = new Transaction();
        let childname = "child_dir1";
        let rootdir = "0x9f7a18bb476aab6de7873181f04cefcee1cfe1e4f56a8fb5bf87c4925f8c2450";
        const child_dir = tx.moveCall({
            arguments: [tx.pure.string(childname), tx.object(rootdir), tx.object("0x6")],
            target: `${counterPackageId}::perlite_sync::new_directory`,
        });
        tx.moveCall({
            target: `${counterPackageId}::perlite_sync::transfer_dir`,
            arguments: [tx.object(child_dir), tx.pure.address(address)],
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

                    console.log("create child,", effects?.created?.[0]?.reference?.objectId!);
                },
            },
        );
    }

  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>dApp Starter Template</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container>
        <Container>
                  {/* <Button
                      size="3"
                      onClick={() => {
                          createVault();
                      }}
                      disabled={isSuccess || isPending}
                  >
                      {isSuccess || isPending ? <ClipLoader size={20} /> : "Create Vault"}
                  </Button> */}

                  <Button
                      size="3"
                      onClick={() => {
                          createChild();
                      }}
                  >
                      Create child
                  </Button>
        </Container>
      </Container>
    </>
  );
}

export default App;
