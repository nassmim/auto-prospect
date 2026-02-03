import { EContactChannel, EMessageStatus } from "@/constants/enums";

/**
 * Daily Contact Tracker Service
 * In-memory tracker for daily contact counts during background job execution
 * Resets naturally when job completes (no database persistence needed)
 */
export type TDailyContactTracker = {
  increment: (huntId: string, channel?: string) => number;
  getCount: (huntId: string) => number;
  isAtLimit: (huntId: string, limit: number | null | undefined) => boolean;
};

export type TChannelAllocation = {
  adId: string;
  channel: EContactChannel;
};

export type TAllocateAdsToChannelsParams = {
  huntId: string;
  adIds: string[];
  dailyContactTracker: TDailyContactTracker;
};

// Metadata types for different activity types
export type TStageChangeMetadata = {
  fromStage: string;
  toStage: string;
};

export type TMessageSentMetadata = {
  channel: MessageChannel;
  status: keyof typeof EMessageStatus;
  messageId: string;
};

export type TAssignmentChangeMetadata = {
  fromUserId: string | null;
  toUserId: string | null;
};

export type TNoteAddedMetadata = {
  noteId: string;
  preview: string; // First 100 chars of note
};

export type TReminderSetMetadata = {
  reminderId: string;
  dueAt: Date;
};

export type TActivityMetadata =
  | TStageChangeMetadata
  | TMessageSentMetadata
  | TAssignmentChangeMetadata
  | TNoteAddedMetadata
  | TReminderSetMetadata
  | Record<string, never>; // For 'created' type

export type TTemplateVariables = {
  titre_annonce?: string;
  prix?: string;
  marque?: string;
  modele?: string;
  annee?: string;
  ville?: string;
  vendeur_nom?: string;
};
