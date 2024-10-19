"use client";

import { getCrudappProgram, getCrudappProgramId } from "@project/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";

// Type definition for creating a journal entry
interface CreateEntryArgs {
  title: string;
  message: string;
  owner: PublicKey;
}

// Hook to interact with the CRUD app program
export function useCrudappProgram() {
  const { connection } = useConnection(); // Get Solana connection
  const { cluster } = useCluster(); // Get current Solana cluster (network)
  const transactionToast = useTransactionToast(); // Display transaction notifications
  const provider = useAnchorProvider(); // Get the Anchor provider instance

  // Get the program ID based on the selected cluster/network
  const programId = useMemo(
    () => getCrudappProgramId(cluster.network as Cluster),
    [cluster]
  );

  // Load the CRUD app program using the provider
  const program = getCrudappProgram(provider);

  // Query to fetch all journal entries
  const accounts = useQuery({
    queryKey: ["crudapp", "all", { cluster }],
    queryFn: () => program.account.journalEntryState.all(),
  });

  // Query to get program account information
  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  // Mutation to create a journal entry
  const createEntry = useMutation<string, Error, CreateEntryArgs>({
    mutationKey: ["jornalEntry", "create", { cluster }],
    mutationFn: async ({ title, message, owner }) => {
      // Find the journal entry address based on the title and owner's public key
      const [journalEntryAddress] = await PublicKey.findProgramAddressSync(
        [Buffer.from(title), owner.toBuffer()],
        programId
      );

      // Call the createJournalEntry method from the program
      return program.methods.createJournalEntry(title, message).rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature); // Show transaction success notification
      accounts.refetch(); // Refetch the list of journal entries
    },
    onError: (error) => {
      toast.error(`Failed to create journal entry: ${error.message}`); // Show error notification
    },
  });

  return {
    program, // The CRUD app program object
    programId, // The ID of the program
    accounts, // The query result containing all journal entries
    getProgramAccount, // The query result for fetching the program account info
    createEntry, // Function to create a new journal entry
  };
}

// Hook to interact with a specific journal entry account
export function useCrudappProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster(); // Get the current cluster
  const transactionToast = useTransactionToast(); // Transaction toast for feedback
  const { program, accounts } = useCrudappProgram(); // Access program and journal entries

  // The program ID is hardcoded for the specific program
  const programId = new PublicKey(
    "9ezVmmbJmsCrAyodcqcKCrT1Wa365V1p3FDBUS7zz6LG"
  );

  // Query to fetch a specific journal entry
  const accountQuery = useQuery({
    queryKey: ["crudapp", "fetch", { cluster, account }],
    queryFn: () => program.account.journalEntryState.fetch(account),
  });

  // Mutation to update a journal entry
  const updateEntry = useMutation<string, Error, CreateEntryArgs>({
    mutationKey: ["journalEntry", "update", { cluster }],
    mutationFn: async ({ title, message, owner }) => {
      // Find the journal entry address for update
      const [journalEntryAddress] = await PublicKey.findProgramAddressSync(
        [Buffer.from(title), owner.toBuffer()],
        programId
      );

      // Call the updateJournalEntry method
      return program.methods.updateJournalEntry(title, message).rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature); // Show transaction success notification
      accounts.refetch(); // Refetch the journal entries
    },
    onError: (error) => {
      toast.error(`Failed to update journal entry: ${error.message}`); // Show error notification
    },
  });

  // Mutation to delete a journal entry
  const deleteEntry = useMutation({
    mutationKey: ["journal", "deleteEntry", { cluster, account }],
    mutationFn: (title: string) =>
      program.methods.deleteJournalEntry(title).rpc(), // Call the delete method
    onSuccess: (tx) => {
      transactionToast(tx); // Show transaction success notification
      return accounts.refetch(); // Refetch journal entries after deletion
    },
  });

  return {
    accountQuery, // Query result for fetching a specific journal entry
    updateEntry, // Function to update a journal entry
    deleteEntry, // Function to delete a journal entry
  };
}
