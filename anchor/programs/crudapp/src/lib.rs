#![allow(clippy::result_large_err)] // Suppresses Clippy warnings about large error types in Results.

use anchor_lang::prelude::*; // Imports commonly used types and macros from Anchor.

declare_id!("9ezVmmbJmsCrAyodcqcKCrT1Wa365V1p3FDBUS7zz6LG"); // Declares the program's unique identifier.

// Main program module.
#[program]
pub mod crudapp {
    use super::*;

    // Create a new journal entry.
    pub fn create_journal_entry(
        ctx: Context<CreateEntry>,  
        title: String,              
        message: String             
    ) -> Result<()> {              
        let journal_entry: &mut Account<JournalEntryState> = &mut ctx.accounts.journal_entry; 
        journal_entry.owner = *ctx.accounts.owner.key;  
        journal_entry.title = title;                    
        journal_entry.message = message;                

        Ok(()) // Indicates success.
    }

    // Update an existing journal entry.
    pub fn update_journal_entry(
        ctx: Context<UpdateEntry>,  
        _title: String,             
        message: String             
    ) -> Result<()> {               
        let journal_entry: &mut Account<JournalEntryState> = &mut ctx.accounts.journal_entry; 
        journal_entry.message = message; 

        Ok(()) // Indicates success.
    }

    // Delete a journal entry.
    pub fn delete_journal_entry(
        _ctx: Context<DeleteEntry>,
        _title: String, 
    ) -> Result<()> {
        // Entry is closed and lamports refunded to the owner.
        Ok(())
    }
}

// Accounts required by `create_journal_entry`.
#[derive(Accounts)] 
#[instruction(title:String)] // context for the title in seed
pub struct CreateEntry<'info> {
    #[account(
        init,  
        seeds = [title.as_bytes(), owner.key().as_ref()], 
        bump,  
        space = 8 + JournalEntryState::INIT_SPACE,  
        payer = owner  
    )]
    pub journal_entry: Account<'info, JournalEntryState>, 

    #[account(mut)] 
    pub owner: Signer<'info>,  

    pub system_program: Program<'info, System>,  
}

// Accounts required by `update_journal_entry`.
#[derive(Accounts)] 
#[instruction(title: String)] 
pub struct UpdateEntry<'info> {
    #[account(
        mut,  // The account is mutable because it is being updated.
        seeds = [title.as_bytes(), owner.key().as_ref()], // PDA generated from the title and owner's public key.
        bump,  // Bump seed to ensure uniqueness of the PDA.
        realloc = 8 + JournalEntryState::INIT_SPACE,  // Reallocate memory if the size of the data changes.
        realloc::payer = owner,  // The owner of the account will pay for the additional space.
        realloc::zero = true  // The new memory will be zero-initialized for safety.
    )]
    pub journal_entry: Account<'info, JournalEntryState>,  

    #[account(mut)] 
    pub owner: Signer<'info>,  

    pub system_program: Program<'info, System>,  
}

// Accounts required by `delete_journal_entry`.
#[derive(Accounts)]
#[instruction(title: String)] 
pub struct DeleteEntry<'info> {
    #[account(
        mut,
        seeds = [title.as_bytes(), owner.key().as_ref()],
        bump,
        close = owner // Closes the account and refunds the rent to the owner.
    )]
    pub journal_entry: Account<'info, JournalEntryState>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// State of the journal entry (stored on-chain).
#[account] 
#[derive(InitSpace)] 
pub struct JournalEntryState {
    pub owner: Pubkey,  // Owner's public key.
    #[max_len(50)]  
    pub title: String,  // Title with a 50-character limit.
    #[max_len(1000)]  
    pub message: String,  // Message with a 1000-character limit.
}
