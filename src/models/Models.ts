export interface Event {
    eventId: number;
    title: string;
    description: string;
    dateStart: string;
    dateEnd: string;
    applicationStart: string;
    applicationEnd: string;
    location: string;
    type: EventType;
    theme: string;
    format: EventFormat;
    results?: string;
    observersAllowed: boolean;
    status: string;
    hidden: boolean;
    organizerId: number;
    organizer: string;
    organizerDescription: string;
    documentsRequired: DocRequired[];
    fileEvents: FileEvent[];
    reviewers: Reviewer[];
    coowners: Reviewer[];
    moderationStatus: ModerationStatus;
}

export interface DocRequired {
    docRequiredId: number;
    type: string;
    fileType: FileType;
    description: string;
    mandatory: boolean;
}

export interface FileEvent {
    fileId: number;
    fileName: string;
    filePath: string;
    uploadDate: string;
    fileType: string;
    fileKindName: string;
    category: string;
    description: string;
}

export interface EventRequest {
    title: string;
    description: string;
    dateStart: string;
    dateEnd: string;
    applicationStart: string;
    applicationEnd: string;
    location: string;
    type: EventType;
    theme: string;
    format: EventFormat;
    results?: string;
    observersAllowed: boolean;
    organizerDescription?: string;
    documentsRequired: DocRequiredRequest[];
    fileEvents: FileEventRequest[];
    status: EventStatus;
    hidden: boolean;
    moderationStatus: ModerationStatus;
    reviewers: Reviewer[];
    coowners?: Reviewer[];
}

export interface FileEventRequest {
    fileName: string;
    filePath: string;
    uploadDate: string;
    fileType: string;
    fileKindName: string;
    category: string;
    description: string;
}

export interface DocRequiredRequest {
    type: string;
    fileType: FileType;
    description: string;
    mandatory: boolean;
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    role: RoleTypes;
    email: string;
    password: string;
}

export interface FileApplicationRequest {
    fileId?: number;
    fileName: string;
    filePath: string;
    uploadDate: string;
    fileType: string;
    isEncryptionEnabled: boolean;
}

export interface FileApplicationResponse {
    fileId: number;
    fileName: string;
    filePath: string;
    uploadDate: string;
    fileType: string;
    docRequired?: DocRequired;
    isEncryptionEnabled: boolean;
}

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: NotificationType;
    createdAt: string;
    isRead: boolean;
    entityType?: EntityType;
    entityId?: number;
}

export interface NotificationResponse {
    content: Notification[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export enum RoleTypes {
    USER = 'USER',
    ORGANIZER = 'ORGANIZER'
}

export enum NotificationType {
    INFO = 'INFO',
    SUCCESS = 'SUCCESS',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
}

export enum EntityType {
    EVENT = 'EVENT',
    APPLICATION = 'APPLICATION'
}

export enum EventFormat {
    OFFLINE = 'OFFLINE',
    ONLINE = 'ONLINE',
    HYBRID = 'HYBRID'
}

export enum EventStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED'
}

export enum ModerationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    EDITING = 'EDITING',
    BLOCKED = 'BLOCKED'
}

export interface Reviewer {
    profileId: number;
    firstName: string;
    lastName: string;
    email: string;
}

export interface ProfileData {
    profileId: number;
    firstName: string;
    lastName: string;
    aboutMe: string | null;
    avatarUrl: string | null;
    avatarPresignedUrl: string | null;
    email: string;
    role: string;
    isActive: boolean;
}

export interface ProfileDTO {
    profileId: number;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    aboutMe: string | null;
}

export interface DocRequiredDTO {
    docRequiredId: number;
    type: string;
    fileType: FileType;
    description: string;
    mandatory: boolean;
}

export interface EventDTO {
    eventId: number;
    title: string;
    description: string;
    location: string;
    type: string;
    dateStart: string;
    dateEnd: string;
    applicationStart: string;
    applicationEnd: string;
    documentsRequired: DocRequiredDTO[];
}

export interface ApplicationDetailWithApplicantResponse {
    application: ApplicationResponse;
    event: EventDTO;
    applicant: ProfileDTO;
}

export interface ApplicationDetailWithOrganizerResponse {
    application: ApplicationResponse;
    event: EventDTO;
    organizer: ProfileDTO;
}

export interface ApplicationRequest {
    eventId: number;
    profileId: number | null;
    status: string;
    submissionDate: string;
    message: string | null;
    isObserver: boolean;
    verdict: string | null;
    fileApplications: FileApplicationRequest[];
}

export interface ApplicationResponse {
    applicationId: number;
    eventId: number;
    eventName: string;
    profileId: number | null;
    status: string;
    submissionDate: string;
    message?: string;
    isObserver: boolean;
    verdict?: string;
    fileApplications: FileApplicationResponse[];
}

export interface ProfileUpdateData {
    firstName: string;
    lastName: string;
    aboutMe: string | null;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordChangeRequest {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

export interface VerifyEmailRequest {
    token: string;
}

export interface EventResponse extends Event {}

// Chat related interfaces
export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number; // current page number
    size: number;
  }
  
export interface ChatMessageRequest {
    content: string;
}
  
export interface ChatMessageResponse {
    id: number;
    chatId: number;
    senderId: number;
    senderFirstName: string;
    senderLastName: string;
    content: string;
    timestamp: string; // Assuming date comes as string
}
  
export interface ChatResponse {
    id: number;
    eventId: number;
    eventTitle: string;
    initiatorId: number;
    initiatorFirstName: string;
    initiatorLastName: string;
    participantIds: number[];
    lastMessage?: ChatMessageResponse;
    lastMessageTimestamp?: string;
    unreadCount: number;
}

export enum FileType {
    DOCUMENT = 'DOCUMENT',
    TABLE = 'TABLE',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    AUDIO = 'AUDIO',
    PRESENTATION = 'PRESENTATION',
    ARCHIVE = 'ARCHIVE',
    ANY = 'ANY'
}

export enum EventType {
    CONFERENCE = 'CONFERENCE',
    SEMINAR = 'SEMINAR'
}

export enum LiveStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED'
}