import prisma from "@/lib/prisma";
import {decryptCredential, encryptCredential} from "./encrypt-credentials";
import { CredentialType } from "@prisma/client";
import {
    CredentialCreateRequest,
    DecryptedCredentialPayload,
    SafeCredentialResponse
} from "@/types/credentials/credential-types";
import { JsonValue } from "@prisma/client/runtime/library";


export async function storeCredential(userId: string, credentialData: CredentialCreateRequest): Promise<SafeCredentialResponse> {
    const encryptedCredential = encryptCredential(credentialData.credential);

    // validate that the credential type is valid and exist in the enum CredentialType
    if (!Object.values(CredentialType).includes(credentialData.type)) {
        throw new Error("Invalid credential type");
    }

    try {
        const newCredential = await prisma.credential.create({
            data: {
                name: credentialData.name,
                type: credentialData.type,
                secret: encryptedCredential,
                userId: userId,
                config: credentialData.config as JsonValue,
            }
        });
        return {
            id: newCredential.id,
            name: newCredential.name,
            type: newCredential.type,
            createdAt: newCredential.createdAt,
            updatedAt: newCredential.updatedAt,
            config: newCredential.config
        };
    } catch (error) {
        throw new Error("Error storing credentials", error)
    }
}

export async function updateCredential(userId: string, credentialId: string, credentials: DecryptedCredentialPayload): Promise<SafeCredentialResponse> {
    const encryptedCredential = encryptCredential(credentials);

    try {
        const updatedCredential = await prisma.credential.update({
            where: {
                id: credentialId,
                userId: userId,
            },
            data: {
                secret: encryptedCredential,
            }
        });
        return {
            id: updatedCredential.id,
            name: updatedCredential.name,
            type: updatedCredential.type,
            createdAt: updatedCredential.createdAt,
            updatedAt: updatedCredential.updatedAt,
            config: updatedCredential.config
        };
    } catch (error) {
        throw new Error("Error updating credentials", error)
    }
}

export async function deleteCredential(userId: string, credentialId: string) {
    try {
         await prisma.credential.delete({
            where: {
                userId: userId,
                id: credentialId
            }
        })
    } catch (error) {
        throw new Error("Error deleting credentials", error)
    }
}


export async function getAllUserCredentials(userId: string): Promise<SafeCredentialResponse[]> {
    try {
        const credentials = await prisma.credential.findMany({
            where: {
                userId: userId
            },
            select: {
                id: true,
                name: true,
                type: true,
                createdAt: true,
                updatedAt: true,
                config: true
            }
        });
        return credentials.map(c => ({...c, type: c.type, config: c.config}));
    } catch (error) {
        throw new Error("Error getting credentials", error)
    }
}

export async function getCredential(userId: string, credentialId: string): Promise<SafeCredentialResponse | null> {
    try {
        const credential = await prisma.credential.findUnique({
            where: {
                id: credentialId,
                userId: userId,
            },
            select: {
                id: true,
                name: true,
                type: true,
                createdAt: true,
                updatedAt: true,
                config: true
            }
        });
        if (!credential) {
            return null;
        }
        return {...credential, type: credential.type, config: credential.config};
    } catch (error) {
        throw new Error("Error getting credentials", error)
    }
}