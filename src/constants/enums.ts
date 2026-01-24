export enum EPlatformValue {
  LOBSTR = "lobstrValue",
}

export enum EMessageType {
  WHATSAPP_TEXT = "whatsappText",
  SMS = "sms",
  RINGLESS_VOICE = "ringlessVoice",
}

export enum ERole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
}

export enum EOrganizationType {
  PERSONAL = "personal",
  TEAM = "team",
}

export enum EHuntStatus {
  ACTIVE = "active",
  PAUSED = "paused",
}

export enum EMessageChannel {
  WHATSAPP = "whatsapp",
  PHONE = "phone",
}

export enum ETransactionType {
  PURCHASE = "purchase",
  USAGE = "usage",
  REFUND = "refund",
  ADJUSTMENT = "adjustment",
}

export enum ELeadStage {
  NOUVEAU = "nouveau",
  CONTACTE = "contacte",
  RELANCE = "relance",
  GAGNE = "gagne",
  PERDU = "perdu",
}

export enum EMessageStatus {
  PENDING = "pending",
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
  READ = "read",
  REPLIED = "replied",
}

export enum ELeadActivityType {
  STAGE_CHANGE = "stage_change",
  MESSAGE_SENT = "message_sent",
  ASSIGNMENT_CHANGE = "assignment_change",
  NOTE_ADDED = "note_added",
  REMINDER_SET = "reminder_set",
  CREATED = "created",
}
