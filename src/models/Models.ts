export enum RoleTypes {
    USER = 'USER',
    ORGANIZER = 'ORGANIZER'
}

export interface Event {
    eventId: number;
    title: string;
    description: string;
    dateStart: string;
    dateEnd: string;
    location: string;
    type: string;
    theme: string;
    format: string;
    organizerId: string;
    organizer: string;
    status: string;
    organizerDescription?: string;
    observersAllowed?: boolean;
    documentsRequired: DocRequired[];
    fileEvents: FileEvent[];
    results?: string;
}

export interface DocRequired {
    docRequiredId: number;
    type: string;
    extension: string;
    description: string;
    mandatory: boolean;
}

export interface FileEvent {
    fileId: number;
    fileName: string;
    filePath: string;
    uploadDate: string;
    fileType: string;
}

export interface EventRequest {
    title: string;
    description: string;
    dateStart: string;
    dateEnd: string;
    location: string;
    type: string;
    theme: string;
    format: string;
    results?: string;
    observersAllowed: boolean;
    organizerDescription?: string;
    documentsRequired: DocRequiredRequest[];
    fileEvents: FileEvent[];
}

export interface FileEventRequest {
    fileName: string;
    filePath: string;
    uploadDate: string;
    fileType: string;
}

export interface DocRequiredRequest {
    type: string;
    extension: string;
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

export interface FileEventRequest {
    fileName: string;
    filePath: string;
    uploadDate: string;
    fileType: string;
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

export interface FileApplicationResponse {
    fileId: number;
    fileName: string;
    filePath: string;
    uploadDate: string;
    fileType: string;
    isEncryptionEnabled: boolean;
}