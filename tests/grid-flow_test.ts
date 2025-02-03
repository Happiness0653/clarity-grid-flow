import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Ensure producer can register",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const producer = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        "grid-flow",
        "register-producer",
        [types.ascii("New York")],
        producer.address
      ),
    ]);
    
    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "Ensure consumer can register",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const consumer = accounts.get("wallet_2")!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        "grid-flow",
        "register-consumer", 
        [types.ascii("New York")],
        consumer.address
      ),
    ]);
    
    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "Test energy generation and credit minting",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const producer = accounts.get("wallet_1")!;
    
    // Register producer first
    let block = chain.mineBlock([
      Tx.contractCall(
        "grid-flow",
        "register-producer",
        [types.ascii("New York")],
        producer.address
      ),
      Tx.contractCall(
        "grid-flow", 
        "record-generation",
        [types.uint(100)],
        producer.address
      ),
    ]);

    assertEquals(block.receipts[1].result, "(ok true)");
    
    // Check balance
    let balance = chain.callReadOnlyFn(
      "grid-flow",
      "get-credit-balance",
      [types.principal(producer.address)],
      producer.address
    );
    
    assertEquals(balance.result, "(ok u100)");
  },
});

Clarinet.test({
  name: "Test credit transfer between parties",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const producer = accounts.get("wallet_1")!;
    const consumer = accounts.get("wallet_2")!;
    
    let block = chain.mineBlock([
      // Setup
      Tx.contractCall(
        "grid-flow",
        "register-producer",
        [types.ascii("New York")],
        producer.address
      ),
      Tx.contractCall(
        "grid-flow",
        "record-generation",
        [types.uint(100)],
        producer.address
      ),
      // Test transfer
      Tx.contractCall(
        "grid-flow",
        "transfer-credits",
        [types.uint(50), types.principal(consumer.address)],
        producer.address
      ),
    ]);
    
    assertEquals(block.receipts[2].result, "(ok true)");
  },
});
